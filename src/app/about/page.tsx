import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Target, Eye, HeartHandshake, ClipboardCheck, ShieldCheck } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import type { AboutContent, SeoContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSiteSeoImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [about, seo] = await Promise.all([
    getPublishedPageContent<AboutContent>("about"),
    getPublishedPageContent<SeoContent>("seo"),
  ]);
  const title = seo.aboutTitle || about.pageTitle || "About Salem Medical Laboratories";
  const description =
    seo.aboutDescription ||
    "Salem Medical Laboratories is a diagnostic laboratory built on scientific precision, documented quality assurance and human care.";
  return publicMetadata({ title, description, pathname: "/about", image: await getSiteSeoImage() });
}

export default async function AboutPage() {
  const about = await getPublishedPageContent<AboutContent>("about");

  const pillars = [
    { icon: Target, title: "Mission", body: about.mission || "To make accurate diagnostics accessible, explained in language every patient understands." },
    { icon: Eye, title: "Vision", body: about.vision || "To be a trusted independent laboratory known for precision and patient dignity." },
    { icon: HeartHandshake, title: "Values", body: about.values || "Integrity in every result, empathy at every desk, and discipline in every process." },
  ];

  const ctaLabel = about.ctaLabel || "Visit our facility";
  const ctaHref = about.ctaHref || "/contact";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="About Salem"
        title={about.pageTitle || "A laboratory built by scientists who take results personally."}
        lead={about.introduction || "Salem Medical Laboratories exists to close the gap between fast diagnostics and trustworthy diagnostics."}
      />

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
              Our approach
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
              Founded on one question: can this result be trusted?
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {about.whoWeAre || (
                <>
                  <p>
                    Every sample that enters our laboratory is tracked from collection to release. No
                    report leaves the building without a laboratory scientist&apos;s review.
                  </p>
                  <p>
                    We run automated haematology, chemistry, immunoassay and molecular platforms,
                    supported by a home collection service for patients who prefer to be tested at home.
                  </p>
                </>
              )}
            </div>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
            >
              {ctaLabel}
            </Link>
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Image
              src="/images/hero-lab.jpg"
              alt="Scientists working in the Salem Medical Laboratories analysis bay"
              loading="lazy"
              width={900}
              height={700}
              className="h-72 w-full rounded-3xl object-cover shadow-soft sm:h-full"
            />
            <Image
              src="/images/svc-micro.jpg"
              alt="Microbiology plate review under a microscope at Salem"
              loading="lazy"
              width={900}
              height={700}
              className="h-72 w-full rounded-3xl object-cover shadow-soft sm:mt-8 sm:h-full"
            />
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title: t, body }) => (
              <div key={t} className="surface-card p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-navy-deep">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-2">
          <div className="surface-card p-7 sm:p-9">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold text-navy-deep">Quality assurance</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {about.qualityStatement ||
                "Internal controls run before patient samples are processed, analysers are kept on a calibration schedule, and every released report carries the reviewing scientist's name."}
            </p>
          </div>
          <div className="surface-card p-7 sm:p-9">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold text-navy-deep">
              Certifications &amp; accreditation
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {about.professionalStandards ||
                "Licensing and accreditation details will be listed here once confirmed and supplied by the laboratory."}
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
