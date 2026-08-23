import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listMyReports } from "@/lib/data/approvals";

export const metadata: Metadata = {
  title: "My Workspace | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function StaffWorkspacePage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "reports.create_draft") && !can(staff, "reports.edit_draft")) {
    return (
      <AdminShell
        eyebrow="Results System"
        title="Not available for your role"
        staffName={staff.fullName}
        staffRole={staff.role}
        navItems={navItems}
      >
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) has no personal report workspace.
        </p>
      </AdminShell>
    );
  }

  const reports = await listMyReports({ userId: staff.userId, role: staff.role });

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="My workspace"
      lead="Every report you've created — drafts, submissions awaiting a decision, and past outcomes."
      backTo="/admin/operations"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {reports.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          No reports yet.{" "}
          <Link href="/admin/results-entry" className="font-semibold text-navy underline underline-offset-2">
            Start one from Results entry
          </Link>
          .
        </p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {reports.map((r) => {
            const approver = r.assigned_approver as unknown as { full_name: string } | null;
            let badgeStatus: string = r.status;
            let badgeLabel: string | undefined;
            if (r.status === "draft" && r.submitted_for_review) {
              badgeStatus = "pending";
              badgeLabel = approver ? `Awaiting ${approver.full_name}` : "Awaiting approval";
            } else if (r.status === "draft" && r.report_comment) {
              badgeLabel = "Needs correction";
            }

            return (
              <Link
                key={r.id}
                href={`/admin/reports/${r.id}`}
                className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy-deep">{r.patient_name_snapshot}</span>
                    <span className="block text-xs text-muted-foreground">
                      Lab number {r.lab_number} · updated {new Date(r.last_modified_at).toLocaleDateString()}
                    </span>
                  </span>
                </span>
                <span className="shrink-0">
                  <StatusBadge status={badgeStatus} label={badgeLabel} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
