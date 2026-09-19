import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus, Pencil, Power, Trash2, Layers3 } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllTemplatesForAdmin } from "@/lib/data/testCatalog";
import { TemplateListActions } from "./TemplateListActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report Templates | Salem Staff Area", robots: { index: false, follow: false } };

export default async function ReportTemplatesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const allowed = can(staff, "catalogue.manage");
  if (!allowed) return <AdminShell eyebrow="Services" title="Report Templates" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Your role does not have permission to manage report templates.</p></AdminShell>;
  const templates = await listAllTemplatesForAdmin(staff.role);
  return (
    <AdminShell eyebrow="Services · Templates" title="Report Templates" lead="Create, review and maintain reusable result structures used by laboratory tests." backTo="/admin/services" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-navy-deep">{templates.length} template{templates.length === 1 ? "" : "s"}</p><p className="text-xs text-muted-foreground">Templates define parameters or result tables. Tests use these structures when entering results.</p></div>
        <Link href="/admin/services/templates/new" className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"><Plus className="h-4 w-4" /> New template</Link>
      </div>
      {templates.length === 0 ? (
        <div className="surface-card p-10 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 text-base font-semibold text-navy-deep">No report templates yet</h2><p className="mt-1 text-sm text-muted-foreground">Create your first reusable result structure.</p></div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_120px_100px_90px_180px] gap-4 border-b border-border bg-secondary/50 px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground md:grid"><span>Template</span><span>Structure</span><span>Usage</span><span>Status</span><span className="text-right">Actions</span></div>
          <div className="divide-y divide-border">
            {templates.map((template) => <div key={template.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_120px_100px_90px_180px] md:items-center">
              <div className="min-w-0"><p className="font-semibold text-navy-deep">{template.name}</p><p className="mt-1 text-xs text-muted-foreground">{template.fields.length} parameters · {template.tableRows.length} rows · {template.tableColumns.length} columns</p></div>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-navy"><Layers3 className="h-3 w-3" /> {template.structure_type === "field_based" ? "Parameters" : "Table"}</span>
              <span className="text-sm text-navy">{template.usageCount} test{template.usageCount === 1 ? "" : "s"}</span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${template.is_active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>{template.is_active ? "Active" : "Inactive"}</span>
              <TemplateListActions templateId={template.id} isActive={template.is_active} usageCount={template.usageCount} />
            </div>)}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
