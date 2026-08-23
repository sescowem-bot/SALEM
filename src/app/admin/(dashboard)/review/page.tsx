import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listReviewQueue } from "@/lib/data/labReports";
import { listApprovalQueue } from "@/lib/data/approvals";

export const metadata: Metadata = {
  title: "Approval Queue | Salem Staff Area",
  robots: { index: false, follow: false },
};

function QueueRow({
  id,
  patientName,
  labNumber,
  testNames,
  badge,
}: {
  id: string;
  patientName: string;
  labNumber: string;
  testNames: string[];
  badge: ReactNode;
}) {
  return (
    <Link
      href={`/admin/reports/${id}`}
      className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-navy-deep">{patientName}</span>
          <span className="block text-xs text-muted-foreground">Lab number {labNumber}</span>
          {testNames.length > 0 ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{testNames.join(", ")}</span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0">{badge}</span>
    </Link>
  );
}

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
          Your role ({staff.role}) does not have access to the approval queue.
        </p>
      </AdminShell>
    );
  }

  const [{ mine, others }, reviewQueue] = await Promise.all([
    listApprovalQueue({ userId: staff.userId, role: staff.role }),
    listReviewQueue(),
  ]);

  const readyToPublish = reviewQueue.filter((r) => r.status === "reviewed");

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="Approval queue"
      lead="Submissions routed to you for a decision, plus reports approved and ready to publish."
      backTo="/admin/operations"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned to you ({mine.length})
        </h2>
        {mine.length === 0 ? (
          <p className="surface-card p-6 text-sm text-muted-foreground">Nothing awaiting your decision right now.</p>
        ) : (
          <div className="surface-card divide-y divide-border">
            {mine.map((r) => {
              const report = r.lab_reports as unknown as {
                id: string;
                lab_number: string;
                patient_name_snapshot: string;
                report_tests: { tests: { name: string } | null }[];
              } | null;
              if (!report) return null;
              const testNames = (report.report_tests ?? [])
                .map((rt) => rt.tests?.name)
                .filter((n): n is string => Boolean(n));
              return (
                <QueueRow
                  key={r.id}
                  id={report.id}
                  patientName={report.patient_name_snapshot}
                  labNumber={report.lab_number}
                  testNames={testNames}
                  badge={<StatusBadge status="pending" label="Awaiting your decision" />}
                />
              );
            })}
          </div>
        )}
      </section>

      {others.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All pending approvals ({others.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Assigned to other approvers — visible to admins for oversight only. Prefer letting the assigned approver
            act unless they&apos;re unavailable.
          </p>
          <div className="surface-card divide-y divide-border">
            {others.map((r) => {
              const report = r.lab_reports as unknown as {
                id: string;
                lab_number: string;
                patient_name_snapshot: string;
                report_tests: { tests: { name: string } | null }[];
              } | null;
              if (!report) return null;
              const testNames = (report.report_tests ?? [])
                .map((rt) => rt.tests?.name)
                .filter((n): n is string => Boolean(n));
              return (
                <QueueRow
                  key={r.id}
                  id={report.id}
                  patientName={report.patient_name_snapshot}
                  labNumber={report.lab_number}
                  testNames={testNames}
                  badge={<StatusBadge status="pending" label="Pending" />}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Ready to publish ({readyToPublish.length})
        </h2>
        {readyToPublish.length === 0 ? (
          <p className="surface-card p-6 text-sm text-muted-foreground">No approved reports awaiting publish.</p>
        ) : (
          <div className="surface-card divide-y divide-border">
            {readyToPublish.map((r) => {
              const joined = r as unknown as { report_tests: { tests: { name: string } | null }[] };
              const testNames = (joined.report_tests ?? [])
                .map((rt) => rt.tests?.name)
                .filter((n): n is string => Boolean(n));
              return (
                <QueueRow
                  key={r.id}
                  id={r.id}
                  patientName={r.patient_name_snapshot}
                  labNumber={r.lab_number}
                  testNames={testNames}
                  badge={<StatusBadge status="reviewed" label="Awaiting publish" />}
                />
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
