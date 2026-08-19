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

/**
 * Build-fix: this page reads the live test catalog from Supabase and has no
 * other dynamic API (no cookies/searchParams), so Next.js would otherwise
 * try to statically pre-render it at BUILD time — meaning every deploy
 * would fail outright if Supabase is briefly unreachable, its schema cache
 * hasn't refreshed yet after a migration, or the migrations simply haven't
 * been applied yet. `force-dynamic` makes this page render per-request
 * (like /book already does implicitly via searchParams) instead of at
 * build time, so a catalog/database hiccup surfaces as a normal runtime
 * error on this one page rather than blocking the whole production build.
 */
export const dynamic = "force-dynamic";

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
