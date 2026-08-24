import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import type { Database } from "@/lib/supabase/database.types";
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
 * Uploads a system-generated FINAL report PDF (Advanced 5) into the same
 * private lab-report-pdfs bucket used for staff-uploaded result PDFs, but
 * under a `final/` sub-path so the two never collide. `upsert: true`
 * because a controlled, explicit regeneration of the *same* version's PDF
 * (re-rendering after a letterhead/signature fix, say) should replace that
 * exact file — report_final_documents' unique (lab_report_id,
 * version_number) constraint is what actually prevents an approved
 * version's document from changing silently; a new lab_reports version
 * number always gets its own row and its own path here, never an overwrite
 * of a prior version's file.
 */
export async function uploadFinalReportPdf(input: {
  labReportId: string;
  versionNumber: number;
  buffer: Buffer;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<string> {
  if (!hasPermission(input.actorRole, "reports.review")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot generate a final report document.`);
  }

  const supabase = getServiceRoleClient();
  const path = `${input.labReportId}/final/v${input.versionNumber}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.buffer, { contentType: "application/pdf", upsert: true });
  if (error) throw error;

  return path;
}

/**
 * Server-only. Downloads the PDF bytes directly into memory, for a
 * server-controlled download route (troubleshooting §6) to stream with a
 * professional Content-Disposition filename — never a Supabase-domain
 * signed URL exposed directly to the browser's address bar/download UI.
 * Caller must already have verified the requester is authorized (staff
 * reports.view, or a successfully-verified patient access-code check) —
 * same authorization contract as getSignedReportPdfUrl below.
 */
export async function downloadReportPdfBytes(storagePath: string): Promise<Buffer> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
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

// ---------------------------------------------------------------------------
// Website/brand media (Advanced 3). Same public-read-only,
// service-role-write posture as service-images above, kept in a separate
// bucket so brand assets (logo/favicon/OG image/page hero images) don't
// share a flat namespace with service marketing photos.
// ---------------------------------------------------------------------------

const SITE_MEDIA_BUCKET = "site-media";
const MAX_SITE_MEDIA_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_SITE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];

export type SiteMediaSlot = "logo" | "logoLight" | "favicon" | "ogImage" | "pageHero" | "letterhead";

const SITE_SETTINGS_COLUMN: Partial<
  Record<SiteMediaSlot, "logo_path" | "logo_light_path" | "favicon_path" | "og_image_path" | "letterhead_path">
> = {
  logo: "logo_path",
  logoLight: "logo_light_path",
  favicon: "favicon_path",
  ogImage: "og_image_path",
  letterhead: "letterhead_path",
};

/**
 * Uploads a brand asset (logo/favicon/OG image) into site_settings, or a
 * page hero image with an explicit storage path when `slot === "pageHero"`
 * (used by the homepage/about editors, which store the resulting path
 * inside their own website_pages JSON content rather than site_settings).
 */
export async function uploadSiteMedia(input: {
  slot: SiteMediaSlot;
  file: File | Blob;
  fileName: string;
  contentType: string;
  size: number;
  actorRole: StaffRole;
  actorId?: string;
  /** Required only for slot "pageHero" — a caller-chosen subpath, e.g. "homepage/hero". */
  pathHint?: string;
}): Promise<string> {
  if (!hasPermission(input.actorRole, "settings.manage")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot manage website media.`);
  }
  if (!ALLOWED_SITE_MEDIA_TYPES.includes(input.contentType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, SVG, or ICO.");
  }
  if (input.size > MAX_SITE_MEDIA_BYTES) {
    throw new Error("Image is too large. The limit is 5MB.");
  }

  const supabase = getServiceRoleClient();
  const extension = input.fileName.split(".").pop()?.toLowerCase() || "png";
  const subpath = input.slot === "pageHero" ? (input.pathHint ?? "page-hero") : input.slot;
  const path = `${subpath}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(path, input.file, { contentType: input.contentType, upsert: false });
  if (uploadError) throw uploadError;

  const column = SITE_SETTINGS_COLUMN[input.slot];
  if (column) {
    const { data: current } = await supabase.from("site_settings").select(column).eq("id", true).single();
    const previousPath = current ? (current as Record<string, unknown>)[column] : null;
    if (typeof previousPath === "string" && previousPath) {
      await supabase.storage.from(SITE_MEDIA_BUCKET).remove([previousPath]);
    }
    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        [column]: path,
        updated_at: new Date().toISOString(),
        updated_by: input.actorId ?? null,
      } as Database["public"]["Tables"]["site_settings"]["Update"])
      .eq("id", true);
    if (updateError) throw updateError;
  }

  await logAudit({
    action: "WEBSITE_MEDIA_UPLOADED",
    entityType: column ? "site_settings" : "website_pages",
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { slot: input.slot, fileName: input.fileName },
  });

  return path;
}

