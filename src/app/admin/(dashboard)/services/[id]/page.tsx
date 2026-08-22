import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getServiceById, listAllTestCategoriesForAdmin, listActiveTestTemplates } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";
import { ServiceEditorForm } from "../ServiceEditorForm";
import { ServiceImageUploader } from "../ServiceImageUploader";
import { ServicePublishBar } from "../ServicePublishBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Service | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const { id } = await params;

  if (!can(staff, "catalogue.manage")) {
    return (
      <AdminShell eyebrow="Services" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to service management.
        </p>
      </AdminShell>
    );
  }

  const [service, categories, templates] = await Promise.all([
    getServiceById(id, staff.role),
    listAllTestCategoriesForAdmin(staff.role),
    listActiveTestTemplates(staff.role),
  ]);
  if (!service) notFound();

  const currentImageUrl = service.hero_image_path ? getServiceImagePublicUrl(service.hero_image_path) : null;

  return (
    <AdminShell
      eyebrow="Services · Staff Area"
      title={service.name}
      lead={`Editing service. Status: ${service.content_status}${service.published_at ? ` · published ${new Date(service.published_at).toLocaleDateString()}` : ""}.`}
      backTo="/admin/services"
      backLabel="Back to services"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <ServicePublishBar testId={service.id} status={service.content_status} />
        <ServiceImageUploader testId={service.id} currentImageUrl={currentImageUrl} />
        <ServiceEditorForm mode="edit" service={service} categories={categories} templates={templates} />
      </div>
    </AdminShell>
  );
}
