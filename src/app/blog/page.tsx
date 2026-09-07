import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, ShieldCheck } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { listPublishedArticles } from "@/lib/data/seoArticles";
import { publicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = publicMetadata({
  title: "Health Blog & Laboratory Guides | Salem Medical Laboratories",
  description: "Practical laboratory and health guides from Salem Medical Laboratories covering blood tests, preparation, screening, home sample collection and patient questions.",
  pathname: "/blog",
});

const fallbackImages = ["/images/results.jpg", "/images/svc-blood.jpg", "/images/svc-molecular.jpg", "/images/svc-micro.jpg", "/images/home-collection.jpg"];

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

function formatDate(value: string | null) {
  if (!value) return "Salem Medical Laboratories";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function BlogPage() {
  const articles = await listPublishedArticles();
  const featured = articles[0];
  const latest = articles.slice(1);

  return (
    <SiteLayout>
      <PageHeader eyebrow="Salem Health Journal" title="Trusted laboratory information, explained clearly." lead="Practical guides for patients and families — from preparing for a test to understanding common laboratory investigations and home sample collection.">
        <div className="flex flex-wrap gap-3">
          <Link href="/services" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy-deep shadow-soft hover:bg-cyan-soft">Explore laboratory services <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/book" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Book a test</Link>
        </div>
      </PageHeader>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-6 sm:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4"><BookOpen className="h-5 w-5 text-purple" /><div><p className="text-sm font-semibold text-navy-deep">Patient-first guides</p><p className="text-xs text-muted-foreground">Clear, useful explanations</p></div></div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4"><ShieldCheck className="h-5 w-5 text-cyan" /><div><p className="text-sm font-semibold text-navy-deep">Responsible information</p><p className="text-xs text-muted-foreground">Education, not diagnosis</p></div></div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4"><Clock3 className="h-5 w-5 text-periwinkle" /><div><p className="text-sm font-semibold text-navy-deep">Easy to read</p><p className="text-xs text-muted-foreground">Short, practical articles</p></div></div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        {featured ? (
          <section>
            <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Featured guide</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy-deep sm:text-3xl">Start with a useful answer</h2></div><span className="hidden text-sm text-muted-foreground sm:block">{articles.length} published guide{articles.length === 1 ? "" : "s"}</span></div>
            <Link href={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative min-h-[280px] overflow-hidden bg-secondary lg:min-h-[390px]">
                <img src={featured.featured_image_url || fallbackImages[0]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy-deep">{readingTime(featured.content)} min read</span>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground"><span>Health & laboratory</span><span>•</span><span>{formatDate(featured.published_at)}</span></div>
                <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-navy-deep sm:text-4xl">{featured.title}</h3>
                {featured.excerpt ? <p className="mt-5 text-base leading-7 text-muted-foreground">{featured.excerpt}</p> : null}
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-purple">Read the guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          </section>
        ) : null}

        {latest.length ? (
          <section className="mt-16">
            <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Latest articles</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy-deep sm:text-3xl">More answers from Salem</h2></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((article, index) => (
                <article key={article.id} className="group overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                  <Link href={`/blog/${article.slug}`}>
                    <div className="aspect-[16/10] overflow-hidden bg-secondary"><img src={article.featured_image_url || fallbackImages[(index + 1) % fallbackImages.length]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" /></div>
                    <div className="p-6"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{formatDate(article.published_at)}</span><span>{readingTime(article.content)} min read</span></div><h3 className="mt-3 line-clamp-2 text-xl font-semibold leading-7 text-navy-deep">{article.title}</h3>{article.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p> : null}<span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-purple">Read article <ArrowRight className="h-4 w-4" /></span></div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!articles.length ? <div className="rounded-[2rem] border border-dashed border-border bg-secondary/40 px-6 py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-periwinkle" /><h2 className="mt-4 text-xl font-semibold text-navy-deep">New health guides are coming soon</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Our team is preparing practical information about laboratory testing, preparation and patient care.</p><Link href="/services" className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">Explore services</Link></div> : null}

        <section className="mt-16 overflow-hidden rounded-[2rem] gradient-hero p-7 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Need a test?</p><h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Get the right information before you book.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-soft/80">Browse our investigations, ask a question or arrange an appointment with Salem Medical Laboratories.</p></div><div className="flex flex-wrap gap-3"><Link href="/services" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy-deep">View services</Link><Link href="/contact" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Contact us</Link></div></div>
        </section>
      </main>
    </SiteLayout>
  );
}
