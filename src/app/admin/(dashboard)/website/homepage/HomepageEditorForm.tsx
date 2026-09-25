"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteDraftAction, type ActionState } from "../actions";
import type { HomepageContent } from "@/lib/data/websiteContentTypes";

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

function Field({ label, value, onChange, placeholder, textarea, rows = 2 }: {
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
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save draft"}
    </button>
  );
}

const initial: ActionState = {};

export function HomepageEditorForm({ content }: { content: HomepageContent }) {
  const [state, formAction] = useActionState(saveWebsiteDraftAction, initial);
  const [form, setForm] = useState<HomepageContent>(content);

  function set<K extends keyof HomepageContent>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" value="homepage" />
      <input type="hidden" value={JSON.stringify(form)} />

      <Section number={1} title="Hero" description="The first thing every visitor sees. Leave a field blank to keep the current default copy.">
        <Field label="Eyebrow label" value={form.heroEyebrow ?? ""} onChange={(v) => set("heroEyebrow", v)} placeholder="Medical Diagnostic Laboratory" />
        <Field label="Headline" value={form.heroHeadline ?? ""} onChange={(v) => set("heroHeadline", v)} placeholder="Accurate Diagnostics. Better Health." />
        <Field label="Description" value={form.heroDescription ?? ""} onChange={(v) => set("heroDescription", v)} textarea placeholder="Advanced medical laboratory testing delivered with scientific precision..." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary CTA label" value={form.heroCtaLabel ?? ""} onChange={(v) => set("heroCtaLabel", v)} placeholder="Book an Appointment" />
          <Field label="Primary CTA destination" value={form.heroCtaHref ?? ""} onChange={(v) => set("heroCtaHref", v)} placeholder="/book" />
          <Field label="Secondary CTA label" value={form.heroSecondaryCtaLabel ?? ""} onChange={(v) => set("heroSecondaryCtaLabel", v)} placeholder="Access Your Results" />
          <Field label="Secondary CTA destination" value={form.heroSecondaryCtaHref ?? ""} onChange={(v) => set("heroSecondaryCtaHref", v)} placeholder="/results" />
        </div>
        <Field label="Trust statement" value={form.heroTrustStatement ?? ""} onChange={(v) => set("heroTrustStatement", v)} placeholder="A short quoted line under the headline." />
      </Section>

      <Section number={2} title="About preview" description="A short teaser section linking through to the full About page.">
        <Field label="Heading" value={form.aboutPreviewHeading ?? ""} onChange={(v) => set("aboutPreviewHeading", v)} />
        <Field label="Description" value={form.aboutPreviewDescription ?? ""} onChange={(v) => set("aboutPreviewDescription", v)} textarea />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA label" value={form.aboutPreviewCtaLabel ?? ""} onChange={(v) => set("aboutPreviewCtaLabel", v)} placeholder="Learn more about us" />
          <Field label="CTA destination" value={form.aboutPreviewCtaHref ?? ""} onChange={(v) => set("aboutPreviewCtaHref", v)} placeholder="/about" />
        </div>
      </Section>

      <Section number={3} title="Services section" description="Featured services shown here are controlled from Services — mark a service as Featured there.">
        <Field label="Section heading" value={form.servicesHeading ?? ""} onChange={(v) => set("servicesHeading", v)} />
        <Field label="Section description" value={form.servicesDescription ?? ""} onChange={(v) => set("servicesDescription", v)} textarea />
      </Section>

      <Section number={4} title="Trust / credibility" description="Real, factual statements only — no invented statistics, certifications, or claims.">
        <Field label="Heading" value={form.trustHeading ?? ""} onChange={(v) => set("trustHeading", v)} />
        <Field label="Description" value={form.trustDescription ?? ""} onChange={(v) => set("trustDescription", v)} textarea />
        <Field label="Quality statement" value={form.trustQualityStatement ?? ""} onChange={(v) => set("trustQualityStatement", v)} textarea placeholder="A factual statement about your quality process." />
        <Field label="Professional standards statement" value={form.trustProfessionalStandards ?? ""} onChange={(v) => set("trustProfessionalStandards", v)} textarea placeholder="Leave blank until accreditation/certification details are confirmed." />
      </Section>

      <Section number={5} title="Closing call to action">
        <Field label="Heading" value={form.ctaHeading ?? ""} onChange={(v) => set("ctaHeading", v)} />
        <Field label="Description" value={form.ctaDescription ?? ""} onChange={(v) => set("ctaDescription", v)} textarea />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA label" value={form.ctaLabel ?? ""} onChange={(v) => set("ctaLabel", v)} />
          <Field label="CTA destination" value={form.ctaHref ?? ""} onChange={(v) => set("ctaHref", v)} />
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
