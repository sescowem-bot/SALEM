import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database, ReportStatus } from "@/lib/supabase/database.types";
import { getReferenceRangesForField } from "./testCatalog";
import { generateResultReference, generateAccessCode, verifyAccessCode } from "./security";
import { hasPermission, permissionForReportTransition, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { dispatchReportNotification } from "./notifications";
import { slugify } from "@/lib/utils/slug";

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

  const { data: existing } = await supabase
    .from("report_tests")
    .select("id")
    .eq("lab_report_id", labReportId)
    .eq("test_id", testId)
    .maybeSingle();
  if (existing) {
    throw new Error("That investigation is already on this report.");
  }

  // Append at the end — sort_order already existed on report_tests for
  // reordering (see reorderReportTest below), but this insert never set it,
  // so every test added this way landed at sort_order 0. Fixing that here
  // is what makes "add investigation" + "reorder" behave sensibly together.
  const { data: maxSort } = await supabase
    .from("report_tests")
    .select("sort_order")
    .eq("lab_report_id", labReportId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("report_tests")
    .insert({ lab_report_id: labReportId, test_id: testId, comment, sort_order: (maxSort?.sort_order ?? 0) + 1 })
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    action: "REPORT_TEST_ADDED",
    entityType: "report_tests",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { labReportId, testId },
  });

  return data;
}

/**
 * Removes one investigation from a report before it's been submitted for
 * approval/published (assertReportIsEditable enforces this — the same guard
 * every other draft-editing function in this file already uses). Cascades
 * to result_field_values / result_table_cells via their existing
 * `on delete cascade` FKs (Phase 2B), so no separate cleanup is needed here.
 */
