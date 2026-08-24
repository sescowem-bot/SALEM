import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MailCheck, MailWarning, Clock3 } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllNotifications, type NotificationEventType } from "@/lib/data/notifications";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | Salem Staff Area",
  robots: { index: false, follow: false },
};

type NotificationStatus = Database["public"]["Tables"]["notifications"]["Row"]["status"];

const EVENT_LABEL: Record<NotificationEventType, string> = {
  approval_requested: "Approval requested",
  report_approved: "Report approved",
  report_rejected: "Report rejected",
  report_returned: "Report returned",
  report_published: "Report published",
  patient_result_available: "Patient result available",
};

const EVENT_FILTERS: { value: NotificationEventType | "all"; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "approval_requested", label: "Approval requested" },
  { value: "report_approved", label: "Approved" },
  { value: "report_rejected", label: "Rejected" },
  { value: "report_returned", label: "Returned" },
  { value: "patient_result_available", label: "Patient result available" },
];

const STATUS_FILTERS: { value: NotificationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; status?: string }>;
}) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "audit.view")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to the notification center.
        </p>
      </AdminShell>
    );
  }

  const { event, status } = await searchParams;
  const eventFilter = (event as NotificationEventType | "all" | undefined) ?? "all";
  const statusFilter = (status as NotificationStatus | "all" | undefined) ?? "all";

  const notifications = await listAllNotifications(staff.role, { eventType: eventFilter, status: statusFilter });

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Notifications"
      lead={`${notifications.length} notification${notifications.length === 1 ? "" : "s"} · workflow and patient-delivery emails, most recent first.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="surface-card mb-6 flex flex-wrap gap-2 p-4">
        {EVENT_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={{ pathname: "/admin/notifications", query: { ...(f.value === "all" ? {} : { event: f.value }), ...(status ? { status } : {}) } }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              eventFilter === f.value ? "border-navy bg-navy text-primary-foreground" : "border-border text-navy hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-1 my-auto h-4 w-px bg-border" />
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={{ pathname: "/admin/notifications", query: { ...(event ? { event } : {}), ...(f.value === "all" ? {} : { status: f.value }) } }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              statusFilter === f.value ? "border-navy bg-navy text-primary-foreground" : "border-border text-navy hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="surface-card overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Report</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date/time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-secondary/60">
                <td className="px-3 py-2.5 font-medium text-navy-deep">
                  {EVENT_LABEL[n.event_type] ?? n.event_type}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  <span className="capitalize">{n.recipient_type}</span>
                  {n.recipient_email ? ` · ${n.recipient_email}` : " · no email on file"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {n.lab_report ? (
                    <Link href={`/admin/reports/${n.lab_report_id}`} className="hover:text-navy hover:underline">
                      {n.lab_report.lab_number} — {n.lab_report.patient_name_snapshot}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      n.status === "sent"
                        ? "bg-emerald-100 text-emerald-700"
                        : n.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-foreground"
                    }`}
                    title={n.status === "failed" ? (n.failure_reason ?? undefined) : undefined}
                  >
                    {n.status === "sent" ? (
                      <MailCheck className="h-3.5 w-3.5" />
                    ) : n.status === "failed" ? (
                      <MailWarning className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}
                    {n.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {new Date(n.sent_at ?? n.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {notifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  <Mail className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  No notifications match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
