import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/salem/Header";
import { Footer } from "@/components/salem/Footer";
import { Hero } from "@/components/salem/Hero";
import { AboutPreview } from "@/components/salem/AboutPreview";
import { Services, type HomepageFeaturedService } from "@/components/salem/Services";
import { Trust } from "@/components/salem/Trust";
import { HomeService } from "@/components/salem/HomeService";
import { Results } from "@/components/salem/Results";
import { BookingCta, Contact } from "@/components/salem/BookingContact";
import { PageHeader } from "@/components/salem/SiteLayout";
import { ContactPageClient } from "@/app/contact/ContactPageClient";
import { requireStaff, can } from "@/lib/auth/session";
import { getWebsitePage } from "@/lib/data/websitePages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { getServiceImagePublicUrl } from "@/lib/data/storage";
import type {
  HomepageContent,
  AboutContent,
  ContactContent,
} from "@/lib/data/websiteContentTypes";
import type { WebsitePageKey } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview | Salem Staff Area",
  robots: { index: false, follow: false },
};

const VALID_KEYS: WebsitePageKey[] = ["homepage", "about", "contact", "footer", "seo"];

export default async function WebsiteContentPreviewPage({ params }: { params: Promise<{ key: string }> }) {
  const staff = await requireStaff();
  const { key } = await params;

  if (!can(staff, "settings.manage")) redirect("/admin");
  if (!VALID_KEYS.includes(key as WebsitePageKey)) notFound();
  const pageKey = key as WebsitePageKey;

  const [page, settings] = await Promise.all([getWebsitePage(pageKey, staff.role), getSiteSettings()]);
  const draft = page.draft_content;

  return (
    <div>
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
        <Link href={`/admin/website/${pageKey}`} className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep hover:text-navy">
          <ArrowLeft className="h-4 w-4 shrink-0" /> Back to editor
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Draft preview — {staff.fullName} — not visible to the public
        </span>
      </div>

      <div className="min-h-screen bg-background">
        <Header settings={settings} />
        <main>
          <PreviewBody pageKey={pageKey} draft={draft} settings={settings} />
        </main>
        <Footer settings={settings} content={pageKey === "footer" ? draft : undefined} />
      </div>
    </div>
  );
}

async function PreviewBody({
  pageKey,
  draft,
  settings,
}: {
  pageKey: WebsitePageKey;
  draft: Record<string, unknown>;
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
}) {
  if (pageKey === "homepage") {
    const content = draft as HomepageContent;
    const services = await listPublishedServices();
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
      <>
        <Hero content={content} />
        <AboutPreview content={content} />
        <Services heading={content.servicesHeading} description={content.servicesDescription} featuredServices={featuredServices} />
        <Trust content={content} />
        <HomeService />
        <Results />
        <BookingCta content={content} settings={settings} />
        <Contact settings={settings} />
      </>
    );
  }

  if (pageKey === "about") {
    const content = draft as AboutContent;
    return (
      <>
        <PageHeader
          eyebrow="About Salem"
          title={content.pageTitle || "A laboratory built by scientists who take results personally."}
          lead={content.introduction || "Salem Medical Laboratories exists to close the gap between fast diagnostics and trustworthy diagnostics."}
        />
        <section className="bg-background py-16">
          <div className="mx-auto max-w-3xl space-y-6 px-5 sm:px-6">
            {content.whoWeAre ? <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{content.whoWeAre}</p> : null}
            <div className="grid gap-4 sm:grid-cols-3">
              {content.mission ? <div className="surface-card p-5"><h3 className="text-sm font-semibold text-navy-deep">Mission</h3><p className="mt-1 text-xs text-muted-foreground">{content.mission}</p></div> : null}
              {content.vision ? <div className="surface-card p-5"><h3 className="text-sm font-semibold text-navy-deep">Vision</h3><p className="mt-1 text-xs text-muted-foreground">{content.vision}</p></div> : null}
              {content.values ? <div className="surface-card p-5"><h3 className="text-sm font-semibold text-navy-deep">Values</h3><p className="mt-1 text-xs text-muted-foreground">{content.values}</p></div> : null}
            </div>
            {content.qualityStatement ? <div className="surface-card p-5"><h3 className="text-sm font-semibold text-navy-deep">Quality assurance</h3><p className="mt-1 text-sm text-muted-foreground">{content.qualityStatement}</p></div> : null}
            {content.professionalStandards ? <div className="surface-card p-5"><h3 className="text-sm font-semibold text-navy-deep">Certifications &amp; accreditation</h3><p className="mt-1 text-sm text-muted-foreground">{content.professionalStandards}</p></div> : null}
          </div>
        </section>
      </>
    );
  }

  if (pageKey === "contact") {
    const content = draft as ContactContent;
    return (
      <>
        <PageHeader
          eyebrow="Contact & Location"
          title={content.pageHeading || "We're close by, and easy to reach."}
          lead={content.introduction || "Call, message or walk in. A real person answers — no phone trees."}
        />
        <ContactPageClient content={content} settings={settings} />
      </>
    );
  }

  if (pageKey === "footer") {
    return (
      <section className="bg-background py-16">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            Footer content previews directly in the footer below — scroll down to see it.
          </p>
        </div>
      </section>
    );
  }

  // seo
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-2xl px-5 sm:px-6">
        <div className="surface-card p-6">
          <h2 className="text-sm font-semibold text-navy-deep">SEO metadata (draft)</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-secondary p-4 text-xs text-navy-deep">{JSON.stringify(draft, null, 2)}</pre>
          <p className="mt-3 text-xs text-muted-foreground">
            SEO fields aren&apos;t visually rendered on the page — they affect page titles, meta descriptions and search engine behavior. Publish to apply them.
          </p>
        </div>
      </div>
    </section>
  );
}
