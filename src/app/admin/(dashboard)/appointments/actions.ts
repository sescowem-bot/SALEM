"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateAppointmentStatus, rescheduleAppointment, createAppointmentRequestByStaff } from "@/lib/data/appointments";
import { appointmentStatusSchema, appointmentRescheduleSchema, bookAppointmentSchema } from "@/lib/validation/schemas";

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

/** Reschedule (change date/time) and/or add internal notes on a booking request. */
export async function rescheduleAppointmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = appointmentRescheduleSchema.safeParse({
    requestId: formData.get("requestId"),
    rescheduledDate: formData.get("rescheduledDate") || "",
    rescheduledTime: formData.get("rescheduledTime") || "",
    adminNotes: formData.get("adminNotes") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  try {
    await rescheduleAppointment(
      parsed.data.requestId,
      {
        rescheduledDate: parsed.data.rescheduledDate || undefined,
        rescheduledTime: parsed.data.rescheduledTime || undefined,
        adminNotes: parsed.data.adminNotes,
      },
      staff.role,
      staff.userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/appointments");
  return { ok: true };
}

/**
 * Staff logs a walk-in or phone booking directly (e.g. front desk taking a
 * call). Reuses the same `bookAppointmentSchema` as the public booking
 * form and the same `appointment_requests` table — no separate booking
 * pipeline.
 */
export async function createAppointmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = bookAppointmentSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    testOrPackage: formData.get("testOrPackage") || "",
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    locationType: formData.get("locationType"),
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  try {
    await createAppointmentRequestByStaff(
      {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        testOrPackage: parsed.data.testOrPackage,
        preferredDate: parsed.data.preferredDate,
        preferredTime: parsed.data.preferredTime,
        locationType: parsed.data.locationType,
        notes: parsed.data.notes,
      },
      staff.role,
      staff.userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/appointments");
  return { ok: true };
}
