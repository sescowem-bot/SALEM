import type { MetadataRoute } from "next";
import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api", "/api/", "/auth", "/auth/", "/results", "/results/"],
    },
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
  };
}
