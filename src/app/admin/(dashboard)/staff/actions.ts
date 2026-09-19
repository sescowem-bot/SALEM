"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import {
  createStaffAccount,
  updateStaffProfile,
  deactivateStaffAccount,
  reactivateStaffAccount,
} from "@/lib/data/staff";
import { createStaffSchema, updateStaffSchema, staffStatusSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function createStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = createStaffSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    qualification: formData.get("qualification") || "",
    designation: formData.get("designation") || "",
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid staff details." };

  try {
    await createStaffAccount({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      qualification: parsed.data.qualification || undefined,
      designation: parsed.data.designation || undefined,
      phone: parsed.data.phone || undefined,
      actorRole: staff.role,
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to add staff." };
    }
    return { error: err instanceof Error ? err.message : "Could not create staff account." };
  }

  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function updateStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = updateStaffSchema.safeParse({
    staffId: formData.get("staffId"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    qualification: formData.get("qualification") || "",
    designation: formData.get("designation") || "",
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid staff details." };

  try {
    await updateStaffProfile(
      parsed.data.staffId,
      {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
        qualification: parsed.data.qualification || null,
        designation: parsed.data.designation || null,
        phone: parsed.data.phone || null,
      },
      staff.role
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to edit staff." };
    }
    return { error: err instanceof Error ? err.message : "Could not update staff account." };
  }

  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function setStaffStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = staffStatusSchema.safeParse({
    staffId: formData.get("staffId"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    if (parsed.data.active === "true") {
      await reactivateStaffAccount(parsed.data.staffId, staff.role);
    } else {
      await deactivateStaffAccount(parsed.data.staffId, staff.role);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to manage staff status." };
    }
    return { error: err instanceof Error ? err.message : "Could not update staff status." };
  }

  revalidatePath("/admin/staff");
  return { ok: true };
}
