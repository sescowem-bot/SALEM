import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { TemplateBuilderForm } from "../TemplateBuilderForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create Result Template | Salem Staff Area", robots: { index: false, follow: false } };

export default async function NewResultTemplatePage({ searchParams }: { searchParams?: Promise<{ returnTo?: string }> }) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  if (!can(staff, "catalogue.manage")) return <AdminShell eyebrow="Services" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Your role does not have access to service management.</p></AdminShell>;
  const query = searchParams ? await searchParams : {};
  const returnTo = query.returnTo && query.returnTo.startsWith("/admin/services") ? query.returnTo : "/admin/services/new";
  return <AdminShell eyebrow="Services · Result templates" title="Create result template" lead="Build the result structure for a specific investigation, then return to the service editor." backTo={returnTo} backLabel="Back to service" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><TemplateBuilderForm returnTo={returnTo} /></AdminShell>;
}
