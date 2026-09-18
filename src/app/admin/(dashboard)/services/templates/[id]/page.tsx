import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getTemplateForAdmin } from "@/lib/data/testCatalog";
import { TemplateEditForm } from "./TemplateEditForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Report Template | Salem Staff Area", robots: { index: false, follow: false } };
export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  if (!can(staff, "catalogue.manage")) return <AdminShell eyebrow="Services" title="Not available" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Your role cannot manage templates.</p></AdminShell>;
  const { id } = await params;
  const template = await getTemplateForAdmin(id, staff.role);
  if (!template) notFound();
  return <AdminShell eyebrow="Services · Templates" title={`Edit ${template.name}`} lead={`${template.usageCount} test${template.usageCount === 1 ? " uses" : "s use"} this template. Changes affect future result entry; saved reports retain their recorded values.`} backTo="/admin/services/templates" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><TemplateEditForm template={template} /></AdminShell>;
}
