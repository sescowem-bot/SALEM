"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { AboutContent } from "@/lib/data/websiteContentTypes";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";
const textareaClass = fieldClass + " resize-y";

function Section({ number, title, description, children }: { number: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-navy">{number}</span>
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea, rows = 3 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium text-navy-deep">
      {label}
      {textarea ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={textareaClass} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} />
      )}
    </label>
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

export function AboutEditorForm({ content }: { content: AboutContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<AboutContent>(content);

  function set<K extends keyof AboutContent>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pageKey" value="about" />
      <input type="hidden" name="content" value={JSON.stringify(form)} />

      <Section number={1} title="Page header">
        <Field label="Page title" value={form.pageTitle ?? ""} onChange={(v) => set("pageTitle", v)} placeholder="A laboratory built by scientists who take results personally." />
        <Field label="Introduction" value={form.introduction ?? ""} onChange={(v) => set("introduction", v)} textarea rows={2} />
      </Section>

      <Section number={2} title="Who we are">
        <Field label="Who we are" value={form.whoWeAre ?? ""} onChange={(v) => set("whoWeAre", v)} textarea rows={6} />
      </Section>

      <Section number={3} title="Mission, vision, values">
        <Field label="Mission" value={form.mission ?? ""} onChange={(v) => set("mission", v)} textarea rows={2} />
        <Field label="Vision" value={form.vision ?? ""} onChange={(v) => set("vision", v)} textarea rows={2} />
        <Field label="Values" value={form.values ?? ""} onChange={(v) => set("values", v)} textarea rows={2} />
      </Section>

      <Section number={4} title="Quality & standards" description="Only include certification/accreditation text once it has actually been confirmed and supplied.">
        <Field label="Quality statement" value={form.qualityStatement ?? ""} onChange={(v) => set("qualityStatement", v)} textarea />
        <Field label="Professional standards / certifications" value={form.professionalStandards ?? ""} onChange={(v) => set("professionalStandards", v)} textarea placeholder="Leave blank until confirmed — do not invent." />
      </Section>

      <Section number={5} title="Call to action">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA label" value={form.ctaLabel ?? ""} onChange={(v) => set("ctaLabel", v)} placeholder="Visit our facility" />
          <Field label="CTA destination" value={form.ctaHref ?? ""} onChange={(v) => set("ctaHref", v)} placeholder="/contact" />
        </div>
      </Section>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-3">
        <SaveBar />
        <span className="text-xs text-muted-foreground">Saving updates the draft only — use Publish above to go live.</span>
      </div>
    </form>
  );
}
