"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateContactSubmissionStatus } from "@/lib/data/communications";
import { contactStatusSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function updateContactStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = contactStatusSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    await updateContactSubmissionStatus(parsed.data.submissionId, parsed.data.status, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}
