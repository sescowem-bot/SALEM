"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { createSignatory, updateSignatory } from "@/lib/data/signatories";
import { uploadSignatureImage, removeSignatureImage } from "@/lib/data/storage";
import { signatorySchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

const initial: ActionState = {};
void initial;

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden")) return "You do not have permission to do that.";
    return err.message;
  }
  return "Something went wrong.";
}

export async function saveSignatoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = signatorySchema.safeParse({
    signatoryId: formData.get("signatoryId") || undefined,
    fullName: formData.get("fullName"),
    qualification: formData.get("qualification") || "",
    designation: formData.get("designation") || "",
    staffProfileId: formData.get("staffProfileId") || "",
    isActive: formData.get("isActive") || "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid signatory details." };

  const input = {
    fullName: parsed.data.fullName,
    qualification: parsed.data.qualification || null,
    designation: parsed.data.designation || null,
    staffProfileId: parsed.data.staffProfileId || null,
    isActive: parsed.data.isActive === "true",
  };

  try {
    if (parsed.data.signatoryId) {
      await updateSignatory(parsed.data.signatoryId, input, staff.role, staff.userId);
    } else {
      await createSignatory(input, staff.role, staff.userId);
    }
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath("/admin/signatories");
  return { ok: true };
}

export async function uploadSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const signatoryId = String(formData.get("signatoryId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file to upload." };
  }

  try {
    await uploadSignatureImage({
      signatoryId,
      file,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath("/admin/signatories");
  return { ok: true };
}

export async function removeSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const signatoryId = String(formData.get("signatoryId") ?? "");

  try {
    await removeSignatureImage(signatoryId, staff.role, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath("/admin/signatories");
  return { ok: true };
}
