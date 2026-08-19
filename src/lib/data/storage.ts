import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { assertReportIsEditable } from "./labReports";

const BUCKET = "lab-report-pdfs";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes — short-lived per Phase 4 §11

/**
 * Uploads a report PDF to the PRIVATE lab-report-pdfs bucket. The bucket has
 * no public/anon/authenticated storage policies at all (see migration
 * 20260818090002) — this is the only write path, using the service role,
 * and the only read path is getSignedReportPdfUrl below.
 */
export async function uploadReportPdf(input: {
  labReportId: string;
  reportTestId: string;
  file: File | Blob;
  fileName: string;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<string> {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot upload a result PDF.`);
  }
  await assertReportIsEditable(input.labReportId);

  const supabase = getServiceRoleClient();
  const path = `${input.labReportId}/${input.reportTestId}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("report_tests")
    .update({ pdf_storage_path: path })
    .eq("id", input.reportTestId);
  if (updateError) throw updateError;

  await logAudit({
    action: "RESULT_UPLOADED",
    entityType: "report_tests",
    entityId: input.reportTestId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { labReportId: input.labReportId, fileName: input.fileName },
  });

  return path;
}

/**
 * Server-only. Generates a short-lived signed URL — never a public URL.
 * Caller must already have verified the requester is authorized to see this
 * report (staff with reports.view, or a successfully-verified patient
 * request — see lib/data/verification.ts, which calls this only after its
 * own checks pass).
 */
export async function getSignedReportPdfUrl(storagePath: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Failed to generate signed URL.");
  return data.signedUrl;
}
