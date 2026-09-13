"use server";

import { headers } from "next/headers";
import { bookAppointmentSchema } from "@/lib/validation/schemas";
import { submitAppointmentRequest, getBookedSlotCounts } from "@/lib/data/publicIntake";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/bookingConstants";

export interface BookState {
  error?: string;
  bookingReference?: string;
  locationType?: "lab" | "home";
  address?: string;
  payment?: {
    required: boolean;
    message: string;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    paymentPhone?: string | null;
  };
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
    address: formData.get("address") || "",
    landmark: formData.get("landmark") || "",
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
      address: parsed.data.locationType === "home" ? parsed.data.address || undefined : undefined,
      landmark: parsed.data.locationType === "home" ? parsed.data.landmark || undefined : undefined,
      notes: parsed.data.notes || undefined,
    },
    await requestIp()
  );

  if (!outcome.ok) {
    if (outcome.reason === "rate_limited") return { error: "Too many attempts. Please wait a few minutes and try again." };
    return { error: "Something went wrong submitting your booking. Please try again or contact us." };
  }

  if (parsed.data.locationType === "home") {
    try {
      const settings = await getSiteSettings();
      return {
        bookingReference: outcome.bookingReference,
        locationType: "home",
        address: parsed.data.address,
        payment: {
          required: settings.homeCollectionPaymentRequired,
          message: settings.homeCollectionPaymentMessage || "Payment is required before a home visit can be confirmed.",
          bankName: settings.homeCollectionBankName,
          accountName: settings.homeCollectionAccountName,
          accountNumber: settings.homeCollectionAccountNumber,
          paymentPhone: settings.homeCollectionPaymentPhone,
        },
      };
    } catch {
      return {
        bookingReference: outcome.bookingReference,
        locationType: "home",
        address: parsed.data.address,
        payment: {
          required: true,
          message: "Payment is required before a home visit can be confirmed. Salem Medical Laboratories will contact you using the phone number you provided to verify payment and confirm the visit.",
        },
      };
    }
  }

  return { bookingReference: outcome.bookingReference, locationType: "lab" };
}

export async function getSlotAvailabilityAction(date: string) {
  const counts = await getBookedSlotCounts(date);
  return APPOINTMENT_TIME_SLOTS.map((slot) => ({ slot, bookedCount: counts[slot] ?? 0 }));
}
