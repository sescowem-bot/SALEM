import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { getSiteSettings } from "./siteSettings";
import { logAudit } from "./audit";
import { getEmailProvider } from "@/lib/email/provider";
import {
  buildApprovalRequestedTemplate,
  buildReportApprovedTemplate,
  buildReportRejectedTemplate,
  buildReportReturnedTemplate,
  buildPatientResultAvailableTemplate,
  type NotificationReportContext,
} from "@/lib/email/templates";

export type NotificationEventType = Database["public"]["Tables"]["notifications"]["Row"]["event_type"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * Advanced 6 §1 — the single reusable entry point every workflow event
 * goes through, instead of scattering ad hoc email calls through
 * lib/data/labReports.ts / lib/data/approvals.ts. Every call:
 *
 *   1. Resolves the recipient's email address server-side (staff email
 *      lives in Supabase Auth, not staff_profiles — see resolveStaffEmail
 *      below; patient email is patients.email).
 *   2. Writes a `notifications` row FIRST, status "pending" — so the
 *      attempt is recorded even if step 3 fails outright — then logs
 *      NOTIFICATION_CREATED.
 *   3. Builds the branded template and calls the configured EmailProvider.
 *   4. Updates the row to "sent" (+ sent_at, only on a real provider
 *      confirmation) or "failed" (+ failure_reason), and logs
 *      NOTIFICATION_SENT / NOTIFICATION_FAILED accordingly.
 *
 * Deliberately NOT permission-gated the way e.g. lib/data/signatories.ts
 * mutations are: this is never called directly from a Server Action in
 * response to a role "doing" something — it's the system-generated side
 * effect of an already-authorized workflow transition (submit / approve /
 * reject / return / publish), exactly like generateFinalReportPdf in
 * lib/data/reportDocuments.tsx. A failure here must never roll back or
 * block the underlying workflow action that triggered it — callers should
 * treat this as fire-and-forget-but-logged, not something to await failure
 * handling for.
 */
export async function dispatchReportNotification(input: {
  eventType: NotificationEventType;
  labReportId: string;
  recipientType: "staff" | "patient";
  recipientStaffId?: string;
  recipientPatientId?: string;
  comment?: string | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();

  const { data: report, error: reportError } = await supabase
    .from("lab_reports")
    .select("id, lab_number, result_reference, patient_name_snapshot")
    .eq("id", input.labReportId)
    .maybeSingle();
  if (reportError) throw reportError;
  if (!report) return; // nothing to notify about

  let recipientEmail: string | null = null;
  if (input.recipientType === "staff" && input.recipientStaffId) {
    recipientEmail = await resolveStaffEmail(input.recipientStaffId);
  } else if (input.recipientType === "patient" && input.recipientPatientId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("email")
      .eq("id", input.recipientPatientId)
      .maybeSingle();
    recipientEmail = patient?.email ?? null;
  }

  const siteSettings = await getSiteSettings();
  const reportContext: NotificationReportContext = {
    labReportId: report.id,
    labNumber: report.lab_number,
    resultReference: report.result_reference,
    patientName: report.patient_name_snapshot,
  };
  const template = buildTemplate(input.eventType, { report: reportContext, siteSettings, comment: input.comment });

  const { data: notification, error: insertError } = await supabase
    .from("notifications")
    .insert({
      event_type: input.eventType,
      recipient_type: input.recipientType,
      recipient_staff_id: input.recipientStaffId ?? null,
      recipient_patient_id: input.recipientPatientId ?? null,
      recipient_email: recipientEmail,
      lab_report_id: input.labReportId,
      subject: template.subject,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("[notifications] failed to record notification", input.eventType, insertError);
    return;
  }

  await logAudit({
    action: "NOTIFICATION_CREATED",
    entityType: "notifications",
    entityId: notification.id,
    metadata: { eventType: input.eventType, labReportId: input.labReportId, recipientType: input.recipientType },
  });

  if (!recipientEmail) {
    await markFailed(notification.id, "No email address on file for the recipient.");
    return;
  }

  const provider = getEmailProvider();
  const result = await provider.send({
    to: recipientEmail,
    toName: report.patient_name_snapshot,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (result.ok) {
    const { error } = await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", notification.id);
    if (error) console.error("[notifications] failed to mark sent", notification.id, error);

    await logAudit({
      action: "NOTIFICATION_SENT",
      entityType: "notifications",
      entityId: notification.id,
      metadata: { eventType: input.eventType, provider: provider.name },
    });
  } else {
    await markFailed(notification.id, result.error ?? "Unknown send failure.");
  }
}

async function markFailed(notificationId: string, reason: string): Promise<void> {
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("notifications")
    .update({ status: "failed", failure_reason: reason })
    .eq("id", notificationId);
  if (error) console.error("[notifications] failed to mark failed", notificationId, error);

  await logAudit({
    action: "NOTIFICATION_FAILED",
    entityType: "notifications",
    entityId: notificationId,
    metadata: { reason },
  });
}

function buildTemplate(
  eventType: NotificationEventType,
  ctx: Parameters<typeof buildApprovalRequestedTemplate>[0]
) {
  switch (eventType) {
    case "approval_requested":
      return buildApprovalRequestedTemplate(ctx);
    case "report_approved":
      return buildReportApprovedTemplate(ctx);
    case "report_rejected":
      return buildReportRejectedTemplate(ctx);
    case "report_returned":
      return buildReportReturnedTemplate(ctx);
    case "patient_result_available":
      return buildPatientResultAvailableTemplate(ctx);
    case "report_published":
      // No standalone email today — publishing and patient availability
      // happen atomically in lib/data/labReports.ts publishReport(), which
      // dispatches "patient_result_available" directly. This event type
      // exists in the schema for a future internal ("report is live")
      // notification without another migration, but nothing sends it yet.
      return buildReportApprovedTemplate(ctx);
    default:
      return buildReportApprovedTemplate(ctx);
  }
}

/**
 * Staff email lives in Supabase Auth (auth.users), not staff_profiles —
 * same place lib/data/staff.ts createStaffAccount() puts it, since
 * staff_profiles.id IS the auth user id. The Admin API is the only way to
 * read another user's email server-side; requires the service-role client.
 */
async function resolveStaffEmail(staffId: string): Promise<string | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.admin.getUserById(staffId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface NotificationListRow extends Notification {
  lab_report: { lab_number: string; patient_name_snapshot: string } | null;
}

/** Admin Notification Center (§6) — org-wide, gated the same as the audit log. */
export async function listAllNotifications(
  actorRole: StaffRole,
  filters?: { eventType?: NotificationEventType | "all"; status?: Notification["status"] | "all"; limit?: number }
): Promise<NotificationListRow[]> {
  if (!hasPermission(actorRole, "audit.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view the notification center.`);
  }

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("notifications")
    .select("*, lab_report:lab_reports(lab_number, patient_name_snapshot)")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 200);

  if (filters?.eventType && filters.eventType !== "all") query = query.eq("event_type", filters.eventType);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as NotificationListRow[];
}

/** Per-report delivery history (§7) — for the Admin report detail screen, not the org-wide inbox. */
export async function listReportNotifications(labReportId: string, actorRole: StaffRole): Promise<Notification[]> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view report notifications.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("lab_report_id", labReportId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
