"use server";

import { headers } from "next/headers";
import { bookAppointmentSchema } from "@/lib/validation/schemas";
import { submitAppointmentRequest, getBookedSlotCounts } from "@/lib/data/publicIntake";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/bookingConstants";

export interface BookState {
  error?: string;
  bookingReference?: string;
}

async function requestIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}

export async function bookAppointmentAction(_prev: BookState, formData: FormData): Promise<BookState> {
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

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const outcome = await submitAppointmentRequest(
    {
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      test_or_package: parsed.data.testOrPackage || undefined,
      preferred_date: parsed.data.preferredDate,
      preferred_time: parsed.data.preferredTime,
      location_type: parsed.data.locationType as "lab" | "home",
      notes: parsed.data.notes || undefined,
    },
    await requestIp()
  );

  if (!outcome.ok) {
    if (outcome.reason === "rate_limited") return { error: "Too many attempts. Please wait a few minutes and try again." };
    if (outcome.reason === "slot_full") return { error: "That time slot is fully booked. Please choose another." };
    return { error: "Something went wrong submitting your booking. Please try again or contact us." };
  }

  return { bookingReference: outcome.bookingReference };
}

export async function getSlotAvailabilityAction(date: string) {
  const counts = await getBookedSlotCounts(date);
  return APPOINTMENT_TIME_SLOTS.map((slot) => ({ slot, bookedCount: counts[slot] ?? 0 }));
}
