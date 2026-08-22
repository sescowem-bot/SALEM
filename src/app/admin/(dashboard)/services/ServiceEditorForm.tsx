"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createServiceAction, updateServiceAction, type ActionState } from "./actions";
import { slugify } from "@/lib/utils/slug";
import type { ServiceWithCategory } from "@/lib/data/testCatalog";
import type { Database } from "@/lib/supabase/database.types";

type TestCategory = Database["public"]["Tables"]["test_categories"]["Row"];
type TestTemplate = Database["public"]["Tables"]["test_templates"]["Row"];

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

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

const initial: ActionState = {};

export function ServiceEditorForm({
  mode,
  service,
  categories,
  templates,
}: {
  mode: "create" | "edit";
  service?: ServiceWithCategory;
  categories: TestCategory[];
  templates: TestTemplate[];
}) {
  const action = mode === "create" ? createServiceAction : updateServiceAction;
  const [state, formAction] = useActionState(action, initial);

  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-5">
      {service ? <input type="hidden" name="testId" value={service.id} /> : null}

      <Section number={1} title="Basic information">
        <label className="block text-sm font-medium text-navy-deep">
          Service name
          <input
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Slug
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={fieldClass}
          />
          <span className="mt-1 block text-xs text-muted-foreground">/services/{slug || "your-slug-here"}</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy-deep">
            Category
            <select name="categoryId" required defaultValue={service?.category_id ?? ""} className={fieldClass}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Result template
            <select name="templateId" required defaultValue={service?.template_id ?? ""} className={fieldClass}>
              <option value="" disabled>
                Choose a template
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">Which result-entry template this service produces a report from.</span>
          </label>
        </div>
      </Section>

      <Section number={2} title="Service description">
        <label className="block text-sm font-medium text-navy-deep">
          Short description
          <textarea
            name="publicDescription"
            rows={2}
            maxLength={500}
            defaultValue={service?.public_description ?? ""}
            placeholder="One or two sentences shown on the services directory card."
            className={textareaClass}
          />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Full description
          <textarea
            name="fullDescription"
            rows={6}
            maxLength={5000}
            defaultValue={service?.full_description ?? ""}
            placeholder="Detailed content shown on the service's own page."
            className={textareaClass}
          />
        </label>
      </Section>

      <Section number={3} title="Patient information / preparation">
        <label className="block text-sm font-medium text-navy-deep">
          Preparation
          <textarea
            name="preparationInfo"
            rows={3}
            defaultValue={service?.preparation_info ?? ""}
            placeholder="e.g. Fast for 8-12 hours before sample collection."
            className={textareaClass}
          />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Requirements
          <textarea
            name="requirements"
            rows={3}
            defaultValue={service?.requirements ?? ""}
            placeholder="e.g. Valid ID, referral letter if applicable."
            className={textareaClass}
          />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Turnaround time
          <input name="turnaroundTime" defaultValue={service?.turnaround_time ?? ""} placeholder="e.g. 24 hours" className={fieldClass} />
        </label>
      </Section>

      <Section number={4} title="Pricing & availability">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy-deep">
            Price (₦)
            <input
              name="priceNgn"
              type="number"
              min={0}
              step="0.01"
              defaultValue={service?.price_ngn ?? ""}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-col justify-end gap-2 pb-1.5">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep">
              <input type="checkbox" name="showPrice" value="true" defaultChecked={service?.show_price ?? false} className="h-4 w-4 rounded border-border" />
              Show price publicly
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep">
              <input type="checkbox" name="isActive" value="true" defaultChecked={service?.is_active ?? true} className="h-4 w-4 rounded border-border" />
              Active (bookable / used for result entry)
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-deep">
              <input type="checkbox" name="featured" value="true" defaultChecked={service?.featured ?? false} className="h-4 w-4 rounded border-border" />
              Featured on the services directory
            </label>
          </div>
        </div>
      </Section>

      <Section number={5} title="Call to action" description="Defaults to the standard booking flow if left blank.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy-deep">
            CTA label
            <input name="ctaLabel" defaultValue={service?.cta_label ?? ""} placeholder="Book this test" className={fieldClass} />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            CTA destination
            <input name="ctaDestination" defaultValue={service?.cta_destination ?? ""} placeholder="/book?testId=..." className={fieldClass} />
          </label>
        </div>
      </Section>

      <Section number={6} title="SEO">
        <label className="block text-sm font-medium text-navy-deep">
          SEO title
          <input name="seoTitle" maxLength={70} defaultValue={service?.seo_title ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          SEO description
          <textarea name="seoDescription" rows={2} maxLength={160} defaultValue={service?.seo_description ?? ""} className={textareaClass} />
        </label>
      </Section>

      {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SaveBar />
        {service ? (
          <span className="text-xs text-muted-foreground">
            Saving does not change publish status — use Publish/Unpublish from the services list.
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Creates as a draft. Publish afterwards from the services list.</span>
        )}
      </div>
    </form>
  );
}