export async function removeSiteMediaSlot(slot: SiteMediaSlot, actorRole: StaffRole, actorId?: string): Promise<void> {
  if (!hasPermission(actorRole, "settings.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage website media.`);
  }
  const column = SITE_SETTINGS_COLUMN[slot];
  if (!column) throw new Error("This media slot cannot be removed directly.");

  const supabase = getServiceRoleClient();
  const { data: current } = await supabase.from("site_settings").select(column).eq("id", true).single();
  const previousPath = current ? (current as Record<string, unknown>)[column] : null;
  if (typeof previousPath === "string" && previousPath) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([previousPath]);
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      [column]: null,
      updated_at: new Date().toISOString(),
      updated_by: actorId ?? null,
    } as Database["public"]["Tables"]["site_settings"]["Update"])
    .eq("id", true);
  if (error) throw error;

  await logAudit({
    action: "WEBSITE_MEDIA_REMOVED",
    entityType: "site_settings",
    actorId,
    actorRole,
    metadata: { slot },
  });
}

export function getSiteMediaPublicUrl(storagePath: string): string {
  const supabase = getServiceRoleClient();
  const { data } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Staff signature images (Advanced 5). Private bucket, same posture as
// lab-report-pdfs — signature images are tied to a specific staff member's
// identity and end up embedded in official approved documents, so unlike
// the public site-media assets above, there is no public URL path at all.
// Every read goes through a short-lived signed URL (admin preview) or a
// direct in-memory download (embedding into a generated PDF — see
// lib/data/reportDocuments.ts), both via the service-role client.
// ---------------------------------------------------------------------------

const STAFF_SIGNATURES_BUCKET = "staff-signatures";
const MAX_SIGNATURE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_SIGNATURE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function uploadSignatureImage(input: {
  signatoryId: string;
  file: File | Blob;
  fileName: string;
  contentType: string;
  size: number;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<string> {
  if (!hasPermission(input.actorRole, "documents.manage")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot manage signatures.`);
  }
  if (!ALLOWED_SIGNATURE_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, or WebP — PNG with a transparent background is best.");
  }
  if (input.size > MAX_SIGNATURE_IMAGE_BYTES) {
    throw new Error("Image is too large. The limit is 2MB.");
  }

  const supabase = getServiceRoleClient();
  const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
  const path = `${input.signatoryId}/${Date.now()}.${extension}`;

  const { data: current } = await supabase
    .from("signatories")
    .select("signature_image_url")
    .eq("id", input.signatoryId)
    .single();

  const { error: uploadError } = await supabase.storage
    .from(STAFF_SIGNATURES_BUCKET)
    .upload(path, input.file, { contentType: input.contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("signatories")
    .update({ signature_image_url: path })
    .eq("id", input.signatoryId);
  if (updateError) throw updateError;

  if (current?.signature_image_url) {
    await supabase.storage.from(STAFF_SIGNATURES_BUCKET).remove([current.signature_image_url]);
  }

  await logAudit({
    action: "SIGNATURE_UPLOADED",
    entityType: "signatories",
    entityId: input.signatoryId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { fileName: input.fileName },
  });

  return path;
}

export async function removeSignatureImage(signatoryId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  if (!hasPermission(actorRole, "documents.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage signatures.`);
  }

  const supabase = getServiceRoleClient();
  const { data: current } = await supabase
    .from("signatories")
    .select("signature_image_url")
    .eq("id", signatoryId)
    .single();
  if (current?.signature_image_url) {
    await supabase.storage.from(STAFF_SIGNATURES_BUCKET).remove([current.signature_image_url]);
  }

  const { error } = await supabase.from("signatories").update({ signature_image_url: null }).eq("id", signatoryId);
  if (error) throw error;

  await logAudit({
    action: "SIGNATURE_UPLOADED",
    entityType: "signatories",
    entityId: signatoryId,
    actorId,
    actorRole,
    metadata: { removed: true },
  });
}

/** Server-only. Short-lived signed URL for admin preview of a stored signature image. */
export async function getSignedSignatureUrl(storagePath: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(STAFF_SIGNATURES_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Failed to generate signed URL.");
  return data.signedUrl;
}

/**
 * Server-only. Downloads a signature image straight into memory as a base64
 * data URI, for embedding into a generated PDF (@react-pdf/renderer's Image
 * component needs a URL or data URI, and a signed URL would be an
 * unnecessary network round trip for a same-process render). Used only by
 * lib/data/reportDocuments.ts.
 */
export async function getSignatureImageDataUri(storagePath: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(STAFF_SIGNATURES_BUCKET).download(storagePath);
  if (error) throw error;
  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

/**
 * Server-only. Downloads the letterhead/logo image (public site-media
 * bucket) straight into memory as a base64 data URI, for the same
 * same-process-embed reason as getSignatureImageDataUri above.
 */
export async function getSiteMediaDataUri(storagePath: string): Promise<string | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(SITE_MEDIA_BUCKET).download(storagePath);
  if (error) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