export async function removeTestFromReport(
  labReportId: string,
  reportTestId: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot edit a report.`);
  }
  await assertReportIsEditable(labReportId);

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_tests")
    .delete()
    .eq("id", reportTestId)
    .eq("lab_report_id", labReportId)
    .select("test_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That investigation is no longer on this report.");

  await logAudit({
    action: "REPORT_TEST_REMOVED",
    entityType: "report_tests",
    entityId: reportTestId,
    actorId,
    actorRole,
    metadata: { labReportId, testId: data.test_id },
  });
}

/**
 * Moves an investigation up/down within its report by swapping sort_order
 * with its nearest neighbour — same swap pattern as
 * lib/data/testCatalog.ts reorderService, scoped to one report instead of
 * one category.
 */
export async function reorderReportTest(
  labReportId: string,
  reportTestId: string,
  direction: "up" | "down",
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot edit a report.`);
  }
  await assertReportIsEditable(labReportId);

  const supabase = getServiceRoleClient();
  const { data: siblings, error } = await supabase
    .from("report_tests")
    .select("id, sort_order")
    .eq("lab_report_id", labReportId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === reportTestId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const neighbour = list[swapIndex];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("report_tests").update({ sort_order: neighbour.sort_order }).eq("id", current.id),
    supabase.from("report_tests").update({ sort_order: current.sort_order }).eq("id", neighbour.id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  await logAudit({
    action: "REPORT_TEST_REORDERED",
    entityType: "report_tests",
    entityId: reportTestId,
    actorId,
    actorRole,
    metadata: { labReportId, reordered: direction },
  });
}

// ---------------------------------------------------------------------------
// Custom (ad hoc, report-scoped) investigations
// ---------------------------------------------------------------------------

export interface CustomInvestigationFieldInput {
  label: string;
  inputType: "numeric" | "text";
  unit?: string;
  referenceRange?: string;
}

export interface CreateCustomInvestigationInput {
  labReportId: string;
  categoryId: string;
  name: string;
  structureType: "field_based" | "table_based";
  comment?: string;
  fields?: CustomInvestigationFieldInput[]; // used when structureType === "field_based"
  columns?: string[]; // used when structureType === "table_based"
  rows?: string[]; // used when structureType === "table_based"
  actorRole: StaffRole;
  actorId?: string;
}

/**
 * Creates a brand-new investigation — a real `tests` row with its own
 * `test_templates` (+ `template_fields` or `template_table_columns`/
 * `template_table_rows`) row(s), exactly the structures a normal catalogue
 * test uses — then adds it to the report via addTestToReport(). This is
 * deliberately NOT a separate/duplicate result-storage system (per the
 * task's instruction to reuse existing structures): once created, a custom
 * investigation's result is entered, saved, versioned, PDF-rendered and
 * displayed on /results through the exact same field/table code paths as
 * any catalogue test — and it's `is_active: true` in a staff-chosen real
 * category, so it's a genuine, reusable catalogue entry from the moment
 * it's created, not a hidden one-off. `is_custom` on the `tests` row is
 * metadata only, marking how it was created for anyone auditing later.
 *
 * `tests.name` keeps its normal global-uniqueness constraint (no schema
 * workaround) — a duplicate name is treated as "you probably want the
 * investigation that already exists" and reported back as a normal
 * validation error rather than silently allowed to collide.
 */
export async function createCustomInvestigation(input: CreateCustomInvestigationInput): Promise<ReportTest> {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot edit a report.`);
  }
  await assertReportIsEditable(input.labReportId);

  const name = input.name.trim();
  if (!name) throw new Error("Investigation name is required.");
  if (!input.categoryId) throw new Error("Choose a category for this investigation.");

  const fields = (input.fields ?? []).filter((f) => f.label.trim().length > 0);
  const columns = (input.columns ?? []).map((c) => c.trim()).filter(Boolean);
  const rows = (input.rows ?? []).map((r) => r.trim()).filter(Boolean);

  if (input.structureType === "field_based" && fields.length === 0) {
    throw new Error("Add at least one result parameter.");
  }
  if (input.structureType === "table_based" && (columns.length === 0 || rows.length === 0)) {
    throw new Error("A table-style investigation needs at least one column and one row.");
  }

  const supabase = getServiceRoleClient();
  const suffix = randomUUID().slice(0, 8);

  // test_templates.name only needs to be unique at the database level and
  // is never rendered to a user (only the investigation's own `name` is) —
  // the suffix just guarantees that.
  const { data: template, error: templateError } = await supabase
    .from("test_templates")
    .insert({
      name: `${name} (custom ${suffix})`,
      structure_type: input.structureType,
      is_active: true,
    })
    .select()
    .single();
  if (templateError) throw templateError;

  let pendingReferenceRanges: { template_field_id: string; range_text: string }[] = [];

  try {
    if (input.structureType === "field_based") {
      const fieldRows = fields.map((f, i) => ({
        template_id: template.id,
        field_key: `${slugify(f.label) || "param"}-${i}`,
        label: f.label.trim(),
        input_type: f.inputType,
        unit: f.unit?.trim() || null,
        sort_order: i,
      }));
      const { data: insertedFields, error: fieldsError } = await supabase
        .from("template_fields")
        .insert(fieldRows)
        .select();
      if (fieldsError) throw fieldsError;

      pendingReferenceRanges = (insertedFields ?? [])
        .map((field, i) => {
          const rangeText = fields[i]?.referenceRange?.trim();
          return rangeText ? { template_field_id: field.id, range_text: rangeText } : null;
        })
        .filter((v): v is { template_field_id: string; range_text: string } => v !== null);
    } else {
      const columnRows = columns.map((label, i) => ({
        template_id: template.id,
        column_key: `${slugify(label) || "col"}-${i}`,
        column_label: label,
        sort_order: i,
      }));
      const { error: colError } = await supabase.from("template_table_columns").insert(columnRows);
      if (colError) throw colError;

      const rowRows = rows.map((label, i) => ({
        template_id: template.id,
        row_key: `${slugify(label) || "row"}-${i}`,
        row_label: label,
        sort_order: i,
      }));
      const { error: rowError } = await supabase.from("template_table_rows").insert(rowRows);
      if (rowError) throw rowError;
    }
  } catch (err) {
    // The template row already committed — clean it up rather than leaving
    // an orphaned, field-less template behind on a validation/insert failure.
    await supabase.from("test_templates").delete().eq("id", template.id);
    throw err;
  }

  const { data: maxSort } = await supabase
    .from("tests")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({
      category_id: input.categoryId,
      template_id: template.id,
      name,
      slug: `${slugify(name) || "custom-investigation"}-${suffix}`,
      is_active: true,
      is_custom: true,
      sort_order: (maxSort?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (testError) {
    await supabase.from("test_templates").delete().eq("id", template.id);
    if (testError.code === "23505") {
      throw new Error(
        `An investigation named "${name}" already exists in the catalogue — add it from the catalogue instead, or choose a different name.`
      );
    }
    throw testError;
  }

  if (pendingReferenceRanges.length > 0) {
    const { error: rrError } = await supabase.from("reference_ranges").insert(
      pendingReferenceRanges.map((r) => ({
        test_id: test.id,
        template_field_id: r.template_field_id,
        range_text: r.range_text,
      }))
    );
    if (rrError) throw rrError;
  }

  const reportTest = await addTestToReport(input.labReportId, test.id, input.actorRole, input.comment, input.actorId);

  await logAudit({
    action: "CUSTOM_TEST_CREATED",
    entityType: "tests",
    entityId: test.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { custom: true, name, labReportId: input.labReportId, structureType: input.structureType },
  });

  return reportTest;
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
    const { data: reportRow, error } = await supabase
      .from("lab_reports")
      .update({
        submitted_for_review: false,
        report_comment: comment,
        last_modified_by: actorId ?? null,
        last_modified_at: new Date().toISOString(),
      })
      .eq("id", labReportId)
      .select("created_by")
      .single();
    if (error) throw error;

    await logAudit({
      action: "RESULT_RETURNED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { comment },
    });

    // Advanced 6 §1 event E.
    if (reportRow.created_by) {
      dispatchReportNotification({
        eventType: "report_returned",
        labReportId,
        recipientType: "staff",
        recipientStaffId: reportRow.created_by,
        comment,
      }).catch((err) => console.error("[labReports] report_returned notification failed", labReportId, err));
    }
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

    // Advanced 6 §1 events F/G — the report is now genuinely
    // patient-visible (published status + an access code exists). Only
    // fires on the transition that actually provisions the access code —
    // transitionReportStatus above already rejects a second call once a
    // report is "published" (its only outgoing transition is "archived"),
    // so in practice this always runs exactly once per report.
    await logAudit({
      action: "PATIENT_RESULT_MADE_AVAILABLE",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { resultReference: report.result_reference },
    });

    dispatchReportNotification({
      eventType: "patient_result_available",
      labReportId,
      recipientType: "patient",
      recipientPatientId: report.patient_id,
      accessCodePlaintext: plaintext,
    }).catch((err) => console.error("[labReports] patient_result_available notification failed", labReportId, err));
  }

  return { report, accessCodePlaintext };
}

// ---------------------------------------------------------------------------
// Status workflow — draft -> reviewed -> published -> archived
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["reviewed"],
  reviewed: ["draft", "published"],
  published: ["archived", "draft"], // "draft" here = an authorized unlock-for-correction (see unlockPublishedReportForCorrection), not the reviewed->draft "return for correction" path
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
    // currentStatus distinguishes two very different real-world events that
    // both happen to land the report back in "draft": an approver sending a
    // report back before it was ever published (reviewed -> draft, the
    // original "return for correction"), versus a Super Admin/pathologist
    // reopening an ALREADY-published report to fix a mistake in a result
    // the patient may already have seen (published -> draft, "unlock for
    // correction" — see unlockPublishedReportForCorrection below). The
    // second is a materially different, more sensitive event and must not
    // be logged or announced as if it were the first.
    const isUnlockFromPublished = currentStatus === "published";

    await logAudit({
      action: isUnlockFromPublished ? "RESULT_AMENDED" : "RESULT_RETURNED",
      entityType: "lab_reports",
      entityId: labReportId,
      actorId,
      actorRole,
      metadata: { comment, previousStatus: currentStatus },
    });

    // Advanced 6 §1 event E — only for the reviewed -> draft return path
    // (returnForCorrection's other branch, still-draft, has its own
    // identical dispatch right after its own RESULT_RETURNED log above).
    // Deliberately NOT fired for an unlock-from-published: that's an
    // internal correction initiated by an admin/pathologist, not an
    // approver sending work back to its author, and "report_returned"'s
    // wording ("was sent back for correction") would misrepresent it.
    if (!isUnlockFromPublished && updated.created_by) {
      dispatchReportNotification({
        eventType: "report_returned",
        labReportId,
        recipientType: "staff",
        recipientStaffId: updated.created_by,
        comment,
      }).catch((err) => console.error("[labReports] report_returned notification failed", labReportId, err));
    }
  }

  return updated;
}

/**
 * The only way to reopen an already-published report for editing.
 *
 * A published report is deliberately locked — assertReportIsEditable()
 * below rejects every field/table-cell save while status is "published" or
 * "archived", specifically so nothing can silently change a result the
 * patient may already have downloaded. This function is the explicit,
 * audited escape hatch: it moves the report back to "draft" (reusing the
 * existing transitionReportStatus machinery, which snapshots the current
 * state as a new report_versions row and logs RESULT_AMENDED — see the
 * isUnlockFromPublished branch there), which is what actually lifts the
 * assertReportIsEditable block. From there, staff edit fields exactly like
 * any other draft, then resubmit -> re-approve -> re-publish as normal.
 *
 * Deliberately does NOT touch access_code_hash or result_reference —
 * publishReport() only generates those when they don't already exist, so
 * the patient's existing reference + access code keep working unchanged;
 * they'll simply see the corrected result once the report is republished.
 * The final PDF the patient may have already downloaded stays exactly as
 * it was (report_final_documents is keyed by version_number and is never
 * overwritten) — re-approval produces a NEW final PDF at the new version,
 * it does not replace the old one's stored file.
 *
 * "archived" reports are deliberately out of scope here — reopening a
 * report that was already superseded/closed out is a bigger decision than
 * "fix a mistake shortly after publishing" and isn't supported yet.
 */
export async function unlockPublishedReportForCorrection(
  labReportId: string,
  actorRole: StaffRole,
  actorId?: string,
  reason?: string
): Promise<LabReport> {
  if (!hasPermission(actorRole, "reports.review")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot unlock a published report for correction.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current, error } = await supabase
    .from("lab_reports")
    .select("status")
    .eq("id", labReportId)
    .single();
  if (error) throw error;

  if (current.status !== "published") {
    throw new Error(`Only a published report can be unlocked for correction (current status: "${current.status}").`);
  }

  return transitionReportStatus(labReportId, "draft", actorId, actorRole, reason);
}

/**
 * Reissues a published report's patient access code. The old code is
 * hashed-only (generateAccessCode in lib/data/security.ts never persists
 * the plaintext, by design — same posture as a password) so a lost or
 * never-received code cannot be looked up or redisplayed, only replaced.
 * The old code stops working the instant this runs — there is no grace
 * period, so this should only be used once the admin is ready to actually
 * redeliver the new one to the patient.
 *
 * Does NOT touch result_reference (the Lab Reference Number) — that stays
 * stable for the life of the report; only the access code half of the pair
 * changes. Does NOT email the new code (consistent with
 * lib/email/templates.ts buildPatientResultAvailableTemplate's deliberate
 * choice to never put the code in an email) — the admin sees it once on
 * screen here and is responsible for delivering it out-of-band, same as
 * the original publish flow.
 */
export async function resetPatientAccessCode(
  labReportId: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<{ report: LabReport; accessCodePlaintext: string }> {
  if (!hasPermission(actorRole, "reports.publish")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot reset a patient access code.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current, error: fetchError } = await supabase
    .from("lab_reports")
    .select("status")
    .eq("id", labReportId)
    .single();
  if (fetchError) throw fetchError;

  if (current.status !== "published") {
    throw new Error(`Only a published report has a patient access code to reset (current status: "${current.status}").`);
  }

  const { plaintext, hash } = generateAccessCode();

  const { data: report, error: updateError } = await supabase
    .from("lab_reports")
    .update({ access_code_hash: hash })
    .eq("id", labReportId)
    .select()
    .single();
  if (updateError) throw updateError;

  await logAudit({
    action: "PATIENT_ACCESS_CODE_RESET",
    entityType: "lab_reports",
    entityId: labReportId,
    actorId,
    actorRole,
  });

  return { report, accessCodePlaintext: plaintext };
}

/**
 * Manual "send/resend to patient now" — triggered from the access-code
 * reveal box right after a publish or a reset, using the plaintext that's
 * already in the admin's browser at that moment (never re-fetched — see
 * resetPatientAccessCode above for why that's impossible after the fact).
 * Always includes the code in this one message, regardless of
 * site_settings.patient_email_includes_access_code — that setting governs
 * the AUTOMATIC email only; a manual resend is the admin explicitly
 * choosing to send it, in the moment, for this one patient.
 *
 * Re-verifies the supplied plaintext against the current access_code_hash
 * before sending anything — protects against a stale code still sitting in
 * an open browser tab being resent after it was reset elsewhere.
 */
export async function sendAccessCodeToPatientNow(
  labReportId: string,
  accessCodePlaintext: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "reports.publish")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot send a patient access code.`);
  }

  const supabase = getServiceRoleClient();
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("status, access_code_hash, patient_id")
    .eq("id", labReportId)
    .single();
  if (error) throw error;

  if (report.status !== "published" || !report.access_code_hash) {
    throw new Error("This report has no active access code to send.");
  }
  if (!verifyAccessCode(accessCodePlaintext, report.access_code_hash)) {
    throw new Error("That code is no longer current — it may have been reset. Refresh the page and try again.");
  }

  await dispatchReportNotification({
    eventType: "patient_result_available",
    labReportId,
    recipientType: "patient",
    recipientPatientId: report.patient_id,
    accessCodePlaintext,
    forceIncludeAccessCode: true,
  });

  // dispatchReportNotification's own NOTIFICATION_CREATED/SENT/FAILED audit
  // entries are system-attributed (no actor column on that table) — this
  // line is what actually attributes the manual trigger to a specific
  // staff member in the server logs, since a deliberate "send this now"
  // click is worth being able to trace to who clicked it.
  console.info(`[labReports] Access code for report ${labReportId} manually resent by staff ${actorId ?? "unknown"}.`);
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
      "This report is published/archived and cannot be edited directly. Use unlockPublishedReportForCorrection() first."
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

/**
 * Admin report index (Advanced 5 §6) — search/filter across all reports,
 * regardless of status or who created them. Distinct from listReviewQueue
 * (pathologist's queue) / listDraftReports (lab staff worklist) / the
 * per-user listMyReports in lib/data/approvals.ts: this is the general
 * "browse everything" screen for reports.view roles, gated the same as
 * every other report read in this file.
 */
export async function listAllReports(
  actorRole: StaffRole,
  filters?: { query?: string; status?: ReportStatus | "all" }
) {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view the report index.`);
  }

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("lab_reports")
    .select(
      "id, lab_number, patient_name_snapshot, status, submitted_for_review, result_reference, access_code_hash, created_at, reviewed_at, published_at, assigned_approver:staff_profiles!lab_reports_assigned_approver_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.query && filters.query.trim().length > 0) {
    const term = filters.query.trim();
    query = query.or(`lab_number.ilike.%${term}%,patient_name_snapshot.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
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
