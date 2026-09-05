"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, CheckCircle2, AlertTriangle, Globe2, FileText, ShieldCheck, Search, Copy } from "lucide-react";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { SeoContent } from "@/lib/data/websiteContentTypes";

const SITE_ORIGIN = "https://www.salemmedicals.com";
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const RECOMMENDED: SeoContent = {
  defaultTitle: "Salem Medical Laboratories | Pathology & Diagnostics",
  defaultDescription: "Salem Medical Laboratories provides accurate medical laboratory testing, diagnostics and home sample collection in Nigeria.",
  orgDescription: "Salem Medical Laboratories provides diagnostic laboratory testing with a focus on accurate results, quality assurance and patient care.",
  homepageTitle: "Salem Medical Laboratories | Accurate Diagnostics, Better Health",
  homepageDescription: "Medical diagnostic laboratory offering accurate, timely testing with compassionate care.",
  aboutTitle: "About Salem Medical Laboratories",
  aboutDescription: "Learn about Salem Medical Laboratories, our diagnostic services, quality approach and commitment to patient care.",
  servicesTitle: "Laboratory Services | Salem Medical Laboratories",
  servicesDescription: "Explore Salem Medical Laboratories' diagnostic laboratory services and investigations.",
  contactTitle: "Contact Salem Medical Laboratories",
  contactDescription: "Reach Salem Medical Laboratories for laboratory enquiries, bookings, location and result support.",
  robotsIndex: true,
  googleAnalyticsId: "",
  seoKeywords: "medical laboratory Lagos, diagnostic laboratory Lagos, blood tests Lagos, genotype test Lagos",
  organizationAreaServed: "Lagos, Ogun, Nigeria",
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <h2 className="text-base font-semibold text-navy-deep">{title}</h2>
      {description ? <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function TitleDescPair({ titleLabel, descLabel, titleValue, descValue, onTitle, onDesc }: {
  titleLabel: string; descLabel: string; titleValue: string; descValue: string;
  onTitle: (v: string) => void; onDesc: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-navy-deep">
        {titleLabel}
        <input value={titleValue} maxLength={70} onChange={(e) => onTitle(e.target.value)} className={fieldClass} />
        <span className="mt-1 block text-xs text-muted-foreground">{titleValue.length}/70</span>
      </label>
      <label className="block text-sm font-medium text-navy-deep">
        {descLabel}
        <textarea rows={2} value={descValue} maxLength={160} onChange={(e) => onDesc(e.target.value)} className={fieldClass + " resize-y"} />
        <span className="mt-1 block text-xs text-muted-foreground">{descValue.length}/160</span>
      </label>
    </div>
  );
}

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60">
      {pending ? "Saving…" : "Save SEO draft"}
    </button>
  );
}

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
    <span>{children}</span>
  </div>;
}

const initial: ActionState = {};

