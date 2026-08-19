"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateHomeCollectionStatus, assignPhlebotomist } from "@/lib/data/homeCollection";
import { homeCollectionStatusSchema, assignPhlebotomistSchema } from "@/lib/validation/schemas";

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
