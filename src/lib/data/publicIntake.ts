import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { generateBookingReference } from "./security";
import { hashIp, isFormRateLimited, recordFormAttempt } from "./rateLimit";
import { logAudit } from "./audit";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/bookingConstants";

/**
 * Public intake for appointment booking, home sample collection, and the
 * contact form. Uses the SERVER-ONLY service-role client — these run inside
 * Server Actions (trusted server code), the same pattern as the rest of the
 * Phase 4 workflow (e.g. lib/data/patients.ts createPatient), rather than
 * the anon/browser client. Every submission is rate-limited by IP and,
 * for bookings, checked against a simple per-slot capacity to prevent
 * obvious double-booking. Zod validation happens in the calling Server
 * Action (see src/app/book/actions.ts, src/app/home-collection/actions.ts).
 */

const MAX_BOOKINGS_PER_SLOT = 3;

export { APPOINTMENT_TIME_SLOTS, HOME_COLLECTION_TIME_SLOTS } from "@/lib/bookingConstants";

type AppointmentRequestInsert = Database["public"]["Tables"]["appointment_requests"]["Insert"];
type HomeCollectionRequestInsert = Database["public"]["Tables"]["home_collection_requests"]["Insert"];
type ContactSubmissionInsert = Database["public"]["Tables"]["contact_submissions"]["Insert"];

export type SubmitOutcome<T = object> =
  | ({ ok: true } & T)
  | { ok: false; reason: "rate_limited" | "slot_full" | "error" };

/** Booked (non-cancelled) count per time slot for a given date — used to grey out full slots in the UI. */
export async function getBookedSlotCounts(date: string): Promise<Record<string, number>> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("appointment_requests")
    .select("preferred_time")
    .eq("preferred_date", date)
    .neq("status", "cancelled");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.preferred_time) continue;
    counts[row.preferred_time] = (counts[row.preferred_time] ?? 0) + 1;
  }
  return counts;
}

export async function submitAppointmentRequest(
  input: Omit<AppointmentRequestInsert, "booking_reference" | "status">,
  ipAddress: string
): Promise<SubmitOutcome<{ bookingReference: string }>> {
  const ipHash = hashIp(ipAddress);

  if (await isFormRateLimited("appointment", ipHash)) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getServiceRoleClient();
  const bookingReference = generateBookingReference("APT");

  // Capacity check + insert happen atomically inside book_appointment_slot()
  // (see supabase/migrations/20260820090001_book_appointment_slot_atomic.sql),
  // serialized per date+time slot via a transaction-scoped advisory lock —
  // closes the race where two concurrent requests could both pass a
  // separate "is this slot full?" check before either row existed.
  const { data, error } = await supabase.rpc("book_appointment_slot", {
    p_full_name: input.full_name,
    p_phone: input.phone,
    p_email: input.email ?? null,
    p_test_or_package: input.test_or_package ?? null,
    p_preferred_date: input.preferred_date ?? "",
    p_preferred_time: input.preferred_time ?? "",
    p_location_type: input.location_type ?? null,
    p_notes: input.notes ?? null,
    p_booking_reference: bookingReference,
    p_max_per_slot: MAX_BOOKINGS_PER_SLOT,
  });

  if (error) {
    if (error.message.includes("SLOT_FULL")) {
      await recordFormAttempt("appointment", ipHash, false);
      return { ok: false, reason: "slot_full" };
    }
    await recordFormAttempt("appointment", ipHash, false);
    return { ok: false, reason: "error" };
  }

  const newId = data?.[0]?.id;

  await recordFormAttempt("appointment", ipHash, true);
  await logAudit({
    action: "BOOKING_CREATED",
    entityType: "appointment_requests",
    entityId: newId,
    metadata: { bookingReference },
  });

  return { ok: true, bookingReference };
}

export async function submitHomeCollectionRequest(
  input: Omit<HomeCollectionRequestInsert, "booking_reference" | "status">,
  ipAddress: string
): Promise<SubmitOutcome<{ bookingReference: string }>> {
  const ipHash = hashIp(ipAddress);

  if (await isFormRateLimited("home_collection", ipHash)) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getServiceRoleClient();
  const bookingReference = generateBookingReference("HSC");
  const { data, error } = await supabase
    .from("home_collection_requests")
    .insert({ ...input, booking_reference: bookingReference })
    .select("id")
    .single();

  if (error) {
    await recordFormAttempt("home_collection", ipHash, false);
    return { ok: false, reason: "error" };
  }

  await recordFormAttempt("home_collection", ipHash, true);
  await logAudit({
    action: "HOME_COLLECTION_CREATED",
    entityType: "home_collection_requests",
    entityId: data.id,
    metadata: { bookingReference },
  });

  return { ok: true, bookingReference };
}

export async function submitContactMessage(
  input: ContactSubmissionInsert,
  ipAddress: string
): Promise<SubmitOutcome> {
  const ipHash = hashIp(ipAddress);

  if (await isFormRateLimited("contact", ipHash)) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("contact_submissions").insert(input);

  if (error) {
    await recordFormAttempt("contact", ipHash, false);
    return { ok: false, reason: "error" };
  }

  await recordFormAttempt("contact", ipHash, true);
  return { ok: true };
}
