import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, FileClock, ShieldCheck, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getReportStatusCounts } from "@/lib/data/labReports";
import { getApprovalPipelineCounts } from "@/lib/data/approvals";

export const metadata: Metadata = {
  title: "Operations | Salem Staff Area",
  robots: { index: false, follow: false },
};

function StatTile({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof ClipboardCheck;
  href?: string;
  tone?: "default" | "warn" | "good" | "bad";
}) {
  const toneClass =
    tone === "warn"
      ? "text-amber-700 bg-amber-50"
      : tone === "good"
        ? "text-emerald-700 bg-emerald-50"
        : tone === "bad"
          ? "text-destructive bg-destructive/10"
          : "text-navy bg-accent";

  const inner = (
    <div className="surface-card flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-2xl font-bold text-navy-deep">{value}</span>
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-transform hover:scale-[1.01]">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function OperationsDashboardPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "reports.view")) {
    return (
      <AdminShell
        eyebrow="Results System"
        title="Not available for your role"
        staffName={staff.fullName}
        staffRole={staff.role}
        navItems={navItems}
      >
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to Operations.
        </p>
      </AdminShell>
    );
  }

  const canReview = can(staff, "reports.review");

  const [statusCounts, pipeline] = await Promise.all([
    getReportStatusCounts(),
    getApprovalPipelineCounts({ userId: staff.userId, role: staff.role }),
  ]);

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="Operations dashboard"
      lead="Where every report stands in the draft → approve → publish pipeline, right now."
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Drafts in progress" value={statusCounts.draft} icon={FileClock} href="/admin/workspace" />
        {canReview ? (
          <StatTile
            label="Awaiting your decision"
            value={pipeline.pendingAssignedToMe}
            icon={ClipboardCheck}
            href="/admin/review"
            tone="warn"
          />
        ) : null}
        {canReview ? (
          <StatTile
            label="Pending approval (org-wide)"
            value={pipeline.pendingOrgWide}
            icon={ClipboardCheck}
            href="/admin/review"
          />
        ) : null}
        <StatTile
          label="Approved, ready to publish"
          value={statusCounts.reviewed}
          icon={ShieldCheck}
          href="/admin/review"
          tone="good"
        />
        <StatTile label="Published reports" value={statusCounts.published} icon={CheckCircle2} tone="good" />
      </div>

      {canReview ? (
        <section className="surface-card mt-6 p-6 sm:p-8">
          <h2 className="text-base font-semibold text-navy-deep">Recent decisions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The last 100 approval decisions made across the lab, by outcome.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Approved" value={pipeline.recentApproved} icon={CheckCircle2} tone="good" />
            <StatTile label="Rejected" value={pipeline.recentRejected} icon={XCircle} tone="bad" />
            <StatTile label="Returned for correction" value={pipeline.recentReturned} icon={RotateCcw} tone="warn" />
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
