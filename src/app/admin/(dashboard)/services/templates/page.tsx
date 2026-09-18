import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listActiveTestTemplates } from "@/lib/data/testCatalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report Templates | Salem Staff Area", robots: { index: false, follow: false } };

export default async function ResultTemplatesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  if (!can(staff, "catalogue.manage")) return <AdminShell eyebrow="Services" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Your role does not have access to report templates.</p></AdminShell>;
  const templates = await listActiveTestTemplates(staff.role);
  return <AdminShell eyebrow="Services · Report templates" title="Report templates" lead="Manage the structures used when laboratory staff create reports. Templates can define tables and custom result sections." staffName={staff.fullName} staffRole={staff.role} navItems={navItems} actions={<Link href="/admin/services/templates/new" className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90">+ New template</Link>}>
    {templates.length === 0 ? <div className="surface-card p-6"><h2 className="font-semibold text-navy-deep">No active templates yet</h2><p className="mt-2 text-sm text-muted-foreground">Create the first report template to define the structure staff will use for result entry.</p><Link href="/admin/services/templates/new" className="mt-5 inline-flex rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">Create template</Link></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <article key={template.id} className="surface-card p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-navy-deep">{template.name}</h2><p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-purple">{template.structure_type}</p></div><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-navy">Active</span></div>{template.description ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{template.description}</p> : null}</article>)}</div>}
  </AdminShell>;
}
