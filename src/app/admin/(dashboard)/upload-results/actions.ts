"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { uploadReportPdf } from "@/lib/data/storage";

type UploadState = { ok?: boolean; error?: string };

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden")) return "You do not have permission to upload result PDFs.";
    return err.message;
  }
  return "Something went wrong while uploading the result.";
}

export async function uploadStandaloneResultAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const staff = await requireStaff();
  const file = formData.get("file");
  const reportTestId = String(formData.get("reportTestId") ?? "");
  const labReportId = String(formData.get("labReportId") ?? "");
  if (!labReportId || !reportTestId) return { error: "Choose a report and investigation." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file to upload." };
  if (file.type !== "application/pdf") return { error: "Only PDF files are accepted." };
  if (file.size > 15 * 1024 * 1024) return { error: "PDF must be 15MB or smaller." };
  try {
    await uploadReportPdf({ labReportId, reportTestId, file, fileName: file.name, actorRole: staff.role, actorId: staff.userId });
    revalidatePath(`/admin/reports/${labReportId}`);
    revalidatePath("/admin/upload-results");
    return { ok: true };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}
