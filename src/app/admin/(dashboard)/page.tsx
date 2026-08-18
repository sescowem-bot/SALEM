import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";

export const metadata: Metadata = {
  title: "Staff Area | Salem Medical Laboratories",
  robots: { index: false, follow: false },
};

export default async function AdminHome() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  return (
    <AdminShell
      eyebrow="Staff Area"
      title="Internal tools"
      lead="This section is for laboratory staff only. It is not linked from the public website."
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {can(staff, "reports.view") ? (
          <Link
            href="/admin/results-entry"
            className="surface-card flex items-start gap-4 p-6 transition-colors hover:border-cyan/45"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-base font-semibold text-navy-deep">
                Enter a laboratory result <ArrowRight className="h-4 w-4 shrink-0" />
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                Manually enter results or upload an existing PDF/JPG/PNG report for a patient.
              </span>
            </span>
          </Link>
        ) : (
          <p className="surface-card p-6 text-sm text-muted-foreground">
            No laboratory result tools are available for your role ({staff.role}).
          </p>
        )}
      </div>
    </AdminShell>
  );
}
