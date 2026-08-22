import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type ContactSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];
type IntakeStatus = ContactSubmission["status"];

/**
 * Admin-facing read/status layer for the public contact form
 * (src/app/contact/actions.ts writes the rows via submitContactMessage in
 * lib/data/publicIntake.ts; this file is the staff-facing counterpart —
 * "ADMIN VISIBILITY of submitted communications", not a new inbox/email
 * system). Gated on `enquiries.manage`, same permission the existing
 * appointments/home-collection inboxes use for consistency.
 */
export async function listContactSubmissions(
  actorRole: StaffRole,
  opts?: { status?: IntakeStatus }
): Promise<ContactSubmission[]> {
  if (!hasPermission(actorRole, "enquiries.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view contact messages.`);
  }

  const supabase = getServiceRoleClient();
  let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Unread == status still "new" (the default status set at insert time). */
export async function countUnreadContactMessages(actorRole: StaffRole): Promise<number> {
  if (!hasPermission(actorRole, "enquiries.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view contact messages.`);
  }

  const supabase = getServiceRoleClient();
  const { count, error } = await supabase
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) throw error;
  return count ?? 0;
}

export async function updateContactSubmissionStatus(
  submissionId: string,
  status: IntakeStatus,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "enquiries.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update contact messages.`);
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", submissionId);
  if (error) throw error;

  await logAudit({
    action: "CONTACT_STATUS_UPDATED",
    entityType: "contact_submissions",
    entityId: submissionId,
    actorId,
    actorRole,
    metadata: { status },
  });
}
