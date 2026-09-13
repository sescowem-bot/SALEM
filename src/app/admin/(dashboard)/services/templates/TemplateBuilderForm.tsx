"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createResultTemplateAction, type TemplateActionState } from "./actions";

const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none focus:border-cyan focus:bg-card";
type Field = { label: string; inputType: "numeric" | "text"; unit: string };

function SaveButton() { const { pending } = useFormStatus(); return <button disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Creating…" : "Create result template"}</button>; }

export function TemplateBuilderForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(createResultTemplateAction, {} as TemplateActionState);
  const [type, setType] = useState<"field_based" | "table_based">("field_based");
  const [fields, setFields] = useState<Field[]>([{ label: "", inputType: "text", unit: "" }]);
  const [columns, setColumns] = useState<string[]>(["Result"]);
  const [rows, setRows] = useState<string[]>([""]);
  return <form action={action} className="space-y-5">
    <input type="hidden" name="returnTo" value={returnTo} />
    <input type="hidden" name="structureType" value={type} />
    <input type="hidden" name="fieldsJson" value={JSON.stringify(fields.filter(f => f.label.trim()))} />
    <input type="hidden" name="columnsJson" value={JSON.stringify(columns.filter(Boolean))} />
    <input type="hidden" name="rowsJson" value={JSON.stringify(rows.filter(Boolean))} />
    <section className="surface-card p-6"><h2 className="text-sm font-semibold text-navy-deep">Template identity</h2><label className="mt-4 block text-sm font-medium text-navy-deep">Template name<input required name="name" className={inputClass} placeholder="e.g. Complete Blood Count (CBC)" /></label></section>
    <section className="surface-card p-6"><h2 className="text-sm font-semibold text-navy-deep">Result structure</h2><p className="mt-1 text-xs text-muted-foreground">Define the fields or table layout the scientist will complete when entering a result.</p>
      <select value={type} onChange={e => setType(e.target.value as typeof type)} className={inputClass}><option value="field_based">Single / multi-parameter</option><option value="table_based">Table (rows × columns)</option></select>
      {type === "field_based" ? <div className="mt-5 space-y-3">{fields.map((f,i)=><div key={i} className="grid gap-2 sm:grid-cols-[1fr_150px_130px_auto]"><input className={inputClass} value={f.label} onChange={e=>setFields(p=>p.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Parameter name" /><select className={inputClass} value={f.inputType} onChange={e=>setFields(p=>p.map((x,j)=>j===i?{...x,inputType:e.target.value as Field["inputType"]}:x))}><option value="text">Text</option><option value="numeric">Numeric</option></select><input className={inputClass} value={f.unit} onChange={e=>setFields(p=>p.map((x,j)=>j===i?{...x,unit:e.target.value}:x))} placeholder="Unit" /><button type="button" className="mt-1 text-xs font-semibold text-destructive" disabled={fields.length===1} onClick={()=>setFields(p=>p.filter((_,j)=>j!==i))}><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={()=>setFields(p=>[...p,{label:"",inputType:"text",unit:""}])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy"><Plus className="h-3.5 w-3.5" /> Add parameter</button></div> : <div className="mt-5 grid gap-6 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Columns</p>{columns.map((c,i)=><div key={i} className="mt-2 flex gap-2"><input className={inputClass} value={c} onChange={e=>setColumns(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder="Column" /><button type="button" onClick={()=>setColumns(p=>p.filter((_,j)=>j!==i))} disabled={columns.length===1} className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={()=>setColumns(p=>[...p,""])} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-navy"><Plus className="h-3.5 w-3.5" /> Add column</button></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows</p>{rows.map((r,i)=><div key={i} className="mt-2 flex gap-2"><input className={inputClass} value={r} onChange={e=>setRows(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder="Row label" /><button type="button" onClick={()=>setRows(p=>p.filter((_,j)=>j!==i))} disabled={rows.length===1} className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={()=>setRows(p=>[...p,""])} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-navy"><Plus className="h-3.5 w-3.5" /> Add row</button></div></div>}
    </section>
    {state.error ? <p className="surface-card p-4 text-sm text-destructive">{state.error}</p> : null}
    <div className="flex items-center gap-3"><SaveButton /><Link href={returnTo} className="text-sm font-medium text-muted-foreground hover:text-navy">Cancel</Link></div>
  </form>
}
