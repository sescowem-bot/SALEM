import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ContactPageClient } from "./ContactPageClient";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { ContactContent, SeoContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSiteSeoImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublishedPageContent<SeoContent>("seo");
  const title = seo.contactTitle || "Contact Salem Medical Laboratories";
  const description =
    seo.contactDescription ||
    "Reach Salem Medical Laboratories — address, phone, WhatsApp, email, opening hours and urgent result enquiries.";
  return publicMetadata({ title, description, pathname: "/contact", image: await getSiteSeoImage() });
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getPublishedPageContent<ContactContent>("contact"),
    getSiteSettings(),
  ]);

  const sameAs = [settings.socialFacebook, settings.socialInstagram, settings.socialLinkedin, settings.socialTwitter, settings.socialYoutube].filter(Boolean);
  const localSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: settings.orgName,
    url: "https://salemmedicals.com/contact",
    telephone: settings.phonePrimary,
    email: settings.emailPrimary,
    address: {
      "@type": "PostalAddress",
      streetAddress: [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ") || undefined,
      addressLocality: settings.city || "Lagos",
      addressRegion: settings.state || undefined,
      addressCountry: "NG",
    },
    sameAs,
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
