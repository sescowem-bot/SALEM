"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type TestCategory = Database["public"]["Tables"]["test_categories"]["Row"];
type Test = Database["public"]["Tables"]["tests"]["Row"];

const ALL = "All services";

export function ServicesPageClient({ categories, tests }: { categories: TestCategory[]; tests: Test[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const categoryName = categoryById.get(t.category_id)?.name ?? "";
      const matchesCategory = category === ALL || categoryName === category;
      const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [tests, categoryById, query, category]);

  return (
    <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="surface-card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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

          <div className="mt-6 flex flex-wrap gap-2">
            {[ALL, ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === c
                    ? "bg-navy text-primary-foreground"
                    : "border border-border text-muted-foreground hover:border-cyan hover:bg-accent hover:text-navy-deep"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <article key={t.id} className="surface-card flex flex-col p-6">
                <span className="w-fit rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-navy">
                  {categoryById.get(t.category_id)?.name ?? "Laboratory test"}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-navy-deep">{t.name}</h2>
                {t.public_description ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t.public_description}
                  </p>
                ) : (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    Speak with our team for details on this test.
                  </p>
                )}
                {t.preparation_info ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-navy">Preparation:</span> {t.preparation_info}
                  </p>
                ) : null}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  {t.show_price && t.price_ngn != null ? (
                    <span className="text-sm font-semibold text-navy-deep">
                      &#8358;{t.price_ngn.toLocaleString()}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/book?testId=${t.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple transition-colors hover:text-navy"
                  >
                    Book test <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </Link>
                </div>
              </article>
            ))}
            {filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No tests match that search. Try a different term or category.
              </p>
            ) : null}
          </div>
        </div>
      </section>
  );
}
