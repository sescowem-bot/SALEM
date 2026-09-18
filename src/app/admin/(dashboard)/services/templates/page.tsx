import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report Templates | Salem Staff Area", robots: { index: false, follow: false } };

export default async function ReportTemplatesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const allowed = can(staff, "catalogue.manage");
  return (
    <AdminShell eyebrow="Services · Reports" title="Report Templates" lead="Create and manage reusable report structures for laboratory investigations." staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/admin/services/templates/new" className="surface-card block p-6 transition-transform hover:-translate-y-0.5 hover:border-cyan">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy"><Plus className="h-5 w-5" /></span>
          <h2 className="mt-4 text-lg font-semibold text-navy-deep">Create report template</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Build reusable sections, fields and result tables for staff.</p>
        </Link>
        <Link href="/admin/services" className="surface-card block p-6 transition-transform hover:-translate-y-0.5 hover:border-cyan">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy"><FileText className="h-5 w-5" /></span>
          <h2 className="mt-4 text-lg font-semibold text-navy-deep">Services & investigations</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Return to the catalogue and connect investigations to templates.</p>
        </Link>
      </div>
      {!allowed ? <p className="mt-6 text-sm text-muted-foreground">Your role does not have permission to create or edit templates.</p> : null}
    </AdminShell>
  );
}
