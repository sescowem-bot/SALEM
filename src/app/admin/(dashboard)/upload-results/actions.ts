"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { createPatient, getPatientById } from "@/lib/data/patients";
import { createLabReport } from "@/lib/data/labReports";
import { uploadStandaloneReportDocument } from "@/lib/data/uploadedReportDocuments";
import { standaloneUploadedResultSchema } from "@/lib/validation/schemas";

export type UploadState = { error?: string };

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden")) return "You do not have permission to upload result documents.";
    if (err.message.includes("duplicate key") || err.message.includes("already in use")) return "That lab number is already in use.";
    return err.message;
  }
  return "Something went wrong while creating the uploaded result.";
}

export async function uploadStandaloneResultAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const staff = await requireStaff();

  const parsed = standaloneUploadedResultSchema.safeParse({
    patientMode: formData.get("patientMode"),
    patientId: formData.get("patientId") || "",
    fullName: formData.get("fullName") || "",
    sex: formData.get("sex") || "",
    dateOfBirth: formData.get("dateOfBirth") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    labNumber: formData.get("labNumber"),
    investigationName: formData.get("investigationName"),
    request: formData.get("request") || "",
    specimen: formData.get("specimen") || "",
    dateCollected: formData.get("dateCollected") || "",
    reportComment: formData.get("reportComment") || "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the result details." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the finished result PDF." };
  if (file.type !== "application/pdf") return { error: "Only PDF files are accepted." };
  if (file.size > 15 * 1024 * 1024) return { error: "PDF must be 15MB or smaller." };

  if (parsed.data.patientMode === "existing" && !parsed.data.patientId) return { error: "Select an existing patient." };
  if (parsed.data.patientMode === "new" && !parsed.data.fullName) return { error: "Enter the new patient's full name." };

  let patientId = parsed.data.patientId || "";
  let createdReportId: string | null = null;
  try {
    if (parsed.data.patientMode === "new") {
      const patient = await createPatient(
        {
          full_name: parsed.data.fullName!,
          sex: parsed.data.sex ? (parsed.data.sex as "Male" | "Female") : undefined,
          date_of_birth: parsed.data.dateOfBirth || undefined,
          phone: parsed.data.phone || undefined,
          email: parsed.data.email || undefined,
        },
        staff.role,
        staff.userId
      );
      patientId = patient.id;
    } else {
      const patient = await getPatientById(patientId);
      if (!patient) return { error: "The selected patient could not be found." };
    }

    const patient = await getPatientById(patientId);
    if (!patient) return { error: "The patient could not be loaded." };

    const report = await createLabReport({
      patientId: patient.id,
      patientNameSnapshot: patient.full_name,
      patientSexSnapshot: patient.sex ?? undefined,
      patientDobSnapshot: patient.date_of_birth ?? undefined,
      labNumber: parsed.data.labNumber || undefined,
      sourceInvestigationName: parsed.data.investigationName,
      reportComment: parsed.data.reportComment || undefined,
      request: parsed.data.request || undefined,
      specimen: parsed.data.specimen || undefined,
      dateCollected: parsed.data.dateCollected || undefined,
      createdBy: staff.userId,
      actorRole: staff.role,
    });

    // A supplied report is a finished document, but it still enters the same
    // controlled approval/publish lifecycle. The document is therefore
    // stored on the report itself, independent of catalogue investigations.
    await uploadStandaloneReportDocument({
      labReportId: report.id,
      file,
      actorRole: staff.role,
      actorId: staff.userId,
    });

    createdReportId = report.id;
    revalidatePath("/admin/reports");
    revalidatePath("/admin/upload-results");
  } catch (err) {
    return { error: friendlyError(err) };
  }

  if (createdReportId) redirect(`/admin/reports/${createdReportId}`);
  return { error: "The report could not be created." };
}
