import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listReviewQueue } from "@/lib/data/labReports";

export const metadata: Metadata = {
  title: "Review Queue | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ReviewQueuePage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "reports.review")) {
    return (
      <AdminShell
        eyebrow="Results System"
        title="Not available for your role"
        staffName={staff.fullName}
        staffRole={staff.role}
        navItems={navItems}
      >
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to the review queue.
        </p>
      </AdminShell>
    );
  }

  const queue = await listReviewQueue();

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="Review queue"
      lead="Reports submitted by laboratory staff, awaiting approval or publication."
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {queue.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">Nothing awaiting review right now.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {queue.map((r) => {
            const joined = r as unknown as { report_tests: { tests: { name: string } | null }[] };
            const testNames = joined.report_tests
              ?.map((rt) => rt.tests?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <Link
                key={r.id}
                href={`/admin/reports/${r.id}`}
                className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy-deep">{r.patient_name_snapshot}</span>
                    <span className="block text-xs text-muted-foreground">Lab number {r.lab_number}</span>
                    {testNames && testNames.length > 0 ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {testNames.join(", ")}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0">
                  <StatusBadge
                    status={r.status === "reviewed" ? "reviewed" : "contacted"}
                    label={r.status === "reviewed" ? "Awaiting publish" : "Awaiting review"}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
