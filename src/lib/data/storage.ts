import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

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

// ---------------------------------------------------------------------------
// Service marketing images (Advanced 2 — Services CMS). Deliberately a
// separate, PUBLIC-read bucket ("service-images") from the private
// lab-report-pdfs bucket above — these are marketing assets, not patient
// records — but writes follow the exact same posture: no
// insert/update/delete storage policy for anon/authenticated at all, so the
// service-role client here is the only write path, gated by
// catalogue.manage.
// ---------------------------------------------------------------------------

const SERVICE_IMAGES_BUCKET = "service-images";
const MAX_SERVICE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_SERVICE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadServiceImage(input: {
  testId: string;
  file: File | Blob;
  fileName: string;
  contentType: string;
  size: number;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<string> {
  if (!hasPermission(input.actorRole, "catalogue.manage")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot manage the service catalogue.`);
  }
  if (!ALLOWED_SERVICE_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (input.size > MAX_SERVICE_IMAGE_BYTES) {
    throw new Error("Image is too large. The limit is 5MB.");
  }

  const supabase = getServiceRoleClient();
  const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
  const path = `${input.testId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .upload(path, input.file, { contentType: input.contentType, upsert: false });
  if (uploadError) throw uploadError;

  // Best-effort cleanup of any previous image for this service so the
  // bucket doesn't accumulate orphaned files on repeated replacement.
  const { data: current } = await supabase.from("tests").select("hero_image_path").eq("id", input.testId).single();
  if (current?.hero_image_path) {
    await supabase.storage.from(SERVICE_IMAGES_BUCKET).remove([current.hero_image_path]);
  }

  const { error: updateError } = await supabase.from("tests").update({ hero_image_path: path }).eq("id", input.testId);
  if (updateError) throw updateError;

  await logAudit({
    action: "SERVICE_UPDATED",
    entityType: "tests",
    entityId: input.testId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { imageUploaded: true, fileName: input.fileName },
  });

  return path;
}

export async function removeServiceImage(testId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  if (!hasPermission(actorRole, "catalogue.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage the service catalogue.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current } = await supabase.from("tests").select("hero_image_path").eq("id", testId).single();
  if (current?.hero_image_path) {
    await supabase.storage.from(SERVICE_IMAGES_BUCKET).remove([current.hero_image_path]);
  }

  const { error } = await supabase.from("tests").update({ hero_image_path: null }).eq("id", testId);
  if (error) throw error;

  await logAudit({
    action: "SERVICE_UPDATED",
    entityType: "tests",
    entityId: testId,
    actorId,
    actorRole,
    metadata: { imageRemoved: true },
  });
}

/**
 * Public URL for a service image. Safe to call from Server Components that
 * render the public site — the bucket is public-read, this is just a
 * deterministic URL construction, not a privileged operation.
 */
export function getServiceImagePublicUrl(storagePath: string): string {
  const supabase = getServiceRoleClient();
  const { data } = supabase.storage.from(SERVICE_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
