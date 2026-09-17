import "server-only";
import { createHash } from "node:crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { verifyAccessCode } from "./security";
import { getSignedReportPdfUrl, downloadReportPdfBytes } from "./storage";
import { logAudit } from "./audit";
import { renderCurrentFinalReportPdfBuffer } from "./reportDocuments";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

export interface VerifyResultInput {
  resultReference: string;
  accessCode: string;
  ipAddress: string; // caller (Server Action/Route Handler) supplies the request IP
}

type AccessOutcome =
  | {
      ok: true;
      report: {
        id: string;
        lab_number: string;
        result_reference: string | null;
        patient_name_snapshot: string;
        patient_sex_snapshot: string | null;
        request: string | null;
        specimen: string | null;
        date_collected: string | null;
        date_reported: string | null;
        status: string;
        published_at: string | null;
        current_version_number: number;
      };
    }
  | { ok: false; reason: "rate_limited" | "not_found" | "invalid_code" | "not_published" };

export type VerifyResultOutcome =
  | { ok: true; result: PublishedResultDto }
  | { ok: false; reason: "rate_limited" | "not_found" | "invalid_code" | "not_published" };

export interface PublishedResultDto {
  labNumber: string;
  resultReference: string;
  patientName: string;
  patientSex: string | null;
  request: string | null;
  specimen: string | null;
  dateCollected: string | null;
  dateReported: string | null;
  publishedAt: string | null;
  documentVersion: number;
  hasFinalPdf: boolean;
  tests: {
    testName: string;
    comment: string | null;
    fields: { label: string; value: string; unit: string | null; referenceRange: string | null; flag: string | null }[];
    table: { rowLabel: string; columnLabel: string; value: string | null }[];
    pdfSignedUrl: string | null;
  }[];
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

async function isRateLimited(ipHash: string): Promise<boolean> {
  const supabase = getServiceRoleClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("result_access_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (error) throw error;
  return (count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW;
}

async function recordAttempt(ipHash: string, resultReference: string, succeeded: boolean) {
  const supabase = getServiceRoleClient();
  await supabase
    .from("result_access_attempts")
    .insert({ ip_hash: ipHash, result_reference: resultReference, succeeded });
}

/**
 * The single, shared reference + access-code check — rate limiting,
 * "must be published", and the code hash comparison. Both
 * verifyPatientResult (page view) and downloadPatientFinalPdf (§6's
 * controlled download route) call this rather than each re-implementing
 * the check, so the security model can never drift between the two.
 * Deliberately does NOT weaken or shortcut anything for the download path
 * — a download request re-verifies the code exactly like a page view does.
 */
async function authenticatePatientAccess(input: VerifyResultInput): Promise<AccessOutcome> {
  const ipHash = hashIp(input.ipAddress);

  if (await isRateLimited(ipHash)) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getServiceRoleClient();
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select(
      "id, lab_number, result_reference, access_code_hash, patient_name_snapshot, patient_sex_snapshot, request, specimen, date_collected, date_reported, status, published_at, current_version_number"
    )
    .eq("result_reference", input.resultReference)
    .maybeSingle();

  if (error) throw error;

  if (!report || report.status !== "published") {
    await recordAttempt(ipHash, input.resultReference, false);
    return { ok: false, reason: report ? "not_published" : "not_found" };
  }

  if (!report.access_code_hash || !verifyAccessCode(input.accessCode, report.access_code_hash)) {
    await recordAttempt(ipHash, input.resultReference, false);
    return { ok: false, reason: "invalid_code" };
  }

  await recordAttempt(ipHash, input.resultReference, true);
  return { ok: true, report };
}

/**
 * Public entry point for the /results verification page. Never bypasses
 * rate limiting or the access-code check, regardless of how it's called.
 * Returns only published-report data — no staff notes, no audit trail, no
 * unrelated patient fields, and (troubleshooting §6) never a raw Supabase
 * signed URL — only a `hasFinalPdf` flag; the actual bytes are fetched
 * through the app-controlled /results/download route.
 */
export async function verifyPatientResult(input: VerifyResultInput): Promise<VerifyResultOutcome> {
  const access = await authenticatePatientAccess(input);
  if (!access.ok) return access;
  const { report } = access;

  await logAudit({
    action: "RESULT_VERIFIED_ACCESS",
    entityType: "lab_reports",
    entityId: report.id,
    metadata: { resultReference: input.resultReference },
  });

  // Advanced 6 §3/§4 — use the ALREADY-generated official final PDF
  // (Advanced 5's report_final_documents), matched to this exact published
  // version, never a freshly generated or independent document.
  const supabase = getServiceRoleClient();
  const [{ data: finalDoc }, { data: approvedRequest }] = await Promise.all([
    supabase
      .from("report_final_documents")
      .select("storage_path")
      .eq("lab_report_id", report.id)
      .eq("version_number", report.current_version_number)
      .maybeSingle(),
    supabase
      .from("approval_requests")
      .select("id")
      .eq("lab_report_id", report.id)
      .eq("status", "approved")
      .not("decided_by", "is", null)
      .not("decided_at", "is", null)
      .order("decided_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: reportTests, error: rtError } = await supabase
    .from("report_tests")
    .select("id, comment, pdf_storage_path, test_id, tests(name)")
    .eq("lab_report_id", report.id)
    .order("sort_order", { ascending: true });
  if (rtError) throw rtError;

  const reportTestIds = ((reportTests ?? []) as { id: string }[]).map((rt) => rt.id);

  const [{ data: fieldValues, error: fvError }, { data: tableCells, error: tcError }] = await Promise.all([
    reportTestIds.length
      ? supabase
          .from("result_field_values")
          .select("report_test_id, value_text, value_numeric, unit, reference_range_display, flag, template_fields(label)")
          .in("report_test_id", reportTestIds)
      : Promise.resolve({ data: [], error: null }),
    reportTestIds.length
      ? supabase
          .from("result_table_cells")
          .select(
            "report_test_id, value, template_table_rows(row_label), template_table_columns(column_label)"
          )
          .in("report_test_id", reportTestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (fvError) throw fvError;
  if (tcError) throw tcError;

  type JoinedReportTest = { id: string; comment: string | null; pdf_storage_path: string | null; tests: { name: string } | null };
  type JoinedFieldValue = {
    report_test_id: string;
    value_text: string | null;
    value_numeric: number | null;
    unit: string | null;
    reference_range_display: string | null;
    flag: string | null;
    template_fields: { label: string } | null;
  };
  type JoinedTableCell = {
    report_test_id: string;
    value: string | null;
    template_table_rows: { row_label: string } | null;
    template_table_columns: { column_label: string } | null;
  };

  const typedReportTests = (reportTests ?? []) as unknown as JoinedReportTest[];
  const typedFieldValues = (fieldValues ?? []) as unknown as JoinedFieldValue[];
  const typedTableCells = (tableCells ?? []) as unknown as JoinedTableCell[];

  const tests = await Promise.all(
    typedReportTests.map(async (rt) => {
      const testName = rt.tests?.name ?? "Unknown test";

      const fields = typedFieldValues
        .filter((fv) => fv.report_test_id === rt.id)
        .map((fv) => ({
          label: fv.template_fields?.label ?? "",
          value: fv.value_text ?? (fv.value_numeric !== null ? String(fv.value_numeric) : ""),
          unit: fv.unit,
          referenceRange: fv.reference_range_display,
          flag: fv.flag,
        }));

      const table = typedTableCells
        .filter((tc) => tc.report_test_id === rt.id)
        .map((tc) => ({
          rowLabel: tc.template_table_rows?.row_label ?? "",
          columnLabel: tc.template_table_columns?.column_label ?? "",
          value: tc.value,
        }));

      const pdfSignedUrl = rt.pdf_storage_path ? await getSignedReportPdfUrl(rt.pdf_storage_path) : null;

      return { testName, comment: rt.comment, fields, table, pdfSignedUrl };
    })
  );

  return {
    ok: true,
    result: {
      labNumber: report.lab_number,
      resultReference: report.result_reference ?? input.resultReference,
      patientName: report.patient_name_snapshot,
      patientSex: report.patient_sex_snapshot,
      request: report.request,
      specimen: report.specimen,
      dateCollected: report.date_collected,
      dateReported: report.date_reported,
      publishedAt: report.published_at,
      documentVersion: report.current_version_number,
      hasFinalPdf: Boolean(finalDoc?.storage_path || approvedRequest?.id),
      tests,
    },
  };
}

export type DownloadFinalPdfOutcome =
  | { ok: true; buffer: Buffer; labNumber: string }
  | { ok: false; reason: "rate_limited" | "not_found" | "invalid_code" | "not_published" | "no_final_document" };

/**
 * Troubleshooting §6 — the actual bytes behind the "Download PDF" button on
 * /results, served through /results/download so the browser only ever sees
 * our own domain and a professional filename, never a Supabase storage URL.
 * Re-runs the FULL reference + access-code check (via
 * authenticatePatientAccess) — a download request is never trusted on the
 * strength of a prior page view alone.
 */
export async function downloadPatientFinalPdf(input: VerifyResultInput): Promise<DownloadFinalPdfOutcome> {
  const access = await authenticatePatientAccess(input);
  if (!access.ok) return access;
  const { report } = access;

  const supabase = getServiceRoleClient();
  const { data: finalDoc } = await supabase
    .from("report_final_documents")
    .select("storage_path")
    .eq("lab_report_id", report.id)
    .eq("version_number", report.current_version_number)
    .maybeSingle();

  // Prefer a fresh render using the current official letterhead/signatory.
  // This also allows a published report to remain downloadable if the
  // original storage write failed during approval generation.
  let currentBuffer: Buffer | null = null;
  try {
    currentBuffer = await renderCurrentFinalReportPdfBuffer(report.id);
  } catch (error) {
    console.error("[verification] current final PDF render failed", report.id, error);
  }

  if (!currentBuffer && !finalDoc?.storage_path) {
    return { ok: false, reason: "no_final_document" };
  }

  const buffer = currentBuffer ?? (await downloadReportPdfBytes(finalDoc!.storage_path));

  await logAudit({
    action: "PATIENT_PDF_DOWNLOADED",
    entityType: "lab_reports",
    entityId: report.id,
    metadata: { resultReference: input.resultReference, versionNumber: report.current_version_number },
  });

  return { ok: true, buffer, labNumber: report.lab_number };
}
