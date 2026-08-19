import "server-only";
import { createHash } from "node:crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { verifyAccessCode } from "./security";
import { getSignedReportPdfUrl } from "./storage";
import { logAudit } from "./audit";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

export interface VerifyResultInput {
  resultReference: string;
  accessCode: string;
  ipAddress: string; // caller (Server Action/Route Handler) supplies the request IP
}

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
 * Public entry point for the /results verification page. Never bypasses
 * rate limiting or the access-code check, regardless of how it's called.
 * Returns only published-report data — no staff notes, no audit trail, no
 * unrelated patient fields.
 */
export async function verifyPatientResult(input: VerifyResultInput): Promise<VerifyResultOutcome> {
  const ipHash = hashIp(input.ipAddress);

  if (await isRateLimited(ipHash)) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getServiceRoleClient();
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select(
      "id, lab_number, result_reference, access_code_hash, patient_name_snapshot, patient_sex_snapshot, request, specimen, date_collected, date_reported, status, published_at"
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
  await logAudit({
    action: "RESULT_VERIFIED_ACCESS",
    entityType: "lab_reports",
    entityId: report.id,
    metadata: { resultReference: input.resultReference },
  });

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
      tests,
    },
  };
}
