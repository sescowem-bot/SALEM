import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { generateBookingReference } from "./security";
import { hashIp, isFormRateLimited, recordFormAttempt } from "./rateLimit";
import { logAudit } from "./audit";

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

export { APPOINTMENT_TIME_SLOTS, HOME_COLLECTION_TIME_SLOTS } from "@/lib/bookingConstants";

type AppointmentRequestInsert = Database["public"]["Tables"]["appointment_requests"]["Insert"];
type HomeCollectionRequestInsert = Database["public"]["Tables"]["home_collection_requests"]["Insert"];
type ContactSubmissionInsert = Database["public"]["Tables"]["contact_submissions"]["Insert"];

export type SubmitOutcome<T = object> =
  | ({ ok: true } & T)
  | { ok: false; reason: "rate_limited" | "error" };

/**
 * Booked (non-cancelled) count per time slot for a given date — informational
 * only. Shown in the UI as a "how busy is this slot" indicator (e.g. "3
 * other patients selected this time"), never used to disable or reject a
 * slot: patients must be able to submit multiple requests for the same
 * date/time, and it's the front desk's job to coordinate actual capacity
 * when reviewing requests (see Advanced 7 QA §2).
 */
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

  // Plain insert — same pattern as submitHomeCollectionRequest below.
  //
  // This used to go through a book_appointment_slot() RPC that hard-rejected
  // a booking once 3 requests already existed for the same date+time
  // (SLOT_FULL). That directly violated the requirement that patients must
  // be able to submit multiple requests for the same date/time — the front
  // desk, not the booking form, is who coordinates actual capacity — so the
  // capacity gate is removed rather than reworked. It also removed a real
  // failure surface: every booking depended on that RPC's signature staying
  // in lockstep with this code, and any drift (or the migration simply not
  // having been applied to a given environment) meant every single
  // submission fell into the generic error branch below and showed
  // "Something went wrong" with no way to tell why. A plain insert has no
  // such dependency.
  const { data, error } = await supabase
    .from("appointment_requests")
    .insert({ ...input, booking_reference: bookingReference })
    .select("id")
    .single();

  if (error) {
    await recordFormAttempt("appointment", ipHash, false);
    return { ok: false, reason: "error" };
  }

  await recordFormAttempt("appointment", ipHash, true);
  await logAudit({
    action: "BOOKING_CREATED",
    entityType: "appointment_requests",
    entityId: data.id,
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
