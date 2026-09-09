"use server";

import { headers } from "next/headers";
import { homeCollectionRequestSchema } from "@/lib/validation/schemas";
import { submitHomeCollectionRequest } from "@/lib/data/publicIntake";

export interface HomeCollectionState {
  error?: string;
  bookingReference?: string;
}

export async function requestHomeCollectionAction(
  _prev: HomeCollectionState,
  formData: FormData
): Promise<HomeCollectionState> {
  const parsed = homeCollectionRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    address: formData.get("address"),
    testOrPackage: formData.get("testOrPackage") || "",
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  const outcome = await submitHomeCollectionRequest(
    {
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      address: parsed.data.address,
      preferred_date: parsed.data.preferredDate,
      preferred_time: parsed.data.preferredTime,
      notes: [parsed.data.testOrPackage ? `Test/service: ${parsed.data.testOrPackage}` : null, parsed.data.notes]
        .filter(Boolean)
        .join(" \u2014 ") || undefined,
    },
    ipAddress
  );

  if (!outcome.ok) {
    if (outcome.reason === "rate_limited") return { error: "Too many attempts. Please wait a few minutes and try again." };
    return { error: "Something went wrong submitting your request. Please try again or contact us." };
  }

  return { bookingReference: outcome.bookingReference };
}
