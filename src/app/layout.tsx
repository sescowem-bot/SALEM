import type { Metadata } from "next";
import "./globals.css";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { SeoContent } from "@/lib/data/websiteContentTypes";
import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";

const fallbackDescription =
  "Salem Medical Laboratories offers blood tests, microbiology, molecular diagnostics, home sample collection and secure e-copy results.";

/**
 * Root layout metadata now reads live CMS/settings data from Supabase, so
 * — same reasoning as the /services force-dynamic fix — this can't be
 * statically prerendered at build time (every page inherits this layout,
 * including /_not-found, which Next.js tries to prerender regardless of
 * any page-level dynamic export). This also means a transient Supabase
 * hiccup during a real build would otherwise fail the whole site, so the
 * fetch below is wrapped in try/catch and falls back to the static
 * defaults rather than ever breaking metadata generation.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let seo: SeoContent = {};
  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try {
    [seo, settings] = await Promise.all([getPublishedPageContent<SeoContent>("seo"), getSiteSettings()]);
  } catch {
    // Fall through to static defaults below — never let a CMS/DB hiccup break metadata.
  }

  const title = seo.defaultTitle || "Salem Medical Laboratories | Pathology & Diagnostics";
  const description = seo.defaultDescription || seo.orgDescription || settings?.description || fallbackDescription;
  const orgName = settings?.orgName || "Salem Medical Laboratories";

  return {
    title: {
      default: title,
      template: `%s | ${orgName}`,
    },
    metadataBase: new URL(PUBLIC_SITE_ORIGIN),
    alternates: { canonical: PUBLIC_SITE_ORIGIN },
    description,
    openGraph: {
      title: orgName,
      description,
      type: "website",
      images: settings?.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: orgName,
      description,
    },
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico",
    },
    robots: seo.robotsIndex === false ? { index: false, follow: false } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try { settings = await getSiteSettings(); } catch { /* public pages still render */ }
  const sameAs = [settings?.socialInstagram, settings?.socialFacebook, settings?.socialLinkedin, settings?.socialTwitter, settings?.socialYoutube].filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalLaboratory",
    name: settings?.orgName || "Salem Medical Laboratories",
    description: settings?.description || fallbackDescription,
    url: PUBLIC_SITE_ORIGIN,
    telephone: settings?.phonePrimary,
    email: settings?.emailPrimary,
    address: { "@type": "PostalAddress", addressLocality: settings?.city || "Lagos", addressRegion: settings?.state || undefined, addressCountry: "NG" },
    sameAs,
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout is the correct place for this in the App Router */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
        />
      </head>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {children}
      </body>
    </html>
  );
}
