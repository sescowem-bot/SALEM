"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { SeoContent } from "@/lib/data/websiteContentTypes";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-sm font-semibold text-navy-deep">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function TitleDescPair({
  titleLabel,
  descLabel,
  titleValue,
  descValue,
  onTitle,
  onDesc,
}: {
  titleLabel: string;
  descLabel: string;
  titleValue: string;
  descValue: string;
  onTitle: (v: string) => void;
  onDesc: (v: string) => void;
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
        <input value={descValue} maxLength={160} onChange={(e) => onDesc(e.target.value)} className={fieldClass} />
        <span className="mt-1 block text-xs text-muted-foreground">{descValue.length}/160</span>
      </label>
    </div>
  );
}

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60">
      {pending ? "Saving…" : "Save draft"}
    </button>
  );
}

const initial: ActionState = {};

export function SeoEditorForm({ content }: { content: SeoContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<SeoContent>(content);

  function set<K extends keyof SeoContent>(key: K, value: SeoContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pageKey" value="seo" />
      <input type="hidden" name="content" value={JSON.stringify(form)} />

      <Section title="Global defaults" description="Used site-wide as a fallback wherever a page doesn't set its own title/description.">
        <TitleDescPair
          titleLabel="Default site title"
          descLabel="Default meta description"
          titleValue={form.defaultTitle ?? ""}
          descValue={form.defaultDescription ?? ""}
          onTitle={(v) => set("defaultTitle", v)}
          onDesc={(v) => set("defaultDescription", v)}
        />
        <label className="block text-sm font-medium text-navy-deep">
          Organization description
          <textarea rows={2} value={form.orgDescription ?? ""} onChange={(e) => set("orgDescription", e.target.value)} className={fieldClass + " resize-y"} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep">
          <input
            type="checkbox"
            checked={form.robotsIndex !== false}
            onChange={(e) => set("robotsIndex", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Allow search engines to index the site
        </label>
      </Section>

      <Section title="Homepage">
        <TitleDescPair
          titleLabel="Title"
          descLabel="Description"
          titleValue={form.homepageTitle ?? ""}
          descValue={form.homepageDescription ?? ""}
          onTitle={(v) => set("homepageTitle", v)}
          onDesc={(v) => set("homepageDescription", v)}
        />
      </Section>

      <Section title="About page">
        <TitleDescPair
          titleLabel="Title"
          descLabel="Description"
          titleValue={form.aboutTitle ?? ""}
          descValue={form.aboutDescription ?? ""}
          onTitle={(v) => set("aboutTitle", v)}
          onDesc={(v) => set("aboutDescription", v)}
        />
      </Section>

      <Section title="Services directory" description="This is the /services listing page only — each individual service keeps its own SEO fields from the Services CMS.">
        <TitleDescPair
          titleLabel="Title"
          descLabel="Description"
          titleValue={form.servicesTitle ?? ""}
          descValue={form.servicesDescription ?? ""}
          onTitle={(v) => set("servicesTitle", v)}
          onDesc={(v) => set("servicesDescription", v)}
        />
      </Section>

      <Section title="Contact page">
        <TitleDescPair
          titleLabel="Title"
          descLabel="Description"
          titleValue={form.contactTitle ?? ""}
          descValue={form.contactDescription ?? ""}
          onTitle={(v) => set("contactTitle", v)}
          onDesc={(v) => set("contactDescription", v)}
        />
      </Section>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-3">
        <SaveBar />
        <span className="text-xs text-muted-foreground">Saving updates the draft only — use Publish above to go live.</span>
      </div>
    </form>
  );
}
