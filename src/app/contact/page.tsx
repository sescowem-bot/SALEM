import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ContactPageClient } from "./ContactPageClient";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { ContactContent, SeoContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSeoContent, getSiteSeoImage, canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  const title = seo.contactTitle || "Contact Salem Medical Laboratories";
  const description =
    seo.contactDescription ||
    "Reach Salem Medical Laboratories — address, phone, WhatsApp, email, opening hours and urgent result enquiries.";
  return publicMetadata({ title, description, pathname: "/contact", image: await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getPublishedPageContent<ContactContent>("contact"),
    getSiteSettings(),
  ]);

  const sameAs = [settings.socialFacebook, settings.socialInstagram, settings.socialLinkedin, settings.socialTwitter, settings.socialYoutube].filter(Boolean);
  const localSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DiagnosticLab"],
    name: settings.orgName,
    url: canonical("/contact"),
    telephone: settings.phonePrimary,
    email: settings.emailPrimary,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.city || settings.state ? [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ") || undefined : undefined,
      addressLocality: settings.city || undefined,
      addressRegion: settings.state || undefined,
      addressCountry: "NG",
    },
    sameAs,
    medicalSpecialty: "https://schema.org/LaboratoryScience",
    areaServed: ["Lagos", "Ogun", "Nigeria"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }} />
      <SiteLayout>
      <PageHeader
        eyebrow="Contact & Location"
        title={content.pageHeading || "We're close by, and easy to reach."}
        lead={content.introduction || "Call, message or walk in. A real person answers — no phone trees."}
      />
        <ContactPageClient content={content} settings={settings} />
      </SiteLayout>
    </>
  );
}
