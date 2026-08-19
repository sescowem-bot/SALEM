import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type AppointmentRequest = Database["public"]["Tables"]["appointment_requests"]["Row"];
type IntakeStatus = Database["public"]["Tables"]["appointment_requests"]["Row"]["status"];

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
