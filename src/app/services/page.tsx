import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { listTestCategories, listPublishedServices } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";
import { ServicesPageClient } from "./ServicesPageClient";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  const description = seo.servicesDescription || "Explore Salem Medical Laboratories' diagnostic laboratory services and investigations.";
  return publicMetadata({ title: seo.servicesTitle || "Laboratory Services | Salem Medical Laboratories", description, pathname: "/services", image: await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}

/**
 * Build-fix: this page reads live, published-only service content from
 * Supabase and has no other dynamic API (no cookies/searchParams), so
 * Next.js would otherwise try to statically pre-render it at BUILD time —
 * meaning every deploy would fail outright if Supabase is briefly
 * unreachable, its schema cache hasn't refreshed yet after a migration, or
 * the migrations simply haven't been applied yet. `force-dynamic` makes
 * this page render per-request instead, so a catalog/database hiccup
 * surfaces as a normal runtime error on this one page rather than blocking
 * the whole production build.
 */
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([listTestCategories(), listPublishedServices()]);

  const servicesWithImages = services.map((s) => ({
    ...s,
    heroImageUrl: s.hero_image_path ? getServiceImagePublicUrl(s.hero_image_path) : null,
  }));

  return (
    <SiteLayout>
      <ServicesPageClient categories={categories} services={servicesWithImages} />
    </SiteLayout>
  );
}
