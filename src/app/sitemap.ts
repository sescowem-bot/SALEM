import type { MetadataRoute } from "next";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ["/", "/about", "/services", "/contact", "/book", "/faq", "/packages", "/home-collection"];
  const services = await listPublishedServices();
  return [
    ...staticRoutes.map((path) => ({ url: canonical(path), lastModified: now })),
    ...services.map((service) => ({ url: canonical(`/services/${service.slug}`), lastModified: now })),
  ];
}
