import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { listTestCategories, listActiveTests } from "@/lib/data/testCatalog";
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

export default async function ServicesPage() {
  const [categories, tests] = await Promise.all([listTestCategories(), listActiveTests()]);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Laboratory Services"
        title="A diagnostic menu, run under one quality system."
        lead="Every sample is barcoded on arrival, processed under documented quality control and reviewed by a scientist before release."
      />
      <ServicesPageClient categories={categories} tests={tests} />
    </SiteLayout>
  );
}
