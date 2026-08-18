import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database, ReportStatus } from "@/lib/supabase/database.types";
import { getReferenceRangesForField } from "./testCatalog";
import { generateResultReference } from "./security";
import { hasPermission, permissionForReportTransition, type StaffRole } from "@/lib/auth/permissions";

type LabReport = Database["public"]["Tables"]["lab_reports"]["Row"];
type LabReportInsert = Database["public"]["Tables"]["lab_reports"]["Insert"];
type ReportTest = Database["public"]["Tables"]["report_tests"]["Row"];

/**
 * Data-access layer for the "Add New Result" workflow (Phase 2A §C).
 * Every mutating function requires an `actorRole` (from
 * lib/auth/session.ts `getCurrentStaff()`), checked with
 * lib/auth/permissions.ts before touching the database — this is
 * defense-in-depth alongside the RLS policies in
 * supabase/migrations/20260817090002_rbac_rls_policies.sql. Not wired into
 * the Admin Results UI yet — that wiring is left for a future phase, but
 * the functions are ready to call with a real authenticated actor now that
 * Phase 3 auth exists.
 */

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateLabReportInput {
  patientId: string;
  patientNameSnapshot: string;
  patientSexSnapshot?: Database["public"]["Tables"]["patients"]["Row"]["sex"];
  patientDobSnapshot?: string | null;
  labNumber: string;
  request?: string;
  specimen?: string;
  dateCollected?: string;
  createdBy?: string; // auth.users id of the actor, for audit fields
  actorRole: StaffRole;
}

