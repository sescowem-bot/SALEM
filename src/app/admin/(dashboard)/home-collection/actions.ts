"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateHomeCollectionStatus, assignPhlebotomist, updateHomeCollectionPayment } from "@/lib/data/homeCollection";
import { homeCollectionStatusSchema, assignPhlebotomistSchema, homeCollectionPaymentSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function updateHomeCollectionStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = homeCollectionStatusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    await updateHomeCollectionStatus(
      parsed.data.requestId,
      parsed.data.status as "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled",
      staff.role,
      staff.userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/home-collection");
  return { ok: true };
}

export async function updateHomeCollectionPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = homeCollectionPaymentSchema.safeParse({
    requestId: formData.get("requestId"),
    paymentStatus: formData.get("paymentStatus"),
    paymentAmountNgn: formData.get("paymentAmountNgn") || "",
    paymentNotes: formData.get("paymentNotes") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  try {
    await updateHomeCollectionPayment(
      parsed.data.requestId,
      {
        paymentStatus: parsed.data.paymentStatus,
        paymentAmountNgn: parsed.data.paymentAmountNgn ? Number(parsed.data.paymentAmountNgn) : null,
        paymentNotes: parsed.data.paymentNotes,
      },
      staff.role,
      staff.userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/home-collection");
  return { ok: true };
}

export async function assignPhlebotomistAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = assignPhlebotomistSchema.safeParse({
    requestId: formData.get("requestId"),
    phlebotomistId: formData.get("phlebotomistId"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    await assignPhlebotomist(parsed.data.requestId, parsed.data.phlebotomistId, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/home-collection");
  return { ok: true };
}
