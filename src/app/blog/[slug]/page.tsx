import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { getPublishedArticleBySlug, listPublishedArticles } from "@/lib/data/seoArticles";
import { publicMetadata, canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found | Salem Medical Laboratories", robots: { index: false, follow: false } };
  return publicMetadata({ title: article.seo_title || article.title, description: article.seo_description || article.excerpt || "Health and laboratory information from Salem Medical Laboratories.", pathname: `/blog/${article.slug}`, image: article.featured_image_url || undefined });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const all = await listPublishedArticles();
  const related = all.filter((item) => item.id !== article.id).slice(0, 3);
  const paragraphs = article.content.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    url: canonical(`/blog/${article.slug}`),
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || undefined,
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    author: { "@type": "Organization", name: "Salem Medical Laboratories", url: canonical("/") },
    publisher: { "@type": "Organization", name: "Salem Medical Laboratories", url: canonical("/") },
  };

  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="relative overflow-hidden gradient-hero pb-12 pt-28 lg:pb-16 lg:pt-40">
        <div className="grid-lab pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-soft/80 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Health Journal</Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium text-cyan-soft/75"><span>Health & laboratory</span><span>•</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(article.published_at)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {readingTime(article.content)} min read</span></div>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">{article.title}</h1>
          {article.excerpt ? <p className="mt-5 max-w-3xl text-base leading-7 text-cyan-soft/80 sm:text-lg">{article.excerpt}</p> : null}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,780px)_300px] lg:items-start lg:justify-center">
          <article>
            {article.featured_image_url ? <div className="mb-8 aspect-[16/8] overflow-hidden rounded-[2rem] border border-border bg-secondary shadow-soft"><img src={article.featured_image_url} alt="" className="h-full w-full object-cover" /></div> : null}
            <div className="rounded-[2rem] border border-border bg-white p-7 shadow-soft sm:p-10">
              <div className="mb-8 flex items-start gap-3 rounded-2xl bg-accent/60 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple" /><p className="text-sm leading-6 text-navy-deep">This article is for general health education. It does not replace a diagnosis or advice from a qualified healthcare professional.</p></div>
              <div className="space-y-6 text-[1.05rem] leading-8 text-navy-deep">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              <div className="mt-10 border-t border-border pt-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Salem Medical Laboratories</p><p className="mt-2 text-sm leading-6 text-muted-foreground">For test availability, preparation guidance or booking support, contact our laboratory team.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/services" className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">Explore tests <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-navy-deep">Contact Salem</Link></div></div>
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="rounded-[1.5rem] border border-border bg-secondary/60 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Need a laboratory test?</p><h2 className="mt-3 text-xl font-semibold text-navy-deep">Find a service or book an appointment.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Use the Salem website to browse investigations and arrange your next visit.</p><Link href="/book" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white">Book an appointment <ArrowRight className="h-4 w-4" /></Link></div>
            {related.length ? <div className="rounded-[1.5rem] border border-border bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Keep reading</p><div className="mt-4 space-y-4">{related.map((item) => <Link key={item.id} href={`/blog/${item.slug}`} className="group block border-b border-border pb-4 last:border-0 last:pb-0"><p className="text-sm font-semibold leading-5 text-navy-deep group-hover:text-purple">{item.title}</p><span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">{readingTime(item.content)} min read <ArrowRight className="h-3 w-3" /></span></Link>)}</div></div> : null}
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
