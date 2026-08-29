import type { MetadataRoute } from "next";
import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/services/", "/about", "/contact", "/book", "/faq", "/packages", "/home-collection"], disallow: ["/admin/", "/admin", "/results/", "/api/"] }],
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
  };
}
