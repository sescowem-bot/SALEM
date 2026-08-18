import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ServicesPageClient } from "./ServicesPageClient";

const description =
  "Explore Salem Medical Laboratories' diagnostic catalogue — haematology, clinical chemistry, microbiology, immunology, serology, molecular diagnostics and histopathology.";

export const metadata: Metadata = {
  title: "Laboratory Services | Salem Medical Laboratories",
  description,
  openGraph: { title: "Laboratory Services | Salem Medical Laboratories", description, type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "Laboratory Services | Salem Medical Laboratories",
    description,
  },
};

export default function ServicesPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Laboratory Services"
        title="A diagnostic menu, run under one quality system."
        lead="Every sample is barcoded on arrival, processed under documented quality control and reviewed by a scientist before release."
      />
      <ServicesPageClient />
    </SiteLayout>
  );
}
