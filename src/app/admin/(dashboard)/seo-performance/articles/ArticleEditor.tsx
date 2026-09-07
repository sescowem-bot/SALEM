"use client";

import { useState } from "react";
import { ImagePlus, Eye, ExternalLink, Save, Send } from "lucide-react";
import { saveArticleAction, publishArticleAction, uploadArticleFeaturedImageAction } from "./actions";

type Article = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  seo_title?: string | null;
  seo_description?: string | null;
  status: "draft" | "published" | "archived";
  featured_image_url?: string | null;
  published_at?: string | null;
  updated_at?: string;
};

const emptyArticle: Article = { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", status: "draft", featured_image_url: null };

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

export function ArticleEditor({ articles }: { articles: Article[] }) {
  const [selected, setSelected] = useState<Article | null>(null);
  const [imageMessage, setImageMessage] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const selectArticle = (article: Article) => {
    setSelected({ ...article });
    setImageMessage("");
    setImageError("");
  };

  const uploadImage = async (formData: FormData) => {
    setUploading(true);
    setImageMessage("");
    setImageError("");
    try {
      const result = await uploadArticleFeaturedImageAction(formData);
      if (result.ok && result.imageUrl) {
        setSelected((current) => current ? { ...current, featured_image_url: result.imageUrl } : current);
        setImageMessage("Featured image uploaded successfully.");
      } else {
        setImageError(result.error || "Could not upload featured image.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-secondary/50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">Editorial workspace</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy-deep">Health information library</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Create helpful, clinically responsible articles that answer real patient questions and strengthen Salem service pages in search.</p>
            </div>
            <button type="button" onClick={() => selectArticle({ ...emptyArticle })} className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:opacity-95"><Save className="h-4 w-4" /> New article</button>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <button key={article.id} type="button" onClick={() => selectArticle(article)} className={`group rounded-2xl border p-4 text-left transition ${selected?.id === article.id ? "border-cyan bg-accent shadow-soft" : "border-border bg-background hover:border-cyan/60 hover:bg-accent/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${article.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{article.status}</span>
                <span className="text-xs text-muted-foreground">{readingTime(article.content)} min read</span>
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-navy-deep">{article.title || "Untitled article"}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{article.excerpt || "No excerpt yet."}</p>
            </button>
          ))}
        </div>
        {!articles.length ? <div className="px-5 pb-6 text-sm text-muted-foreground">No articles yet. Start with a patient-focused topic.</div> : null}
      </section>

      {selected ? (
        <form action={saveArticleAction} className="surface-card overflow-hidden">
          <input type="hidden" name="id" value={selected.id || ""} />
          <input type="hidden" name="status" value={selected.status || "draft"} />
          <input type="hidden" name="featured_image_url" value={selected.featured_image_url || ""} />
          <div className="border-b border-border bg-navy-deep p-6 text-white sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Article editor</p><h2 className="mt-2 text-2xl font-semibold">{selected.id ? "Edit article" : "Create a new article"}</h2><p className="mt-2 text-sm text-cyan-soft/75">Write for patients first. Keep claims accurate, useful and easy to understand.</p></div>
              {selected.id ? <a href={`/blog/${selected.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"><Eye className="h-4 w-4" /> Preview article <ExternalLink className="h-3.5 w-3.5" /></a> : null}
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div><label className="text-sm font-semibold text-navy-deep">Article title</label><input name="title" defaultValue={selected.title} required className="mt-2 w-full rounded-xl border border-input bg-background p-3.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" placeholder="e.g. How to Prepare for a Blood Test" /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label className="text-sm font-semibold text-navy-deep">URL slug</label><input name="slug" defaultValue={selected.slug} required className="mt-2 w-full rounded-xl border border-input bg-background p-3.5 text-sm" placeholder="how-to-prepare-for-a-blood-test" /></div><div><label className="text-sm font-semibold text-navy-deep">Reading time</label><div className="mt-2 rounded-xl border border-input bg-secondary p-3.5 text-sm text-muted-foreground">About {readingTime(selected.content)} minute{readingTime(selected.content) === 1 ? "" : "s"}</div></div></div>
              <div><label className="text-sm font-semibold text-navy-deep">Search-friendly excerpt</label><textarea name="excerpt" defaultValue={selected.excerpt || ""} className="mt-2 w-full rounded-xl border border-input bg-background p-3.5 text-sm" rows={3} placeholder="A short answer-focused summary shown on the blog and used as a fallback description." /></div>
              <div><label className="text-sm font-semibold text-navy-deep">Article content</label><p className="mt-1 text-xs text-muted-foreground">Use short paragraphs and clear patient language. Separate paragraphs with a blank line.</p><textarea name="content" defaultValue={selected.content} required className="mt-2 min-h-[420px] w-full rounded-xl border border-input bg-background p-4 text-sm leading-7" placeholder="Start with the patient's question, explain the test clearly, then cover preparation, what happens next and when to speak with a healthcare professional." /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label className="text-sm font-semibold text-navy-deep">SEO title</label><input name="seo_title" defaultValue={selected.seo_title || ""} maxLength={70} className="mt-2 w-full rounded-xl border border-input bg-background p-3.5 text-sm" placeholder="Up to 70 characters" /></div><div><label className="text-sm font-semibold text-navy-deep">Meta description</label><textarea name="seo_description" defaultValue={selected.seo_description || ""} maxLength={160} className="mt-2 w-full rounded-xl border border-input bg-background p-3.5 text-sm" rows={2} placeholder="Up to 160 characters" /></div></div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <p className="text-sm font-semibold text-navy-deep">Featured image</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Use a clean, relevant laboratory/health image. JPEG, PNG or WebP, up to 5MB.</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background aspect-[16/10]">
                  {selected.featured_image_url ? <img src={selected.featured_image_url} alt="Featured article preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-6 text-center text-xs text-muted-foreground"><ImagePlus className="mb-2 h-8 w-8" />No featured image yet</div>}
                </div>
                {selected.id ? <div className="mt-4"><input id="article-image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-navy" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const data = new FormData(); data.append("id", selected.id || ""); data.append("file", file); void uploadImage(data); }} />{uploading ? <p className="mt-2 text-xs font-medium text-navy">Uploading image…</p> : null}{imageMessage ? <p className="mt-2 text-xs font-medium text-emerald-700">{imageMessage}</p> : null}{imageError ? <p className="mt-2 text-xs font-medium text-destructive">{imageError}</p> : null}</div> : <p className="mt-3 text-xs text-muted-foreground">Save the article first to enable featured image upload.</p>}
              </div>
              <div className="rounded-2xl border border-border p-5"><p className="text-sm font-semibold text-navy-deep">Publishing checklist</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>✓ Clear patient-focused title</li><li>✓ Accurate medical information</li><li>✓ Unique excerpt and SEO description</li><li>✓ Relevant featured image</li><li>✓ Internal link opportunity to a Salem service</li></ul></div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col"><button className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save article</button>{selected.id && selected.status !== "published" ? <button type="submit" formAction={publishArticleAction} name="id" value={selected.id} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-navy-deep hover:bg-accent"><Send className="h-4 w-4" /> Publish article</button> : null}</div>
            </aside>
          </div>
        </form>
      ) : (
        <div className="surface-card p-10 text-center"><p className="text-sm text-muted-foreground">Select an article above or create a new one to open the editorial workspace.</p></div>
      )}
    </div>
  );
}