export async function createLabReport(input: CreateLabReportInput): Promise<LabReport> {
  if (!hasPermission(input.actorRole, "reports.create_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot create a lab report.`);
  }

  const supabase = getServiceRoleClient();

  const insert: LabReportInsert = {
    patient_id: input.patientId,
    patient_name_snapshot: input.patientNameSnapshot,
    patient_sex_snapshot: input.patientSexSnapshot ?? null,
    patient_dob_snapshot: input.patientDobSnapshot ?? null,
    lab_number: input.labNumber,
    request: input.request,
    specimen: input.specimen,
    date_collected: input.dateCollected,
    status: "draft",
    current_version_number: 1,
    created_by: input.createdBy ?? null,
  };

  const { data: report, error } = await supabase.from("lab_reports").insert(insert).select().single();
  if (error) throw error;

  await writeVersionSnapshot(report.id, 1, "created", input.createdBy);

  return report;
}

export async function addTestToReport(
  labReportId: string,
  testId: string,
  actorRole: StaffRole,
  comment?: string
): Promise<ReportTest> {
  if (!hasPermission(actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot edit a report.`);
  }
  await assertReportIsEditable(labReportId);

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_tests")
    .insert({ lab_report_id: labReportId, test_id: testId, comment })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Result entry
// ---------------------------------------------------------------------------

export interface SetFieldResultInput {
  reportTestId: string;
  testId: string;
  templateFieldId: string;
  actorRole: StaffRole;
  valueText?: string;
  valueNumeric?: number;
  unit?: string;
  sex?: Database["public"]["Tables"]["patients"]["Row"]["sex"];
  flag?: Database["public"]["Tables"]["result_field_values"]["Row"]["flag"];
}

/**
 * Saves one field's result value. The reference range is resolved from the
 * `reference_ranges` config *now* and copied onto the row as
 * `reference_range_display` — a later edit to reference_ranges will never
 * change what this saved result shows (Phase 2B rule #6).
 */
export async function setFieldResult(input: SetFieldResultInput) {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot enter results.`);
  }

  const range = await getReferenceRangesForField(input.testId, input.templateFieldId, input.sex ?? null);

  const referenceRangeDisplay = range
    ? range.range_text ?? formatNumericRange(range.range_low, range.range_high, range.unit)
    : null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("result_field_values")
    .upsert(
      {
        report_test_id: input.reportTestId,
        template_field_id: input.templateFieldId,
        value_text: input.valueText,
        value_numeric: input.valueNumeric,
        unit: input.unit ?? range?.unit ?? null,
        reference_range_display: referenceRangeDisplay,
        flag: input.flag,
      },
      { onConflict: "report_test_id,template_field_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setTableCellResult(input: {
  reportTestId: string;
  templateTableRowId: string;
  templateTableColumnId: string;
  value: string;
  actorRole: StaffRole;
}) {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot enter results.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("result_table_cells")
    .upsert(
      {
        report_test_id: input.reportTestId,
        template_table_row_id: input.templateTableRowId,
        template_table_column_id: input.templateTableColumnId,
        value: input.value,
      },
      { onConflict: "report_test_id,template_table_row_id,template_table_column_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

function formatNumericRange(low: number | null, high: number | null, unit: string | null): string | null {
  if (low === null && high === null) return null;
  const range = low !== null && high !== null ? `${low}\u2013${high}` : String(low ?? high);
  return unit ? `${range} ${unit}` : range;
}

// ---------------------------------------------------------------------------
// Status workflow — draft -> reviewed -> published -> archived
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["reviewed"],
  reviewed: ["draft", "published"],
  published: ["archived"], // further edits to a published report go through amendReport(), not this
  archived: [],
};

// report_versions.change_type doesn't have a literal "draft" entry (sending
// a reviewed report back to draft is logged as an amendment, not a new
// lifecycle stage) — map status transitions to the version's change_type.
const CHANGE_TYPE_FOR_STATUS: Record<
  ReportStatus,
  Database["public"]["Tables"]["report_versions"]["Row"]["change_type"]
> = {
  draft: "amended",
  reviewed: "reviewed",
  published: "published",
  archived: "archived",
};

export async function transitionReportStatus(
  labReportId: string,
  toStatus: ReportStatus,
  actorId?: string,
  actorRole?: StaffRole
): Promise<LabReport> {
  // App-layer authorization: RLS grants several roles UPDATE on lab_reports
  // at the table level (they need it for draft editing), but only specific
  // roles may action a review/publish/archive transition. Callers should
  // always pass actorRole from an authenticated session (see
  // lib/auth/session.ts) — omitting it is treated as unauthorized for any
  // transition beyond "draft".
  if (toStatus !== "draft") {
    const required = permissionForReportTransition(toStatus as "reviewed" | "published" | "archived");
    if (!actorRole || !hasPermission(actorRole, required)) {
      throw new Error(
        `Forbidden: role "${actorRole ?? "unknown"}" cannot transition a report to "${toStatus}".`
      );
    }
  }

  const supabase = getServiceRoleClient();
  const { data: current, error: fetchError } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("id", labReportId)
    .single();

  if (fetchError) throw fetchError;

  const currentStatus = current.status as ReportStatus;

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(toStatus)) {
    throw new Error(`Cannot transition report from "${currentStatus}" to "${toStatus}".`);
  }

  const now = new Date().toISOString();
  const update: Database["public"]["Tables"]["lab_reports"]["Update"] = {
    status: toStatus,
    last_modified_by: actorId ?? null,
    last_modified_at: now,
  };

  if (toStatus === "reviewed") {
    update.reviewed_by = actorId ?? null;
    update.reviewed_at = now;
  }

  if (toStatus === "published") {
    update.published_by = actorId ?? null;
    update.published_at = now;
    // Result Reference is opaque/random and generated ONLY at publish time
    // (Phase 2B rules #2-3) — never before, never derived from lab_number.
    if (!current.result_reference) {
      update.result_reference = generateResultReference();
    }
  }

  if (toStatus === "archived") {
    update.archived_by = actorId ?? null;
    update.archived_at = now;
  }

  const nextVersionNumber = current.current_version_number + 1;
  update.current_version_number = nextVersionNumber;

  const { data: updated, error: updateError } = await supabase
    .from("lab_reports")
    .update(update)
    .eq("id", labReportId)
    .select()
    .single();

  if (updateError) throw updateError;

  await writeVersionSnapshot(labReportId, nextVersionNumber, CHANGE_TYPE_FOR_STATUS[toStatus], actorId);

  return updated;
}

/**
 * The only way to change a published report's content. Never overwrites in
 * place — it snapshots the current state as a version first (Phase 2B rules
 * #7-8), then the caller applies changes via setFieldResult/setTableCellResult
 * as normal, and finally calls this again (or transitionReportStatus) to
 * record the amendment.
 */
export async function recordAmendment(labReportId: string, actorRole: StaffRole, actorId?: string) {
  if (!hasPermission(actorRole, "reports.review")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot amend a published report.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current, error } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("id", labReportId)
    .single();

  if (error) throw error;

  if (current.status !== "published" && current.status !== "archived") {
    throw new Error("recordAmendment is only for published or archived reports.");
  }

  const nextVersionNumber = current.current_version_number + 1;

  await supabase
    .from("lab_reports")
    .update({
      current_version_number: nextVersionNumber,
      last_modified_by: actorId ?? null,
      last_modified_at: new Date().toISOString(),
    })
    .eq("id", labReportId);

  await writeVersionSnapshot(labReportId, nextVersionNumber, "amended", actorId);
}

async function assertReportIsEditable(labReportId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("lab_reports")
    .select("status")
    .eq("id", labReportId)
    .single();

  if (error) throw error;

  if (data.status === "published" || data.status === "archived") {
    throw new Error(
      "This report is published/archived and cannot be edited directly. Use recordAmendment() first."
    );
  }
}

// ---------------------------------------------------------------------------
// Version snapshots
// ---------------------------------------------------------------------------

async function writeVersionSnapshot(
  labReportId: string,
  versionNumber: number,
  changeType: Database["public"]["Tables"]["report_versions"]["Row"]["change_type"],
  actorId?: string
) {
  const supabase = getServiceRoleClient();
  const snapshot = await buildReportSnapshot(labReportId);

  const { error } = await supabase.from("report_versions").insert({
    lab_report_id: labReportId,
    version_number: versionNumber,
    change_type: changeType,
    snapshot,
    changed_by: actorId ?? null,
  });

  if (error) throw error;
}

async function buildReportSnapshot(labReportId: string): Promise<Record<string, unknown>> {
  const supabase = getServiceRoleClient();

  const { data: report, error: reportError } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("id", labReportId)
    .single();
  if (reportError) throw reportError;

  const { data: reportTests, error: testsError } = await supabase
    .from("report_tests")
    .select("*")
    .eq("lab_report_id", labReportId);
  if (testsError) throw testsError;

  const reportTestIds = ((reportTests ?? []) as ReportTest[]).map((rt) => rt.id);

  const [{ data: fieldValues, error: fvError }, { data: tableCells, error: tcError }] = await Promise.all([
    reportTestIds.length
      ? supabase.from("result_field_values").select("*").in("report_test_id", reportTestIds)
      : Promise.resolve({ data: [], error: null }),
    reportTestIds.length
      ? supabase.from("result_table_cells").select("*").in("report_test_id", reportTestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (fvError) throw fvError;
  if (tcError) throw tcError;

  return {
    report,
    reportTests: reportTests ?? [],
    fieldValues: fieldValues ?? [],
    tableCells: tableCells ?? [],
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getReportWithResults(labReportId: string) {
  return buildReportSnapshot(labReportId);
}

export async function getReportVersionHistory(labReportId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_versions")
    .select("id, version_number, change_type, changed_by, changed_at")
    .eq("lab_report_id", labReportId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
