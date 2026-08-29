import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";

export const metadata: Metadata = publicMetadata({ title: "Health Packages | Salem Medical Laboratories", description: "Explore health screening packages from Salem Medical Laboratories.", pathname: "/packages", noIndex: false });

const packages = [
  {
    name: "Basic Health Screening",
    body: "A dependable annual baseline for healthy adults.",
    featured: false,
    tests: ["Full blood count", "Blood sugar (FBS)", "Urinalysis", "Blood pressure & BMI review"],
  },
  {
    name: "Executive Health Screening",
    body: "Our most complete profile for leaders and frequent travellers.",
    featured: true,
    tests: [
      "Full blood count & ESR",
      "Liver, kidney and lipid panels",
      "HbA1c & thyroid profile",
      "PSA / cervical screening",
    ],
  },
  {
    name: "Women's Health",
    body: "Hormonal, reproductive and wellness markers for women.",
    featured: false,
    tests: ["Hormonal profile", "Pap smear / cytology", "Iron studies", "Thyroid function"],
  },
  {
    name: "Men's Health",
    body: "Cardiometabolic and prostate-focused screening for men.",
    featured: false,
    tests: ["PSA", "Lipid profile", "Testosterone", "Liver & kidney function"],
  },
  {
    name: "Corporate Screening",
    body: "On-site collection and consolidated reporting for teams.",
    featured: false,
    tests: [
      "Pre-employment panel",
      "On-site sample collection",
      "Group HR reporting",
      "Annual review",
    ],
  },
  {
    name: "Preventive Health Package",
    body: "Early-detection markers for families with risk history.",
    featured: false,
    tests: ["Cancer marker screen", "Diabetes risk panel", "Cardiac markers", "Vitamin D & B12"],
  },
];

export default function PackagesPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Health Packages"
        title="Screening packages built around real lives, not long lists."
        lead="Each package bundles the tests that matter, with a clear written summary you can take to your doctor."
      />

      <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <article
                key={p.name}
                className={`surface-card flex flex-col p-7 ${
                  p.featured ? "border-cyan/50 shadow-glow" : ""
                }`}
              >
                {p.featured ? (
                  <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" /> Most comprehensive
                  </span>
                ) : null}
                <h2 className="text-xl font-semibold text-navy-deep">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <ul className="mt-6 space-y-3 border-t border-border pt-6">
                  {p.tests.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm text-navy">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-muted-foreground">
                  Pricing confirmed when you enquire or book.
                </p>
                <Link
                  href="/book"
                  className={`mt-4 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    p.featured
                      ? "bg-navy text-primary-foreground shadow-soft"
                      : "border border-border text-navy hover:border-cyan hover:bg-accent"
                  }`}
                >
                  Enquire about this package
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
