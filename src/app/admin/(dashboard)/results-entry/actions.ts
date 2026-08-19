"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { searchPatientsByName, createPatient } from "@/lib/data/patients";
import { createLabReport, addTestToReport } from "@/lib/data/labReports";
import { registerPatientSchema, createVisitSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function searchPatientsAction(query: string) {
  const staff = await requireStaff();
  if (query.trim().length < 2) return [];
  // Permission is enforced by RLS/staff.patients.view at read time via the
  // service-role-backed data layer's caller (results-entry is only reachable
  // by staff with reports.view — see page.tsx) — searchPatientsByName itself
  // is read-only and low-risk, but we still require a signed-in staff member.
  void staff;
  return searchPatientsByName(query);
}

export async function registerPatientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = registerPatientSchema.safeParse({
    fullName: formData.get("fullName"),
    sex: formData.get("sex") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid patient details." };
  }

  try {
    const patient = await createPatient(
      {
        full_name: parsed.data.fullName,
        sex: parsed.data.sex as "Male" | "Female" | undefined,
        date_of_birth: parsed.data.dateOfBirth || undefined,
        phone: parsed.data.phone || undefined,
        email: parsed.data.email || undefined,
      },
      staff.role,
      staff.userId
    );
    redirect(`/admin/results-entry?patientId=${patient.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to register patients." };
    }
    throw err;
  }
}

export async function createVisitAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const testIds = formData.getAll("testIds").map(String);

  const parsed = createVisitSchema.safeParse({
    patientId: formData.get("patientId"),
    labNumber: formData.get("labNumber"),
    request: formData.get("request") || "",
    specimen: formData.get("specimen") || "",
    dateCollected: formData.get("dateCollected") || "",
    testIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid visit details." };
  }

  let reportId: string;
  try {
    // Snapshot the patient's current name/sex/dob onto the report at
    // creation time (Phase 2A: patient edits later must not rewrite history).
    const { getPatientById } = await import("@/lib/data/patients");
    const patient = await getPatientById(parsed.data.patientId);
    if (!patient) return { error: "Patient not found." };

    const report = await createLabReport({
      patientId: patient.id,
      patientNameSnapshot: patient.full_name,
      patientSexSnapshot: (patient.sex ?? undefined) as "Male" | "Female" | undefined,
      patientDobSnapshot: patient.date_of_birth ?? undefined,
      labNumber: parsed.data.labNumber,
      request: parsed.data.request || undefined,
      specimen: parsed.data.specimen || undefined,
      dateCollected: parsed.data.dateCollected || undefined,
      createdBy: staff.userId,
      actorRole: staff.role,
    });
    reportId = report.id;

    for (const testId of parsed.data.testIds) {
      await addTestToReport(reportId, testId, staff.role, undefined, staff.userId);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to create a visit." };
    }
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return { error: "That lab number is already in use." };
    }
    throw err;
  }

  redirect(`/admin/reports/${reportId}`);
}
