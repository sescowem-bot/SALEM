import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { ServiceDetailView } from "@/components/salem/ServiceDetailView";
import { requireStaff, can } from "@/lib/auth/session";
import { getServiceForPreview, listRelatedPublishedServices } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ServicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;

  if (!can(staff, "catalogue.manage")) {
    redirect("/admin");
  }

  const service = await getServiceForPreview(id, staff.role);
  if (!service) notFound();

  const related = await listRelatedPublishedServices(service.category_id, service.id);
  const heroImageUrl = service.hero_image_path ? getServiceImagePublicUrl(service.hero_image_path) : null;

  return (
    <div>
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
        <Link href={`/admin/services/${service.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep hover:text-navy">
          <ArrowLeft className="h-4 w-4 shrink-0" /> Back to editor
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin preview — {staff.fullName}
        </span>
      </div>
      <SiteLayout>
        <ServiceDetailView service={service} heroImageUrl={heroImageUrl} related={related} isPreview />
      </SiteLayout>
    </div>
  );
}
