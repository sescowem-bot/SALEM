import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllTestCategoriesForAdmin, listActiveTestTemplates } from "@/lib/data/testCatalog";
import { ServiceEditorForm } from "../ServiceEditorForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add Service | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function NewServicePage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "catalogue.manage")) {
    return (
      <AdminShell eyebrow="Services" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to service management.
        </p>
      </AdminShell>
    );
  }

  const [categories, templates] = await Promise.all([
    listAllTestCategoriesForAdmin(staff.role),
    listActiveTestTemplates(staff.role),
  ]);

  return (
    <AdminShell
      eyebrow="Services · Staff Area"
      title="Add service"
      lead="New services start as drafts. Nothing shows on the public site until you publish."
      backTo="/admin/services"
      backLabel="Back to services"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <ServiceEditorForm mode="create" categories={categories} templates={templates} />
    </AdminShell>
  );
}
