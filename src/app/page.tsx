import type { Metadata } from "next";
import { publicMetadata, getSiteSeoImage } from "@/lib/seo";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { Hero } from "@/components/salem/Hero";
import { AboutPreview } from "@/components/salem/AboutPreview";
import { Services, type HomepageFeaturedService } from "@/components/salem/Services";
import { Trust } from "@/components/salem/Trust";
import { HomeService } from "@/components/salem/HomeService";
import { Results } from "@/components/salem/Results";
import { BookingCta, Contact } from "@/components/salem/BookingContact";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";
import type { HomepageContent, SeoContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublishedPageContent<SeoContent>("seo");
  const title = seo.homepageTitle || seo.defaultTitle || "Salem Medical Laboratories | Accurate Diagnostics, Better Health";
  const description =
    seo.homepageDescription || seo.defaultDescription || "Medical diagnostic laboratory offering accurate, timely testing with compassionate care.";
  return publicMetadata({ title, description, pathname: "/", image: await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}

export default async function HomePage() {
  const [content, settings, services] = await Promise.all([
    getPublishedPageContent<HomepageContent>("homepage"),
    getSiteSettings(),
    listPublishedServices(),
  ]);

  const featuredServices: HomepageFeaturedService[] = services
    .filter((s) => s.featured)
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      publicDescription: s.public_description,
      heroImageUrl: s.hero_image_path ? getServiceImagePublicUrl(s.hero_image_path) : null,
    }));

  return (
    <SiteLayout>
      <Hero content={content} />
      <AboutPreview content={content} />
      <Services heading={content.servicesHeading} description={content.servicesDescription} featuredServices={featuredServices} />
      <Trust content={content} />
      <HomeService />
      <Results />
      <BookingCta content={content} settings={settings} />
      <Contact settings={settings} />
    </SiteLayout>
  );
}
