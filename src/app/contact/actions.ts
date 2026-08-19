"use server";

import { headers } from "next/headers";
import { contactMessageSchema } from "@/lib/validation/schemas";
import { submitContactMessage } from "@/lib/data/publicIntake";

export interface ContactState {
  error?: string;
  ok?: boolean;
}

export async function submitContactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactMessageSchema.safeParse({
    fullName: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  const outcome = await submitContactMessage(
    {
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || undefined,
      email: parsed.data.email || undefined,
      message: parsed.data.message,
    },
    ipAddress
  );

  if (!outcome.ok) {
    if (outcome.reason === "rate_limited") return { error: "Too many attempts. Please wait a few minutes and try again." };
    return { error: "Something went wrong sending your message. Please try again or contact us directly." };
  }

  return { ok: true };
}
