import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { PUBLIC_SITE_ORIGIN, SEO_FALLBACKS, getSeoContent, canonical } from "@/lib/seo";

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
  const seo = await getSeoContent();
  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try {
    settings = await getSiteSettings();
  } catch {
    // Keep metadata generation resilient if site settings are temporarily unavailable.
  }

  const title = seo.defaultTitle || SEO_FALLBACKS.defaultTitle;
  const description = seo.defaultDescription || seo.orgDescription || settings?.description || SEO_FALLBACKS.defaultDescription;
  const orgName = settings?.orgName || "Salem Medical Laboratories";

  return {
    metadataBase: new URL(PUBLIC_SITE_ORIGIN),
    title: { default: title, template: `%s | ${orgName}` },
    description,
    alternates: { canonical: canonical("/") },
    openGraph: {
      title: orgName,
      description,
      type: "website",
      url: canonical("/"),
      images: settings?.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    twitter: { card: "summary_large_image", title: orgName, description },
    icons: { icon: settings?.faviconUrl || "/favicon.ico" },
    robots: seo.robotsIndex === false ? { index: false, follow: false } : { index: true, follow: true },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  const seo = await getSeoContent();
  try { settings = await getSiteSettings(); } catch { /* keep public shell resilient */ }
  const sameAs = [settings?.socialFacebook, settings?.socialInstagram, settings?.socialLinkedin, settings?.socialTwitter, settings?.socialYoutube].filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DiagnosticLab"],
    name: settings?.orgName || "Salem Medical Laboratories",
    description: settings?.description || fallbackDescription,
    url: canonical("/"),
    image: settings?.logoUrl || settings?.ogImageUrl || undefined,
    logo: settings?.logoUrl || undefined,
    telephone: settings?.phonePrimary,
    email: settings?.emailPrimary,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.city || settings?.state ? [settings?.addressLine1, settings?.addressLine2].filter(Boolean).join(", ") || undefined : undefined,
      addressLocality: settings?.city || undefined,
      addressRegion: settings?.state || undefined,
      addressCountry: "NG",
    },
    sameAs,
    medicalSpecialty: "https://schema.org/LaboratoryScience",
    areaServed: ["Lagos", "Ogun", "Nigeria"],
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.orgName || "Salem Medical Laboratories",
    url: canonical("/"),
    description: settings?.description || fallbackDescription,
    publisher: { "@type": ["LocalBusiness", "DiagnosticLab"], name: settings?.orgName || "Salem Medical Laboratories", url: canonical("/") },
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
        {seo.googleAnalyticsId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(seo.googleAnalyticsId || "")}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",${JSON.stringify(seo.googleAnalyticsId)},{anonymize_ip:true});` }} />
          </>
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {children}
      </body>
    </html>
  );
}
