"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateAppointmentStatus } from "@/lib/data/appointments";
import { appointmentStatusSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function updateAppointmentStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = appointmentStatusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    await updateAppointmentStatus(parsed.data.requestId, parsed.data.status as "new" | "contacted" | "scheduled" | "completed" | "cancelled", staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/appointments");
  return { ok: true };
}
