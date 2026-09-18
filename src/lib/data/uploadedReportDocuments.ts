import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { downloadReportPdfBytes, getSignedReportPdfUrl } from "./storage";

const MAX_BYTES = 15 * 1024 * 1024;

export interface UploadedReportDocumentSummary {
  id: string;
  versionNumber: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  signedUrl: string;
}

export async function uploadStandaloneReportDocument(input: {
  labReportId: string;
  file: File;
  actorRole: StaffRole;
  actorId: string;
}): Promise<UploadedReportDocumentSummary> {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot upload report documents.`);
  }
  if (input.file.type !== "application/pdf") throw new Error("Only PDF files are accepted.");
  if (input.file.size <= 0) throw new Error("Choose a PDF file to upload.");
  if (input.file.size > MAX_BYTES) throw new Error("PDF must be 15MB or smaller.");

  const supabase = getServiceRoleClient();
  const { data: report, error: reportError } = await supabase
    .from("lab_reports")
    .select("id, status, current_version_number")
    .eq("id", input.labReportId)
    .single();
  if (reportError) throw reportError;
  if (report.status === "published" || report.status === "archived") {
    throw new Error("Published or archived reports are locked. Reopen the report for correction before replacing its document.");
  }

  const versionNumber = report.current_version_number;
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "report.pdf";
  const path = `${input.labReportId}/source/v${versionNumber}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("lab-report-pdfs").upload(path, input.file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: existing } = await supabase
    .from("report_uploaded_documents")
    .select("id, storage_path")
    .eq("lab_report_id", input.labReportId)
    .eq("version_number", versionNumber)
    .maybeSingle();

  let document;
  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("report_uploaded_documents")
      .update({
        storage_path: path,
        file_name: input.file.name,
        content_type: input.file.type,
        size_bytes: input.file.size,
        uploaded_by: input.actorId,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, version_number, storage_path, file_name, content_type, size_bytes, created_at")
      .single();
    if (updateError) {
      await supabase.storage.from("lab-report-pdfs").remove([path]);
      throw updateError;
    }
    document = updated;
    await supabase.storage.from("lab-report-pdfs").remove([existing.storage_path]);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("report_uploaded_documents")
      .insert({
        lab_report_id: input.labReportId,
        version_number: versionNumber,
        storage_path: path,
        file_name: input.file.name,
        content_type: input.file.type,
        size_bytes: input.file.size,
        uploaded_by: input.actorId,
      })
      .select("id, version_number, storage_path, file_name, content_type, size_bytes, created_at")
      .single();
    if (insertError) {
      await supabase.storage.from("lab-report-pdfs").remove([path]);
      throw insertError;
    }
    document = inserted;
  }

  await logAudit({
    action: "SOURCE_DOCUMENT_UPLOADED",
    entityType: "report_uploaded_documents",
    entityId: document.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { labReportId: input.labReportId, versionNumber, fileName: input.file.name, sizeBytes: input.file.size },
  });

  return {
    id: document.id,
    versionNumber: document.version_number,
    fileName: document.file_name,
    contentType: document.content_type,
    sizeBytes: Number(document.size_bytes),
    createdAt: document.created_at,
    signedUrl: await getSignedReportPdfUrl(document.storage_path),
  };
}

export async function getLatestUploadedReportDocument(
  labReportId: string,
  actorRole: StaffRole
): Promise<UploadedReportDocumentSummary | null> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot access uploaded report documents.`);
  }
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_uploaded_documents")
    .select("id, version_number, storage_path, file_name, content_type, size_bytes, created_at")
    .eq("lab_report_id", labReportId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    versionNumber: data.version_number,
    fileName: data.file_name,
    contentType: data.content_type,
    sizeBytes: Number(data.size_bytes),
    createdAt: data.created_at,
    signedUrl: await getSignedReportPdfUrl(data.storage_path),
  };
}

export async function getLatestUploadedReportDocumentPath(labReportId: string): Promise<{ storagePath: string; fileName: string } | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_uploaded_documents")
    .select("storage_path, file_name")
    .eq("lab_report_id", labReportId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { storagePath: data.storage_path, fileName: data.file_name } : null;
}

export async function downloadLatestUploadedReportDocument(labReportId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const document = await getLatestUploadedReportDocumentPath(labReportId);
  if (!document) return null;
  return { buffer: await downloadReportPdfBytes(document.storagePath), fileName: document.fileName };
}
