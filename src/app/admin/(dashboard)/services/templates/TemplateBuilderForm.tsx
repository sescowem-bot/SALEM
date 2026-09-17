"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, GripVertical, Table2, Rows3, MessageSquareText } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createResultTemplateAction, type TemplateActionState } from "./actions";
import { NARRATIVE_PRESETS, type NarrativeSectionDefinition } from "@/lib/data/reportNarratives";

const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none focus:border-cyan focus:bg-card";
type InputType = "numeric" | "text" | "select" | "positive_negative";
type Field = { label: string; inputType: InputType; unit: string; options: string };

function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Creating…" : "Create result template"}</button>;
}

const newField = (): Field => ({ label: "", inputType: "text", unit: "", options: "" });

export function TemplateBuilderForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(createResultTemplateAction, {} as TemplateActionState);
  const [type, setType] = useState<"field_based" | "table_based">("field_based");
  const [fields, setFields] = useState<Field[]>([newField()]);
  const [columns, setColumns] = useState<string[]>(["Result"]);
  const [rows, setRows] = useState<string[]>([""]);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSectionDefinition[]>(NARRATIVE_PRESETS.slice(0, 3));

  const fieldsJson = useMemo(() => JSON.stringify(fields.filter(f => f.label.trim()).map(f => ({
    label: f.label.trim(),
    inputType: f.inputType,
    unit: f.unit.trim(),
    options: f.inputType === "select" ? f.options.split(",").map(v => v.trim()).filter(Boolean) : [],
  }))), [fields]);

  const columnsJson = JSON.stringify(columns.map(v => v.trim()).filter(Boolean));
  const rowsJson = JSON.stringify(rows.map(v => v.trim()).filter(Boolean));
  const narrativeSectionsJson = JSON.stringify(narrativeSections.filter(s => s.label.trim()).map(s => ({ key: s.key, label: s.label.trim(), placeholder: s.placeholder.trim() })));

  return <form action={action} className="space-y-5">
    <input type="hidden" name="returnTo" value={returnTo} />
    <input type="hidden" name="structureType" value={type} />
    <input type="hidden" name="fieldsJson" value={fieldsJson} />
    <input type="hidden" name="columnsJson" value={columnsJson} />
    <input type="hidden" name="rowsJson" value={rowsJson} />
    <input type="hidden" name="narrativeSectionsJson" value={narrativeSectionsJson} />

    <section className="surface-card p-6 sm:p-7">
      <h2 className="text-sm font-semibold text-navy-deep">Template identity</h2>
      <p className="mt-1 text-xs text-muted-foreground">Create the result structure once, then reuse it for every report that uses this investigation.</p>
      <label className="mt-4 block text-sm font-medium text-navy-deep">Template name<input required name="name" className={inputClass} placeholder="e.g. Complete Blood Count (CBC)" /></label>
    </section>

    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">Result structure</h2>
          <p className="mt-1 text-xs text-muted-foreground">Use a multi-parameter layout for reports such as FBC, LFT, KFT, lipid profile and urinalysis. Use a table for panels such as Widal or culture grids.</p>
        </div>
        <div className="flex rounded-lg border border-border bg-secondary p-1">
          <button type="button" onClick={() => setType("field_based")} className={`rounded-md px-3 py-2 text-xs font-semibold ${type === "field_based" ? "bg-card text-navy shadow-soft" : "text-muted-foreground"}`}>Parameters</button>
          <button type="button" onClick={() => setType("table_based")} className={`rounded-md px-3 py-2 text-xs font-semibold ${type === "table_based" ? "bg-card text-navy shadow-soft" : "text-muted-foreground"}`}>Table</button>
        </div>
      </div>

      {type === "field_based" ? (
        <div className="mt-5 space-y-3">
          <div className="hidden gap-2 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[22px_1fr_150px_130px_1fr_36px]">
            <span /> <span>Parameter</span><span>Input type</span><span>Unit</span><span>Options for select</span><span />
          </div>
          {fields.map((f, i) => <div key={i} className="grid items-end gap-2 rounded-xl border border-border bg-secondary/40 p-3 sm:grid-cols-[22px_1fr_150px_130px_1fr_36px] sm:border-0 sm:bg-transparent sm:p-0">
            <GripVertical className="mb-2 hidden h-4 w-4 text-muted-foreground sm:block" />
            <label className="text-xs font-semibold text-navy-deep">Parameter<input className={inputClass} value={f.label} onChange={e => setFields(p => p.map((x,j) => j===i ? {...x,label:e.target.value}:x))} placeholder="e.g. Haemoglobin" /></label>
            <label className="text-xs font-semibold text-navy-deep">Input type<select className={inputClass} value={f.inputType} onChange={e => setFields(p => p.map((x,j) => j===i ? {...x,inputType:e.target.value as InputType}:x))}><option value="text">Text</option><option value="numeric">Numeric</option><option value="positive_negative">Positive / Negative</option><option value="select">Select</option></select></label>
            <label className="text-xs font-semibold text-navy-deep">Unit<input className={inputClass} value={f.unit} onChange={e=>setFields(p=>p.map((x,j)=>j===i?{...x,unit:e.target.value}:x))} placeholder="g/dL" /></label>
            <label className="text-xs font-semibold text-navy-deep">Options<input disabled={f.inputType !== "select"} className={inputClass} value={f.options} onChange={e=>setFields(p=>p.map((x,j)=>j===i?{...x,options:e.target.value}:x))} placeholder="A, B, AB, O" /></label>
            <button type="button" className="mb-2 text-destructive disabled:opacity-30" disabled={fields.length===1} onClick={()=>setFields(p=>p.filter((_,j)=>j!==i))} aria-label={`Remove parameter ${i+1}`}><Trash2 className="h-4 w-4" /></button>
          </div>)}
          <button type="button" onClick={()=>setFields(p=>[...p,newField()])} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"><Plus className="h-3.5 w-3.5" /> Add parameter</button>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Table2 className="h-4 w-4" /> Columns</div>{columns.map((c,i)=><div key={i} className="mt-2 flex gap-2"><input className={inputClass} value={c} onChange={e=>setColumns(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder="e.g. O / H" /><button type="button" onClick={()=>setColumns(p=>p.filter((_,j)=>j!==i))} disabled={columns.length===1} className="mt-2 text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={()=>setColumns(p=>[...p,""])} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy"><Plus className="h-3.5 w-3.5" /> Add column</button></div>
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Rows3 className="h-4 w-4" /> Rows</div>{rows.map((r,i)=><div key={i} className="mt-2 flex gap-2"><input className={inputClass} value={r} onChange={e=>setRows(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder="e.g. S. Typhi" /><button type="button" onClick={()=>setRows(p=>p.filter((_,j)=>j!==i))} disabled={rows.length===1} className="mt-2 text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={()=>setRows(p=>[...p,""])} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy"><Plus className="h-3.5 w-3.5" /> Add row</button></div>
        </div>
      )}
    </section>

    <section className="surface-card p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-deep"><MessageSquareText className="h-4 w-4" /> Narrative report sections</h2>
          <p className="mt-1 text-xs text-muted-foreground">Add separate sections that laboratory staff can complete during result entry. They print as clean narrative blocks rather than being forced into the result table.</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {narrativeSections.map((section, i) => (
          <div key={`${section.key}-${i}`} className="grid gap-2 rounded-xl border border-border bg-secondary/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs font-semibold text-navy-deep">Section title<input className={inputClass} value={section.label} onChange={e => setNarrativeSections(prev => prev.map((x,j) => j===i ? {...x,label:e.target.value}:x))} placeholder="e.g. Interpretation" /></label>
            <label className="text-xs font-semibold text-navy-deep">Staff prompt / placeholder<input className={inputClass} value={section.placeholder} onChange={e => setNarrativeSections(prev => prev.map((x,j) => j===i ? {...x,placeholder:e.target.value}:x))} placeholder="What should staff enter?" /></label>
            <button type="button" onClick={() => setNarrativeSections(prev => prev.filter((_,j) => j!==i))} className="mb-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setNarrativeSections(prev => [...prev, { key: `custom-${Date.now()}`, label: "", placeholder: "Enter the approved narrative…" }])} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"><Plus className="h-3.5 w-3.5" /> Add custom section</button>
          {NARRATIVE_PRESETS.filter(p => !narrativeSections.some(s => s.key === p.key)).map(p => <button key={p.key} type="button" onClick={() => setNarrativeSections(prev => [...prev, p])} className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent">+ {p.label}</button>)}
        </div>
      </div>
    </section>

    {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
    <div className="flex items-center gap-3"><SaveButton /><Link href={returnTo} className="text-sm font-medium text-muted-foreground hover:text-navy">Cancel</Link></div>
  </form>;
}
