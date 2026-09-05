import type { Metadata } from "next";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { SeoContent } from "@/lib/data/websiteContentTypes";

const configuredSiteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.salemmedicals.com").replace(/\/$/, "");

// Vercel permanently redirects the apex domain to www. Keep every SEO URL
// on the final production origin so the sitemap, canonicals, OG URLs and
// structured data never point Google at redirecting URLs.
export const PUBLIC_SITE_ORIGIN = (() => {
  try {
    const parsedOrigin = new URL(configuredSiteOrigin);
    if (parsedOrigin.hostname === "salemmedicals.com") parsedOrigin.hostname = "www.salemmedicals.com";
    parsedOrigin.pathname = "";
    parsedOrigin.search = "";
    parsedOrigin.hash = "";
    parsedOrigin.protocol = "https:";
    return parsedOrigin.toString().replace(/\/$/, "");
  } catch {
    return "https://www.salemmedicals.com";
  }
})();

export function canonical(pathname: string): string {
  const clean = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `${PUBLIC_SITE_ORIGIN}${clean}`;
}

export const SEO_FALLBACKS: Required<Pick<SeoContent, "defaultTitle" | "defaultDescription" | "orgDescription" | "homepageTitle" | "homepageDescription" | "aboutTitle" | "aboutDescription" | "servicesTitle" | "servicesDescription" | "contactTitle" | "contactDescription">> = {
  defaultTitle: "Salem Medical Laboratories | Medical Laboratory & Diagnostics",
  defaultDescription: "Salem Medical Laboratories provides medical laboratory testing, diagnostic investigations and home sample collection in Lagos and Ogun, Nigeria.",
  orgDescription: "Salem Medical Laboratories provides diagnostic laboratory testing with a focus on accurate results, quality assurance and patient care.",
  homepageTitle: "Salem Medical Laboratories | Medical Diagnostics in Lagos & Ogun",
  homepageDescription: "Medical laboratory testing and diagnostic services with accurate, timely results and home sample collection in Lagos and Ogun.",
  aboutTitle: "About Salem Medical Laboratories",
  aboutDescription: "Learn about Salem Medical Laboratories, our diagnostic services, quality approach and commitment to patient care in Nigeria.",
  servicesTitle: "Laboratory Services | Salem Medical Laboratories",
  servicesDescription: "Explore medical laboratory tests and diagnostic investigations available from Salem Medical Laboratories.",
  contactTitle: "Contact Salem Medical Laboratories",
  contactDescription: "Contact Salem Medical Laboratories for diagnostic test enquiries, bookings, home collection and result support.",
};

export async function getSeoContent(): Promise<SeoContent> {
  try { return { ...SEO_FALLBACKS, ...(await getPublishedPageContent<SeoContent>("seo")) }; } catch { return { ...SEO_FALLBACKS, robotsIndex: true }; }
}

export function publicMetadata(input: { title: string; description: string; pathname: string; image?: string | null; noIndex?: boolean }): Metadata {
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
