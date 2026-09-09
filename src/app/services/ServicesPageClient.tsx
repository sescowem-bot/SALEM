"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight, Star, ShieldCheck, Clock, FlaskConical } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import type { ServiceWithCategory } from "@/lib/data/testCatalog";

type TestCategory = Database["public"]["Tables"]["test_categories"]["Row"];
type ServiceWithImage = ServiceWithCategory & { heroImageUrl: string | null };

const ALL = "All services";

function ServiceCard({ service }: { service: ServiceWithImage }) {
  return (
    <article className="surface-card flex flex-col overflow-hidden p-0">
      <div className="aspect-[16/9] w-full bg-secondary">
        {service.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage-hosted marketing image
          <img src={service.heroImageUrl} alt={service.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <FlaskConical className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="flex items-center gap-2">
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-navy">
            {service.category?.name ?? "Laboratory test"}
          </span>
          {service.featured ? (
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-amber-600">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          ) : null}
        </span>
        <Link href={`/services/${service.slug}`} className="mt-4 text-lg font-semibold text-navy-deep hover:text-navy">
          {service.name}
        </Link>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {service.public_description ?? "Speak with our team for details on this test."}
        </p>
        {service.turnaround_time ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" /> {service.turnaround_time}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          {service.show_price && service.price_ngn != null ? (
            <span className="text-sm font-semibold text-navy-deep">&#8358;{service.price_ngn.toLocaleString()}</span>
          ) : (
            <span />
          )}
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple transition-colors hover:text-navy"
          >
            View details <ArrowUpRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ServicesPageClient({ categories, services }: { categories: TestCategory[]; services: ServiceWithImage[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const categoryName = s.category?.name ?? "";
      const matchesCategory = category === ALL || categoryName === category;
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [services, query, category]);

  const featured = useMemo(() => services.filter((s) => s.featured), [services]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero pb-16 pt-28 lg:pb-20 lg:pt-40">
        <div className="grid-lab pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-cyan/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-soft/80">Laboratory Services</span>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            A diagnostic menu, run under one quality system.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cyan-soft/80">
            Every sample is barcoded on arrival, processed under documented quality control and reviewed by a
            scientist before release.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-cyan-soft/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" /> Scientist-reviewed results
            </span>
            <span className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 shrink-0 text-cyan" /> {services.length} services available
            </span>
          </div>

          <div className="surface-card mt-8 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="flex min-w-0 items-center gap-3 rounded-full border border-border bg-secondary px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Search tests</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a test, e.g. Fasting Blood Sugar"
                className="min-w-0 flex-1 bg-transparent text-sm text-navy-deep outline-none placeholder:text-muted-foreground"
              />
            </label>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-navy-deep">{filtered.length}</span> test
              {filtered.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && query === "" && category === ALL ? (
        <section className="bg-background py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">Popular with patients</span>
            <h2 className="mt-2 text-2xl font-semibold text-navy-deep sm:text-3xl">Featured services</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Directory */}
      <section className="bg-secondary/40 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">Full catalogue</span>
          <h2 className="mt-2 text-2xl font-semibold text-navy-deep sm:text-3xl">Browse every service</h2>

          <div className="mt-6 flex flex-wrap gap-2">
            {[ALL, ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === c
                    ? "bg-navy text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-cyan hover:bg-accent hover:text-navy-deep"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
            {filtered.length === 0 && services.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Our test catalogue isn&apos;t available online right now. Please call or WhatsApp us and our team
                will help you directly.
              </p>
            ) : filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No tests match that search. Try a different term or category.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Trust / CTA */}
      <section className="bg-background py-14 lg:py-20">
        <div className="surface-card mx-auto flex max-w-7xl flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-xl font-semibold text-navy-deep sm:text-2xl">Not sure which test you need?</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Our front desk team can help you choose the right test and answer questions before you book.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            Talk to our team <ArrowUpRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </section>
    </>
  );
}
