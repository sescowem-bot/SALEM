import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database, ReportStatus } from "@/lib/supabase/database.types";
import { getReferenceRangesForField } from "./testCatalog";
import { generateResultReference, generateAccessCode } from "./security";
import { hasPermission, permissionForReportTransition, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

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
  await logAudit({
    action: "VISIT_CREATED",
    entityType: "lab_reports",
    entityId: report.id,
    actorId: input.createdBy,
    actorRole: input.actorRole,
    metadata: { patientId: input.patientId, labNumber: input.labNumber },
  });
  await logAudit({
    action: "LAB_CODE_GENERATED",
    entityType: "lab_reports",
    entityId: report.id,
    actorId: input.createdBy,
    actorRole: input.actorRole,
    metadata: { labNumber: input.labNumber },
  });

  return report;
}

export async function addTestToReport(
  labReportId: string,
  testId: string,
  actorRole: StaffRole,
  comment?: string,
  actorId?: string
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

  await logAudit({
    action: "RESULT_CREATED",
    entityType: "report_tests",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { labReportId, testId },
  });

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
  actorId?: string;
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

  await logAudit({
    action: "RESULT_UPDATED",
    entityType: "result_field_values",
    entityId: data.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { reportTestId: input.reportTestId, templateFieldId: input.templateFieldId },
  });

  return data;
}

export async function setTableCellResult(input: {
  reportTestId: string;
  templateTableRowId: string;
  templateTableColumnId: string;
  value: string;
  actorRole: StaffRole;
  actorId?: string;
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

  await logAudit({
    action: "RESULT_UPDATED",
    entityType: "result_table_cells",
    entityId: data.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { reportTestId: input.reportTestId },
  });

  return data;
}

function formatNumericRange(low: number | null, high: number | null, unit: string | null): string | null {
  if (low === null && high === null) return null;
  const range = low !== null && high !== null ? `${low}\u2013${high}` : String(low ?? high);
  return unit ? `${range} ${unit}` : range;
}

// ---------------------------------------------------------------------------
// Review queue workflow (submitted_for_review flag, independent of `status`)
// ---------------------------------------------------------------------------

export async function submitForReview(labReportId: string, actorRole: StaffRole, actorId?: string) {
  if (!hasPermission(actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot submit a report for review.`);
  }
  await assertReportIsEditable(labReportId);

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("lab_reports")
    .update({ submitted_for_review: true, last_modified_by: actorId ?? null, last_modified_at: new Date().toISOString() })
    .eq("id", labReportId);
  if (error) throw error;

  await logAudit({
    action: "RESULT_SUBMITTED_FOR_REVIEW",
    entityType: "lab_reports",
    entityId: labReportId,
    actorId,
    actorRole,
  });
}

/**
 * Pathologist sends a report back for correction — from either the
 * "submitted, awaiting review" draft state or from "reviewed" (approved but
 * not yet published). Always lands back in an editable draft state for
 * laboratory_staff, never silently discards their entered values.
 */
export async function returnForCorrection(
  labReportId: string,
  actorRole: StaffRole,
  comment?: string,
  actorId?: string
) {
  if (!hasPermission(actorRole, "reports.review")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot return a report for correction.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current, error: fetchError } = await supabase
    .from("lab_reports")
    .select("status, current_version_number")
    .eq("id", labReportId)
    .single();
  if (fetchError) throw fetchError;

  if (current.status === "reviewed") {
    await transitionReportStatus(labReportId, "draft", actorId, actorRole, comment);
  } else if (current.status === "draft") {
    const { error } = await supabase
      .from("lab_reports")
      .update({
        submitted_for_review: false,
        report_comment: comment,
        last_modified_by: actorId ?? null,
        last_modified_at: new Date().toISOString(),
      })
      .eq("id", labReportId);
    if (error) throw error;

    await logAudit({
      action: "RESULT_RETURNED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { comment },
    });
  } else {
    throw new Error(`Cannot return a report with status "${current.status}" for correction.`);
  }
}

/**
 * Publishes a report: transitions status to "published" (generating the
 * opaque Result Reference if not already set) AND, only at this point,
 * generates the Access Code — returned once in plaintext for the pathologist
 * to hand to the patient out-of-band. Only the hash is ever persisted.
 */
export async function publishReport(
  labReportId: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<{ report: LabReport; accessCodePlaintext: string | null }> {
  const report = await transitionReportStatus(labReportId, "published", actorId, actorRole);

  let accessCodePlaintext: string | null = null;
  if (!report.access_code_hash) {
    const { plaintext, hash } = generateAccessCode();
    accessCodePlaintext = plaintext;

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("lab_reports").update({ access_code_hash: hash }).eq("id", labReportId);
    if (error) throw error;
  }

  return { report, accessCodePlaintext };
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
  actorRole?: StaffRole,
  comment?: string
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

  if (toStatus === "draft") {
    // Reviewed -> draft is a return-for-correction: clear the review flag so
    // it re-enters the "in progress" state, not the review queue.
    update.submitted_for_review = false;
    if (comment) update.report_comment = comment;
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

  if (toStatus === "reviewed") {
    await logAudit({
      action: "RESULT_APPROVED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
    });
  } else if (toStatus === "published") {
    await logAudit({
      action: "RESULT_PUBLISHED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { resultReference: updated.result_reference },
    });
  } else if (toStatus === "draft") {
    await logAudit({
      action: "RESULT_RETURNED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { comment },
    });
  }

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

/**
 * Full detail for the report editor / review screen: the report row, its
 * tests joined with test name + template (so the UI knows which inputs to
 * render), and any saved field/table values.
 */
export async function getReportDetail(labReportId: string) {
  const supabase = getServiceRoleClient();

  const { data: report, error: reportError } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("id", labReportId)
    .single();
  if (reportError) throw reportError;

  const { data: reportTests, error: rtError } = await supabase
    .from("report_tests")
    .select("*, tests(id, name, template_id, test_templates(id, name, structure_type))")
    .eq("lab_report_id", labReportId)
    .order("sort_order", { ascending: true });
  if (rtError) throw rtError;

  const reportTestIds = ((reportTests ?? []) as { id: string }[]).map((rt) => rt.id);

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

/** Pathologist review queue: drafts sent for review + reports already reviewed and awaiting publish. */
export async function listReviewQueue() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("lab_reports")
    .select(
      "id, lab_number, patient_name_snapshot, status, submitted_for_review, created_at, reviewed_at, report_tests(tests(name))"
    )
    .or("and(status.eq.draft,submitted_for_review.eq.true),status.eq.reviewed")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Laboratory staff worklist: their in-progress and returned drafts. */
export async function listDraftReports() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("lab_reports")
    .select("id, lab_number, patient_name_snapshot, status, submitted_for_review, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Report counts by status for the admin dashboard (Advanced 1 §2). Uses
 * `head: true` count queries rather than fetching rows, since the
 * dashboard only needs the numbers.
 */
export async function getReportStatusCounts(): Promise<Record<ReportStatus, number>> {
  const supabase = getServiceRoleClient();
  const statuses: ReportStatus[] = ["draft", "reviewed", "published", "archived"];

  const results = await Promise.all(
    statuses.map((status) =>
      supabase.from("lab_reports").select("id", { count: "exact", head: true }).eq("status", status)
    )
  );

  const counts = {} as Record<ReportStatus, number>;
  statuses.forEach((status, i) => {
    const { count, error } = results[i];
    if (error) throw error;
    counts[status] = count ?? 0;
  });
  return counts;
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
