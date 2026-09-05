import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { ServiceDetailView } from "@/components/salem/ServiceDetailView";
import { getPublishedServiceBySlug, listRelatedPublishedServices } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";
import { publicMetadata, getSeoContent, getSiteSeoImage, canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) return { title: "Service not found | Salem Medical Laboratories" };

  const seo = await getSeoContent();
  const title = service.seo_title || `${service.name} | Salem Medical Laboratories`;
  const description = service.seo_description || service.public_description || `${service.name} at Salem Medical Laboratories.`;

  return publicMetadata({ title, description, pathname: `/services/${slug}`, image: service.hero_image_path ? getServiceImagePublicUrl(service.hero_image_path) : await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) notFound();

  const related = await listRelatedPublishedServices(service.category_id, service.id);
  const heroImageUrl = service.hero_image_path ? getServiceImagePublicUrl(service.hero_image_path) : null;

  const serviceDescription = service.seo_description || service.public_description || `${service.name} at Salem Medical Laboratories.`;
  const serviceUrl = canonical(`/services/${service.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: service.name,
    description: serviceDescription,
    url: serviceUrl,
    provider: { "@type": "DiagnosticLab", name: "Salem Medical Laboratories", url: canonical("/") },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
      { "@type": "ListItem", position: 2, name: "Laboratory Services", item: canonical("/services") },
      { "@type": "ListItem", position: 3, name: service.name, item: serviceUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SiteLayout>
        <ServiceDetailView service={service} heroImageUrl={heroImageUrl} related={related} />
      </SiteLayout>
    </>
  );
}
