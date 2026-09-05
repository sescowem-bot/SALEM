import type { MetadataRoute } from "next";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { canonical } from "@/lib/seo";
import { listPublishedArticles } from "@/lib/data/seoArticles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/about", "/services", "/contact", "/book", "/faq", "/packages", "/home-collection", "/blog"];
  let services: Awaited<ReturnType<typeof listPublishedServices>> = [];
  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    services = await listPublishedServices();
  } catch {
    // Never make the sitemap unavailable because the catalogue is temporarily offline.
  }
  try {
    articles = await listPublishedArticles();
  } catch {
    // Articles are optional; do not break the sitemap if the CMS is unavailable.
  }

  return [
    ...staticRoutes.map((path) => ({ url: canonical(path) })),
    ...services.map((service) => ({
      url: canonical(`/services/${service.slug}`),
      lastModified: service.updated_at ? new Date(service.updated_at) : undefined,
    })),
    ...articles.map((article) => ({ url: canonical(`/blog/${article.slug}`), lastModified: article.updated_at ? new Date(article.updated_at) : undefined })),
  ];
}
