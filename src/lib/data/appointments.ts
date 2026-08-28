import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { generateBookingReference } from "./security";

type AppointmentRequest = Database["public"]["Tables"]["appointment_requests"]["Row"];
type IntakeStatus = Database["public"]["Tables"]["appointment_requests"]["Row"]["status"];

/**
 * Staff-initiated appointment request — e.g. a walk-in or phone booking a
 * front-desk staffer logs on the patient's behalf. Reuses the exact same
 * `appointment_requests` table and shape as the public booking form (no
 * duplicate booking system); the only differences are that it's created
 * directly by an authenticated, permissioned staff member (so no IP rate
 * limiting applies) and it starts at status "scheduled" rather than "new",
 * since staff are logging it as already arranged.
 */
export async function createAppointmentRequestByStaff(
  input: {
    fullName: string;
    phone: string;
    email?: string;
    testOrPackage?: string;
    preferredDate: string;
    preferredTime: string;
    locationType: "lab" | "home";
    notes?: string;
  },
  actorRole: StaffRole,
  actorId?: string
): Promise<{ id: string; bookingReference: string }> {
  if (!hasPermission(actorRole, "appointments.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot create appointment requests.`);
  }

  const supabase = getServiceRoleClient();
  const bookingReference = generateBookingReference("APT");

  const { data, error } = await supabase
    .from("appointment_requests")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || null,
      test_or_package: input.testOrPackage || null,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      location_type: input.locationType,
      notes: input.notes || null,
      status: "scheduled",
      booking_reference: bookingReference,
    })
    .select("id")
    .single();

  if (error) throw error;

  await logAudit({
    action: "BOOKING_CREATED",
    entityType: "appointment_requests",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { bookingReference, source: "staff" },
  });

  return { id: data.id, bookingReference };
}

export async function listAppointmentRequests(actorRole: StaffRole): Promise<AppointmentRequest[]> {
  if (!hasPermission(actorRole, "appointments.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view appointment requests.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("appointment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateAppointmentStatus(
  requestId: string,
  status: IntakeStatus,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "appointments.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update appointment requests.`);
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("appointment_requests").update({ status }).eq("id", requestId);
  if (error) throw error;

  await logAudit({
    action: "BOOKING_STATUS_UPDATED",
    entityType: "appointment_requests",
    entityId: requestId,
    actorId,
    actorRole,
    metadata: { status },
  });
}

/**
 * Reschedule and/or annotate an appointment request. `rescheduled_date`/
 * `rescheduled_time` are stored separately from the patient's original
 * `preferred_date`/`preferred_time` so the original request is never lost —
 * the admin UI shows both. Setting status to "scheduled" here is a
 * convenience only when a new date/time is actually provided; passing only
 * notes leaves status untouched.
 */
export async function rescheduleAppointment(
  requestId: string,
  input: { rescheduledDate?: string; rescheduledTime?: string; adminNotes?: string },
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "appointments.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update appointment requests.`);
  }

  const supabase = getServiceRoleClient();
  const update: Partial<AppointmentRequest> = {};
  if (input.adminNotes !== undefined) update.admin_notes = input.adminNotes || null;
  if (input.rescheduledDate) {
    update.rescheduled_date = input.rescheduledDate;
    update.rescheduled_time = input.rescheduledTime || null;
    update.status = "scheduled";
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from("appointment_requests").update(update).eq("id", requestId);
  if (error) throw error;

  await logAudit({
    action: "APPOINTMENT_RESCHEDULED",
    entityType: "appointment_requests",
    entityId: requestId,
    actorId,
    actorRole,
    metadata: {
      rescheduledDate: input.rescheduledDate ?? null,
      rescheduledTime: input.rescheduledTime ?? null,
      notesUpdated: input.adminNotes !== undefined,
    },
  });
}
