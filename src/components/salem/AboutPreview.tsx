import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomepageContent } from "@/lib/data/websiteContentTypes";

export function AboutPreview({ content }: { content?: HomepageContent }) {
  const heading = content?.aboutPreviewHeading;
  const description = content?.aboutPreviewDescription;
  if (!heading && !description) return null;

  const ctaLabel = content?.aboutPreviewCtaLabel || "Learn more about us";
  const ctaHref = content?.aboutPreviewCtaHref || "/about";

  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="surface-card flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="min-w-0">
            {heading ? <h2 className="text-2xl font-semibold text-navy-deep sm:text-3xl">{heading}</h2> : null}
            {description ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
          </div>
          <Link
            href={ctaHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}