export function SeoEditorForm({ content }: { content: SeoContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<SeoContent>({ ...RECOMMENDED, ...content });
  const checks = useMemo(() => [
    ["Indexing enabled", form.robotsIndex !== false],
    ["Homepage title", Boolean(form.homepageTitle?.trim())],
    ["Homepage description", Boolean(form.homepageDescription?.trim())],
    ["Site title", Boolean(form.defaultTitle?.trim())],
    ["Site description", Boolean(form.defaultDescription?.trim())],
    ["Google verification", Boolean(form.googleSiteVerification?.trim())],
  ] as const, [form]);
  const completed = checks.filter(([, ok]) => ok).length;

  function set<K extends keyof SeoContent>(key: K, value: SeoContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard permissions may be unavailable */ }
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pageKey" value="seo" />
      <input type="hidden" name="content" value={JSON.stringify(form)} />

      <section className="overflow-hidden rounded-2xl border border-cyan/20 bg-gradient-to-br from-navy to-navy-deep p-6 text-white shadow-soft sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">SEO control centre</p>
            <h2 className="mt-2 text-2xl font-semibold">Make Salem discoverable on Google.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">This controls the public metadata and indexing signals. It does not require a paid “Google submission” service.</p>
          </div>
          <div className="min-w-[180px] rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between text-xs text-white/70"><span>SEO setup</span><strong className="text-white">{completed}/{checks.length}</strong></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan" style={{ width: `${(completed / checks.length) * 100}%` }} /></div>
          </div>
        </div>
      </section>

      <Section title="Google indexing & technical health" description="These are the signals that determine whether Google is allowed to crawl and understand the public site. The actual index decision is made by Google, not by the CMS.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Status ok={form.robotsIndex !== false}>Search indexing is {form.robotsIndex === false ? "disabled" : "enabled"}.</Status>
          <Status ok>XML sitemap is generated automatically at /sitemap.xml.</Status>
          <Status ok>robots.txt is generated automatically and points Google to the sitemap.</Status>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-secondary p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-deep"><Globe2 className="h-4 w-4" /> Canonical website</div>
            <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-card px-3 py-2 text-xs text-navy">{SITE_ORIGIN}</code><button type="button" onClick={() => copy(SITE_ORIGIN)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-navy" aria-label="Copy canonical website"><Copy className="h-4 w-4" /></button></div>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-deep"><FileText className="h-4 w-4" /> Sitemap</div>
            <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-card px-3 py-2 text-xs text-navy">{SITE_ORIGIN}/sitemap.xml</code><a href={`${SITE_ORIGIN}/sitemap.xml`} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-navy" aria-label="Open sitemap"><ExternalLink className="h-4 w-4" /></a></div>
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan/30 bg-cyan/5 p-4 text-sm font-medium text-navy-deep">
          <input type="checkbox" checked={form.robotsIndex !== false} onChange={(e) => set("robotsIndex", e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border" />
          <span><strong>Allow Google and other search engines to index the public website</strong><span className="mt-1 block text-xs font-normal text-muted-foreground">Keep this ON for Salem. Turning it off adds a noindex directive to public pages.</span></span>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Google Search Console verification code <span className="font-normal text-muted-foreground">(optional)</span>
          <input value={form.googleSiteVerification ?? ""} onChange={(e) => set("googleSiteVerification", e.target.value)} placeholder="Paste the content value from Google's HTML tag verification" className={fieldClass} />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">Do not paste the full &lt;meta&gt; tag — only its content value.</span>
        </label>
      </Section>

      <Section title="Google Search Console — required setup outside the website" description="The website can publish the correct crawl signals, but only the site owner can verify the domain and submit the sitemap in Google Search Console.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary p-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-navy"><span className="text-xs font-bold">1</span></span><h3 className="mt-3 text-sm font-semibold text-navy-deep">Verify the domain</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use a Domain property for salemmedicals.com in Google Search Console.</p></div>
          <div className="rounded-xl border border-border bg-secondary p-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-navy"><span className="text-xs font-bold">2</span></span><h3 className="mt-3 text-sm font-semibold text-navy-deep">Submit the sitemap</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Submit <code>/sitemap.xml</code> under the Sitemaps report.</p></div>
          <div className="rounded-xl border border-border bg-secondary p-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-navy"><span className="text-xs font-bold">3</span></span><h3 className="mt-3 text-sm font-semibold text-navy-deep">Request homepage indexing</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Inspect the homepage and use Request indexing. Repeat for key service pages after publication.</p></div>
        </div>
        <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"><Search className="h-4 w-4" /> Open Google Search Console <ExternalLink className="h-4 w-4" /></a>
        <p className="text-xs leading-relaxed text-muted-foreground">Google says appearing in Search is free. A sitemap helps Google discover URLs, but submitting one does not guarantee indexing or ranking. citeturn0search6turn0search3</p>
      </Section>

      <Section title="Global search appearance" description="Used as the fallback when a public page does not have its own SEO title or description.">
        <TitleDescPair titleLabel="Default site title" descLabel="Default meta description" titleValue={form.defaultTitle ?? ""} descValue={form.defaultDescription ?? ""} onTitle={(v) => set("defaultTitle", v)} onDesc={(v) => set("defaultDescription", v)} />
        <label className="block text-sm font-medium text-navy-deep">Organization description<textarea rows={3} value={form.orgDescription ?? ""} maxLength={500} onChange={(e) => set("orgDescription", e.target.value)} className={fieldClass + " resize-y"} /><span className="mt-1 block text-xs text-muted-foreground">{(form.orgDescription ?? "").length}/500</span></label>
      </Section>

      <Section title="Page-by-page SEO" description="These values control the title and description Google can use for each main public page. Individual investigation/service SEO remains managed from the Services CMS.">
        <TitleDescPair titleLabel="Homepage title" descLabel="Homepage description" titleValue={form.homepageTitle ?? ""} descValue={form.homepageDescription ?? ""} onTitle={(v) => set("homepageTitle", v)} onDesc={(v) => set("homepageDescription", v)} />
        <TitleDescPair titleLabel="About title" descLabel="About description" titleValue={form.aboutTitle ?? ""} descValue={form.aboutDescription ?? ""} onTitle={(v) => set("aboutTitle", v)} onDesc={(v) => set("aboutDescription", v)} />
        <TitleDescPair titleLabel="Services title" descLabel="Services description" titleValue={form.servicesTitle ?? ""} descValue={form.servicesDescription ?? ""} onTitle={(v) => set("servicesTitle", v)} onDesc={(v) => set("servicesDescription", v)} />
        <TitleDescPair titleLabel="Contact title" descLabel="Contact description" titleValue={form.contactTitle ?? ""} descValue={form.contactDescription ?? ""} onTitle={(v) => set("contactTitle", v)} onDesc={(v) => set("contactDescription", v)} />
      </Section>

      <Section title="Google snippet preview" description="A visual approximation only. Google may rewrite titles and descriptions based on the query and page content.">
        <div className="max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground">www.salemmedicals.com</p>
          <p className="mt-1 text-lg font-medium text-[#1a0dab]">{form.homepageTitle || RECOMMENDED.homepageTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{form.homepageDescription || RECOMMENDED.homepageDescription}</p>
        </div>
      </Section>

      <Section title="Analytics & local search signals" description="Google Analytics 4 measures website traffic. Search Console remains the source of truth for Google Search queries, impressions, clicks and average position.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy-deep">Google Analytics 4 Measurement ID <input value={form.googleAnalyticsId ?? ""} onChange={(e) => set("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" className={fieldClass} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Optional. Create a GA4 web data stream and paste only its Measurement ID.</span></label>
          <label className="block text-sm font-medium text-navy-deep">Service area <input value={form.organizationAreaServed ?? ""} onChange={(e) => set("organizationAreaServed", e.target.value)} placeholder="Lagos, Ogun, Nigeria" className={fieldClass} /></label>
        </div>
        <label className="block text-sm font-medium text-navy-deep">Search topic keywords <textarea rows={3} value={form.seoKeywords ?? ""} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="Comma-separated topics, not keyword stuffing" className={fieldClass + " resize-y"}/></label>
        <Status ok>Admin SEO Performance now tracks first-party page views and traffic sources. Google Search Console must still be used for ranking positions and search queries.</Status>
      </Section>

      <Section title="What should NOT be indexed" description="Private and transactional pages are intentionally excluded from search. Patient result access remains noindex, while public service and information pages remain indexable.">
        <div className="grid gap-3 sm:grid-cols-2">
          {["/admin/* — staff area", "/results — private patient result access", "/api/* — application endpoints", "/auth/* — authentication flows"].map((path) => <div key={path} className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-xs text-navy"><ShieldCheck className="h-4 w-4 text-emerald-600" />{path}</div>)}
        </div>
      </Section>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="surface-card p-4 text-sm text-emerald-700">SEO draft saved successfully. Publish the SEO page above for the changes to become live.</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SaveBar />
        <span className="text-xs text-muted-foreground">Save first, then use <strong>Publish draft</strong> above. Publishing is required before Google can see the new metadata.</span>
      </div>
    </form>
  );
}
