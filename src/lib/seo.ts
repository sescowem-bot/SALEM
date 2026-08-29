import type { Metadata } from "next";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { SeoContent } from "@/lib/data/websiteContentTypes";

export const PUBLIC_SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://salemmedicals.com").replace(/\/$/, "");

export async function getSeoContent(): Promise<SeoContent> {
  try { return await getPublishedPageContent<SeoContent>("seo"); } catch { return {}; }
}

export function canonical(pathname: string): string {
  const clean = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `${PUBLIC_SITE_ORIGIN}${clean}`;
}

export function publicMetadata(input: {
  title: string;
  description: string;
  pathname: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const url = canonical(input.pathname);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: input.title, description: input.description, type: "website", url, images: input.image ? [input.image] : undefined },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: input.image ? [input.image] : undefined },
  };
}

export async function getSiteSeoImage(): Promise<string | null> {
  try { return (await getSiteSettings()).ogImageUrl; } catch { return null; }
}
