import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ContactPageClient } from "./ContactPageClient";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import type { ContactContent, SeoContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublishedPageContent<SeoContent>("seo");
  const title = seo.contactTitle || "Contact Salem Medical Laboratories";
  const description =
    seo.contactDescription ||
    "Reach Salem Medical Laboratories — address, phone, WhatsApp, email, opening hours and urgent result enquiries.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getPublishedPageContent<ContactContent>("contact"),
    getSiteSettings(),
  ]);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contact & Location"
        title={content.pageHeading || "We're close by, and easy to reach."}
        lead={content.introduction || "Call, message or walk in. A real person answers — no phone trees."}
      />
      <ContactPageClient content={content} settings={settings} />
    </SiteLayout>
  );
}
