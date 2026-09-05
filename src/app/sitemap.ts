import type { MetadataRoute } from "next";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/about", "/services", "/contact", "/book", "/faq", "/packages", "/home-collection"];
  let services: Awaited<ReturnType<typeof listPublishedServices>> = [];
  try {
    services = await listPublishedServices();
  } catch {
    // Never make the sitemap unavailable because the catalogue is temporarily offline.
  }

  return [
    ...staticRoutes.map((path) => ({ url: canonical(path) })),
    ...services.map((service) => ({
      url: canonical(`/services/${service.slug}`),
      lastModified: service.updated_at ? new Date(service.updated_at) : undefined,
    })),
  ];
}
