import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowRight, ClipboardCheck, CalendarCheck, Home as HomeIcon } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listReviewQueue, listDraftReports } from "@/lib/data/labReports";
import { listAppointmentRequests } from "@/lib/data/appointments";
import { listHomeCollectionRequests } from "@/lib/data/homeCollection";

export const metadata: Metadata = {
  title: "Staff Area | Salem Medical Laboratories",
  robots: { index: false, follow: false },
};

function StatTile({
  href,
  icon: Icon,
  label,
  count,
  hint,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
  count: number;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card flex items-start gap-4 p-6 transition-colors hover:border-cyan/45"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-base font-semibold text-navy-deep">
          {label} <ArrowRight className="h-4 w-4 shrink-0" />
        </span>
        <span className="mt-1 block text-2xl font-bold text-navy-deep">{count}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

export default async function AdminHome() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  const canSeeReports = can(staff, "reports.view");
  const canReview = can(staff, "reports.review");
  const canManageAppointments = can(staff, "appointments.manage");
  const canManageHomeCollection = can(staff, "home_collection.manage");

  // Every count below reuses the exact list functions the destination pages
  // already call — no new queries, no duplicate data access.
  const [draftReports, reviewQueue, appointments, homeCollection] = await Promise.all([
    canSeeReports ? listDraftReports() : Promise.resolve([]),
    canReview ? listReviewQueue() : Promise.resolve([]),
    canManageAppointments ? listAppointmentRequests(staff.role) : Promise.resolve([]),
    canManageHomeCollection ? listHomeCollectionRequests(staff.role, staff.userId) : Promise.resolve([]),
  ]);

  const pendingAppointments = appointments.filter((a) => a.status === "new").length;
  const pendingHomeCollection = homeCollection.filter((h) => h.status === "pending").length;

  const hasAnyTile = canSeeReports || canReview || canManageAppointments || canManageHomeCollection;

  return (
    <AdminShell
      eyebrow="Staff Area"
      title={`Welcome, ${staff.fullName.split(" ")[0]}`}
      lead="This section is for laboratory staff only. It is not linked from the public website."
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {hasAnyTile ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {canSeeReports ? (
            <StatTile
              href="/admin/results-entry"
              icon={FileText}
              label="Enter a laboratory result"
              count={draftReports.length}
              hint={`${draftReports.length} draft report${draftReports.length === 1 ? "" : "s"} in progress`}
            />
          ) : null}
          {canReview ? (
            <StatTile
              href="/admin/review"
              icon={ClipboardCheck}
              label="Review queue"
              count={reviewQueue.length}
              hint={`${reviewQueue.length} report${reviewQueue.length === 1 ? "" : "s"} awaiting review or publish`}
            />
          ) : null}
          {canManageAppointments ? (
            <StatTile
              href="/admin/appointments"
              icon={CalendarCheck}
              label="Appointment requests"
              count={pendingAppointments}
              hint={`${pendingAppointments} new, ${appointments.length} total`}
            />
          ) : null}
          {canManageHomeCollection ? (
            <StatTile
              href="/admin/home-collection"
              icon={HomeIcon}
              label="Home collection"
              count={pendingHomeCollection}
              hint={`${pendingHomeCollection} pending, ${homeCollection.length} total`}
            />
          ) : null}
        </div>
      ) : (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          No laboratory result tools are available for your role ({staff.role}).
        </p>
      )}
    </AdminShell>
  );
}
