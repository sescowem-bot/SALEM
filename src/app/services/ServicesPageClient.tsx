"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";

const categories = [
  "All services",
  "Haematology",
  "Clinical Chemistry",
  "Microbiology",
  "Immunology",
  "Serology",
  "Molecular",
  "Histopathology",
];

const services = [
  {
    name: "Full Blood Count (FBC)",
    category: "Haematology",
    body: "Complete cell profile with differential, indices and film comment.",
  },
  {
    name: "Coagulation Profile",
    category: "Haematology",
    body: "PT, INR and APTT for bleeding risk and anticoagulant monitoring.",
  },
  {
    name: "Liver Function Test",
    category: "Clinical Chemistry",
    body: "ALT, AST, ALP, bilirubin and protein markers on automated analysers.",
  },
  {
    name: "Kidney Function & Electrolytes",
    category: "Clinical Chemistry",
    body: "Urea, creatinine, eGFR and full electrolyte panel.",
  },
  {
    name: "Lipid Profile & HbA1c",
    category: "Clinical Chemistry",
    body: "Cardiometabolic risk markers with three-month glycaemic control.",
  },
  {
    name: "Culture & Sensitivity",
    category: "Microbiology",
    body: "Urine, wound, sputum and swab cultures with antibiotic sensitivity.",
  },
  {
    name: "Malaria & Typhoid Screening",
    category: "Microbiology",
    body: "Rapid antigen testing confirmed with microscopy by our scientists.",
  },
  {
    name: "Thyroid & Hormone Assays",
    category: "Immunology",
    body: "TSH, T3, T4, fertility and reproductive hormone panels.",
  },
  {
    name: "Allergy & Autoimmune Panel",
    category: "Immunology",
    body: "IgE screening, ANA and rheumatoid markers with clinical commentary.",
  },
  {
    name: "Hepatitis & Retroviral Screening",
    category: "Serology",
    body: "Confidential HBsAg, HCV and HIV screening with counselling support.",
  },
  {
    name: "PCR Diagnostics",
    category: "Molecular",
    body: "Nucleic acid amplification testing under strict chain-of-custody.",
  },
  {
    name: "Histopathology & Cytology",
    category: "Histopathology",
    body: "Tissue and smear analysis reviewed by consultant pathologists.",
  },
];

export function ServicesPageClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All services");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory = category === "All services" || s.category === category;
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

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
                placeholder="Search a test, e.g. Full Blood Count"
                className="min-w-0 flex-1 bg-transparent text-sm text-navy-deep outline-none placeholder:text-muted-foreground"
              />
            </label>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-navy-deep">{filtered.length}</span> test
              {filtered.length === 1 ? "" : "s"} shown
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
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
            {filtered.map((s) => (
              <article key={s.name} className="surface-card flex flex-col p-6">
                <span className="w-fit rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-navy">
                  {s.category}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-navy-deep">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
                  <Link
                    href="/book"
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
