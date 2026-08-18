import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ContactPageClient } from "./ContactPageClient";

const description =
  "Reach Salem Medical Laboratories — address, phone, WhatsApp, email, opening hours and urgent result enquiries.";

export const metadata: Metadata = {
  title: "Contact Salem Medical Laboratories",
  description,
  openGraph: { title: "Contact Salem Medical Laboratories", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Contact Salem Medical Laboratories", description },
};

export default function ContactPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contact & Location"
        title="We're close by, and easy to reach."
        lead="Call, message or walk in. A real person answers — no phone trees."
      />
      <ContactPageClient />
    </SiteLayout>
  );
}
