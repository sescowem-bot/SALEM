import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Phone, AlertTriangle, Info } from "lucide-react";
import type { ServiceWithCategory } from "@/lib/data/testCatalog";
import type { Database } from "@/lib/supabase/database.types";

type Test = Database["public"]["Tables"]["tests"]["Row"];

function splitLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function ServiceDetailView({
  service,
  heroImageUrl,
  related,
  isPreview = false,
}: {
  service: ServiceWithCategory;
  heroImageUrl: string | null;
  related: Test[];
  isPreview?: boolean;
}) {
  const ctaLabel = service.cta_label || "Book this test";
  const ctaHref = service.cta_destination || `/book?testId=${service.id}`;
  const preparationItems = splitLines(service.preparation_info);
  const requirementItems = splitLines(service.requirements);
  const avoidItems = splitLines(service.what_to_avoid);

  return (
    <div className="bg-background">
      {isPreview ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-amber-700">
          Preview — this is how the published page will look. Not visible to the public yet.
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero pb-14 pt-28 lg:pb-16 lg:pt-36">
        <div className="grid-lab pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-cyan-soft/80">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-white">
              Services
            </Link>
            <span>/</span>
            <span className="text-white">{service.name}</span>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-soft/80">
                {service.category?.name ?? "Laboratory service"}
              </span>
              <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                {service.name}
              </h1>
              {service.public_description ? (
                <p className="mt-5 max-w-xl text-base leading-relaxed text-cyan-soft/80">{service.public_description}</p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-deep shadow-soft transition-transform hover:scale-[1.02]"
                >
                  {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
                {service.show_price && service.price_ngn != null ? (
                  <span className="text-sm font-semibold text-white">&#8358;{service.price_ngn.toLocaleString()}</span>
                ) : null}
              </div>
            </div>

            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage-hosted marketing image
              <img
                src={heroImageUrl}
                alt={service.name}
                className="aspect-[4/3] w-full rounded-2xl border border-white/10 object-cover shadow-soft"
              />
            ) : (
              <div className="aspect-[4/3] w-full rounded-2xl border border-white/10 bg-white/5" />
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="min-w-0 space-y-8">
            {service.full_description ? (
              <div>
                <h2 className="text-xl font-semibold text-navy-deep">About this test</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {service.full_description}
                </p>
              </div>
            ) : null}

            {preparationItems.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-navy-deep">Preparation</h2>
                <ul className="mt-3 space-y-2">
                  {preparationItems.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {requirementItems.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-navy-deep">What you&apos;ll need</h2>
                <ul className="mt-3 space-y-2">
                  {requirementItems.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {avoidItems.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-navy-deep">What to do / avoid</h2>
                <ul className="mt-3 space-y-2">
                  {avoidItems.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {service.important_notes ? (
              <div className="rounded-2xl border border-cyan/30 bg-accent/40 p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
                  <Info className="h-4 w-4 shrink-0 text-navy" /> Important notes
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{service.important_notes}</p>
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="surface-card p-6">
              <h3 className="text-sm font-semibold text-navy-deep">At a glance</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {service.turnaround_time ? (
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-navy" />
                    <div>
                      <dt className="text-xs text-muted-foreground">Turnaround time</dt>
                      <dd className="font-medium text-navy-deep">{service.turnaround_time}</dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-navy" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Quality</dt>
                    <dd className="font-medium text-navy-deep">Scientist-reviewed before release</dd>
                  </div>
                </div>
              </dl>
              <Link
                href={ctaHref}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>

            <div className="surface-card p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
                <Phone className="h-4 w-4 shrink-0" /> Have questions?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Speak with our team before booking — we&apos;re happy to help you choose the right test.
              </p>
              <Link href="/contact" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:text-navy">
                Contact us <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="mx-auto mt-14 max-w-7xl px-5 sm:px-6">
            <h2 className="text-xl font-semibold text-navy-deep">Related services</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/services/${r.slug}`} className="surface-card flex flex-col p-5 hover:border-cyan/45">
                  <h3 className="text-sm font-semibold text-navy-deep">{r.name}</h3>
                  {r.public_description ? (
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">{r.public_description}</p>
                  ) : null}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple">
                    View service <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
