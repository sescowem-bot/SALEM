"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { listPatients, createPatient, updatePatient } from "@/lib/data/patients";
import { registerPatientSchema, updatePatientSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
}

export async function searchPatientsAction(query: string) {
  const staff = await requireStaff();
  return listPatients(staff.role, { query, limit: 50 });
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid patient details." };

  let patientId: string;
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
    patientId = patient.id;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to register patients." };
    }
    return { error: err instanceof Error ? err.message : "Could not register patient." };
  }

  redirect(`/admin/patients/${patientId}`);
}

export async function updatePatientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = updatePatientSchema.safeParse({
    patientId: formData.get("patientId"),
    fullName: formData.get("fullName"),
    sex: formData.get("sex") || "",
    dateOfBirth: formData.get("dateOfBirth") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid patient details." };

  try {
    await updatePatient(
      parsed.data.patientId,
      {
        full_name: parsed.data.fullName,
        sex: (parsed.data.sex || null) as "Male" | "Female" | null | undefined,
        date_of_birth: parsed.data.dateOfBirth || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      },
      staff.role,
      staff.userId
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to edit patients." };
    }
    return { error: err instanceof Error ? err.message : "Could not update patient." };
  }

  return {};
}
