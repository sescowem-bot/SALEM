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

type CustomField = { label: string; inputType: "numeric" | "text"; unit: string; referenceRange: string };
const emptyCustomField = (): CustomField => ({ label: "", inputType: "text", unit: "", referenceRange: "" });

/**
 * Inline "parameters/result fields" builder for a brand-new test/
 * investigation created from the admin catalogue. Same field_based /
 * table_based shape and same UX as the "Create custom investigation"
 * builder in reports/[id]/ReportDetailClient.tsx — reused here rather than
 * reinvented, since a new test/investigation is exactly the same kind of
 * structure a scientist can already define ad hoc on a report.
 */
function ResultStructureBuilder({
  structureType,
  onStructureTypeChange,
  fields,
  setFields,
  columns,
  setColumns,
  rows,
  setRows,
}: {
  structureType: "field_based" | "table_based";
  onStructureTypeChange: (v: "field_based" | "table_based") => void;
  fields: CustomField[];
  setFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
  columns: string[];
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
  rows: string[];
  setRows: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-secondary/40 p-4">
      <label className="block text-sm font-medium text-navy-deep">
        Structure
        <select
          className={fieldClass}
          value={structureType}
          onChange={(e) => onStructureTypeChange(e.target.value as "field_based" | "table_based")}
        >
          <option value="field_based">Single / multi-parameter</option>
          <option value="table_based">Table (rows × columns)</option>
        </select>
      </label>

      {structureType === "field_based" ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Parameters — one row per result line (e.g. HB, WBC, PCV)
          </p>
          {fields.map((f, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.2fr_100px_90px_1fr_auto] sm:items-center">
              <input
                placeholder="Parameter name"
                className={fieldClass}
                value={f.label}
                onChange={(e) => setFields((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <select
                className={fieldClass}
                value={f.inputType}
                onChange={(e) =>
                  setFields((prev) => prev.map((x, j) => (j === i ? { ...x, inputType: e.target.value as "numeric" | "text" } : x)))
                }
              >
                <option value="text">Text</option>
                <option value="numeric">Numeric</option>
              </select>
              <input
                placeholder="Unit"
                className={fieldClass}
                value={f.unit}
                onChange={(e) => setFields((prev) => prev.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))}
              />
              <input
                placeholder="Reference range"
                className={fieldClass}
                value={f.referenceRange}
                onChange={(e) => setFields((prev) => prev.map((x, j) => (j === i ? { ...x, referenceRange: e.target.value } : x)))}
              />
              <button
                type="button"
                onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}
                disabled={fields.length === 1}
                className="justify-self-start text-xs font-semibold text-destructive disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFields((prev) => [...prev, emptyCustomField()])}
            className="text-xs font-semibold text-navy underline underline-offset-2"
          >
            + Add parameter
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Columns</p>
            {columns.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Column label"
                  className={fieldClass}
                  value={c}
                  onChange={(e) => setColumns((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  onClick={() => setColumns((prev) => prev.filter((_, j) => j !== i))}
                  disabled={columns.length === 1}
                  className="text-xs font-semibold text-destructive disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setColumns((prev) => [...prev, ""])}
              className="text-xs font-semibold text-navy underline underline-offset-2"
            >
              + Add column
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows</p>
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Row label"
                  className={fieldClass}
                  value={r}
                  onChange={(e) => setRows((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  disabled={rows.length === 1}
                  className="text-xs font-semibold text-destructive disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, ""])}
              className="text-xs font-semibold text-navy underline underline-offset-2"
            >
              + Add row
            </button>
          </div>
        </div>
      )}
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

  // "Create new result template" — only offered when adding a brand-new
  // test/investigation (mode === "create"). Editing an existing service
  // keeps the plain existing-template dropdown, unchanged, so an
  // in-progress report's structure is never affected by an edit.
  const [templateMode, setTemplateMode] = useState<"existing" | "new">("existing");
  const [structureType, setStructureType] = useState<"field_based" | "table_based">("field_based");
  const [fields, setFields] = useState<CustomField[]>([emptyCustomField()]);
  const [columns, setColumns] = useState<string[]>([""]);
  const [rows, setRows] = useState<string[]>([""]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-5">
      {service ? <input type="hidden" name="testId" value={service.id} /> : null}
      {mode === "create" ? (
        <>
          <input type="hidden" name="templateMode" value={templateMode} />
          <input type="hidden" name="newTemplateStructureType" value={structureType} />
          <input type="hidden" name="newTemplateFieldsJson" value={JSON.stringify(fields.filter((f) => f.label.trim()))} />
          <input type="hidden" name="newTemplateColumnsJson" value={JSON.stringify(columns.map((c) => c.trim()).filter(Boolean))} />
          <input type="hidden" name="newTemplateRowsJson" value={JSON.stringify(rows.map((r) => r.trim()).filter(Boolean))} />
        </>
      ) : null}

      <Section number={1} title={mode === "create" ? "New test / investigation" : "Basic information"} description={mode === "create" ? "Creates a new investigation in the catalogue — connected to a category and a result structure." : undefined}>
        <label className="block text-sm font-medium text-navy-deep">
          {mode === "create" ? "Test / investigation name" : "Service name"}
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

          {mode === "create" ? (
            <div className="block text-sm font-medium text-navy-deep">
              Result / parameter structure
              <div className="mt-1.5 flex gap-4 text-xs font-normal text-muted-foreground">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={templateMode === "existing"}
                    onChange={() => setTemplateMode("existing")}
                    className="h-3.5 w-3.5"
                  />
                  Use an existing template
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={templateMode === "new"}
                    onChange={() => setTemplateMode("new")}
                    className="h-3.5 w-3.5"
                  />
                  Define new parameters/result fields
                </label>
              </div>
              {templateMode === "existing" ? (
                <select name="templateId" required defaultValue="" className={fieldClass}>
                  <option value="" disabled>
                    Choose a template
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Build the result structure below — its own result template is created together with this investigation.
                </p>
              )}
            </div>
          ) : (
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
          )}
        </div>

        {mode === "create" && templateMode === "new" ? (
          <ResultStructureBuilder
            structureType={structureType}
            onStructureTypeChange={setStructureType}
            fields={fields}
            setFields={setFields}
            columns={columns}
            setColumns={setColumns}
            rows={rows}
            setRows={setRows}
          />
        ) : null}
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
          What to do / avoid
          <textarea
            name="whatToAvoid"
            rows={3}
            defaultValue={service?.what_to_avoid ?? ""}
            placeholder="e.g. Avoid alcohol for 24 hours before the test. Do not brush your teeth before an oral sample."
            className={textareaClass}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Shown separately from Preparation on the service page and booking screen.
          </span>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Important notes
          <textarea
            name="importantNotes"
            rows={3}
            defaultValue={service?.important_notes ?? ""}
            placeholder="e.g. Results may be delayed by one day around public holidays."
            className={textareaClass}
          />
          <span className="mt-1 block text-xs text-muted-foreground">Rendered as a highlighted callout, not folded into the description.</span>
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
              Active — available for patient booking &amp; result entry
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
