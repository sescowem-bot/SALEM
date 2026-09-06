import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { HomepageContent } from "@/lib/data/websiteContentTypes";

const fallbackAboutImage = "/images/svc-molecular.jpg";

export function AboutPreview({ content }: { content?: HomepageContent }) {
  const heading = content?.aboutPreviewHeading;
  const description = content?.aboutPreviewDescription;
  if (!heading && !description) return null;

  const ctaLabel = content?.aboutPreviewCtaLabel || "Learn more about us";
  const ctaHref = content?.aboutPreviewCtaHref || "/about";

  return (
    <section className="relative overflow-hidden bg-background py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="surface-card overflow-hidden p-7 sm:p-9 lg:p-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple">
            <ShieldCheck className="h-4 w-4" /> About Salem
          </div>
          {heading ? <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy-deep sm:text-3xl lg:text-4xl">{heading}</h2> : null}
          {description ? <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}
          <Link
            href={ctaHref}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-border shadow-lift sm:min-h-[24rem]">
          <Image
            src={fallbackAboutImage}
            alt="Medical laboratory testing environment at Salem Medical Laboratories"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/75 via-transparent to-transparent" aria-hidden="true" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-navy-deep/80 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Careful testing. Clear communication.</p>
            <p className="mt-1 text-xs leading-relaxed text-cyan-soft/80">A stronger visual introduction to the people and environment behind every result.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
