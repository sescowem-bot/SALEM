import type { Metadata } from "next";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { SeoContent } from "@/lib/data/websiteContentTypes";

export const PUBLIC_SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://salemmedicals.com").replace(/\/$/, "");

export function canonical(pathname: string): string {
  const clean = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `${PUBLIC_SITE_ORIGIN}${clean}`;
}

export const SEO_FALLBACKS: Required<Pick<SeoContent, "defaultTitle" | "defaultDescription" | "orgDescription" | "homepageTitle" | "homepageDescription" | "aboutTitle" | "aboutDescription" | "servicesTitle" | "servicesDescription" | "contactTitle" | "contactDescription">> = {
  defaultTitle: "Salem Medical Laboratories | Pathology & Diagnostics",
  defaultDescription: "Salem Medical Laboratories provides accurate medical laboratory testing, diagnostics and home sample collection in Nigeria.",
  orgDescription: "Salem Medical Laboratories provides diagnostic laboratory testing with a focus on accurate results, quality assurance and patient care.",
  homepageTitle: "Salem Medical Laboratories | Accurate Diagnostics, Better Health",
  homepageDescription: "Medical diagnostic laboratory offering accurate, timely testing with compassionate care.",
  aboutTitle: "About Salem Medical Laboratories",
  aboutDescription: "Learn about Salem Medical Laboratories, our diagnostic services, quality approach and commitment to patient care.",
  servicesTitle: "Laboratory Services | Salem Medical Laboratories",
  servicesDescription: "Explore Salem Medical Laboratories' diagnostic laboratory services and investigations.",
  contactTitle: "Contact Salem Medical Laboratories",
  contactDescription: "Reach Salem Medical Laboratories for laboratory enquiries, bookings, location and result support.",
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
