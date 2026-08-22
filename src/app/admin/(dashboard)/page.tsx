import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  ClipboardCheck,
  CalendarCheck,
  Home as HomeIcon,
  Mail,
  FlaskConical,
  UserCog,
  ArrowRight,
} from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getDashboardStats } from "@/lib/data/dashboardStats";

export const dynamic = "force-dynamic";

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
      className="surface-card flex items-start gap-4 p-5 transition-colors hover:border-cyan/45"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold text-navy-deep">{count}</span>
        <span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-navy-deep">
          {label} <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

function SectionCard({
  title,
  viewAllHref,
  children,
  emptyLabel,
  isEmpty,
}: {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
  emptyLabel: string;
  isEmpty: boolean;
}) {
  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-navy-deep">{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-semibold text-purple hover:underline">
            View all
          </Link>
        ) : null}
      </div>
      <div className="mt-4">
        {isEmpty ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : children}
      </div>
    </div>
  );
}

export default async function AdminHome() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const stats = await getDashboardStats(staff);
  const { permissions: perm } = stats;

  const tiles: { href: string; icon: typeof FileText; label: string; count: number; hint: string }[] = [];

  if (perm.canPatients) {
    tiles.push({
      href: "/admin/patients",
      icon: Users,
      label: "Patients",
      count: stats.patientCount,
      hint: "Registered in the system",
    });
  }
  if (perm.canAppointments) {
    tiles.push({
      href: "/admin/appointments",
      icon: CalendarCheck,
      label: "Appointments",
      count: stats.pendingAppointments,
      hint: `${stats.pendingAppointments} new, ${stats.totalAppointments} total`,
    });
  }
  if (perm.canHomeCollection) {
    tiles.push({
      href: "/admin/home-collection",
      icon: HomeIcon,
      label: "Home collection",
      count: stats.pendingHomeCollection,
      hint: `${stats.pendingHomeCollection} pending, ${stats.totalHomeCollection} total`,
    });
  }
  if (perm.canReports) {
    tiles.push({
      href: "/admin/results-entry",
      icon: FileText,
      label: "Draft reports",
      count: stats.draftReportsCount,
      hint: "In progress with laboratory staff",
    });
  }
  if (perm.canReview) {
    tiles.push({
      href: "/admin/review",
      icon: ClipboardCheck,
      label: "Review queue",
      count: stats.reviewQueueCount,
      hint: "Awaiting review or publish",
    });
  }
  if (perm.canReports && stats.reportStatusCounts) {
    tiles.push({
      href: "/admin/review",
      icon: FlaskConical,
      label: "Published reports",
      count: stats.reportStatusCounts.published,
      hint: "Released to patients",
    });
  }
  if (perm.canEnquiries) {
    tiles.push({
      href: "/admin/messages",
      icon: Mail,
      label: "Contact messages",
      count: stats.unreadMessages,
      hint: `${stats.unreadMessages} unread, ${stats.totalMessages} total`,
    });
  }
  if (perm.canCatalogue) {
    tiles.push({
      href: "/admin/services",
      icon: FlaskConical,
      label: "Active services",
      count: stats.activeServicesCount,
      hint: "Live in the test catalogue",
    });
  }
  if (perm.canStaff) {
    tiles.push({
      href: "/admin/staff",
      icon: UserCog,
      label: "Active staff",
      count: stats.activeStaffCount,
      hint: "Currently enabled accounts",
    });
  }

  return (
    <AdminShell
      eyebrow="Staff Area"
      title={`Welcome, ${staff.fullName.split(" ")[0]}`}
      lead="Live operational data for Salem Medical Laboratories. Not linked from the public website."
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-8">
        {tiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t) => (
              <StatTile key={t.href + t.label} {...t} />
            ))}
          </div>
        ) : (
          <p className="surface-card p-6 text-sm text-muted-foreground">
            No dashboard data is available for your role ({staff.role}).
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {perm.canAppointments ? (
            <SectionCard
              title="Recent appointments"
              viewAllHref="/admin/appointments"
              isEmpty={stats.recentAppointments.length === 0}
              emptyLabel="No appointment requests yet."
            >
              <ul className="divide-y divide-border">
                {stats.recentAppointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-deep">{a.full_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {a.preferred_date ?? "—"} {a.preferred_time ?? ""}
                      </span>
                    </span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {perm.canPatients ? (
            <SectionCard
              title="Recently registered patients"
              viewAllHref="/admin/patients"
              isEmpty={stats.recentPatients.length === 0}
              emptyLabel="No patients registered yet."
            >
              <ul className="divide-y divide-border">
                {stats.recentPatients.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Link href={`/admin/patients/${p.id}`} className="min-w-0 hover:underline">
                      <span className="block truncate text-sm font-medium text-navy-deep">{p.full_name}</span>
                      <span className="block text-xs text-muted-foreground">{p.phone ?? p.email ?? "No contact on file"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {perm.canEnquiries ? (
            <SectionCard
              title="Recent contact messages"
              viewAllHref="/admin/messages"
              isEmpty={stats.recentMessages.length === 0}
              emptyLabel="No contact messages yet."
            >
              <ul className="divide-y divide-border">
                {stats.recentMessages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-deep">{m.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.message}</span>
                    </span>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {perm.canAudit ? (
            <SectionCard
              title="Recent audit activity"
              viewAllHref="/admin/audit"
              isEmpty={stats.recentAudit.length === 0}
              emptyLabel="No audit activity recorded yet."
            >
              <ul className="divide-y divide-border">
                {stats.recentAudit.map((entry) => (
                  <li key={entry.id} className="py-2.5 first:pt-0 last:pb-0">
                    <span className="block text-sm font-medium text-navy-deep">
                      {entry.action.replaceAll("_", " ")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {entry.entity_type} · {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
