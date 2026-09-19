"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { FileText, Search, UploadCloud, UserPlus, X } from "lucide-react";
import { uploadStandaloneResultAction, type UploadState } from "./actions";

type Patient = { id: string; full_name: string; sex: "Male" | "Female" | null; date_of_birth: string | null; phone: string | null; email: string | null };

const fieldClass = "mt-1 w-full rounded-xl border border-border bg-secondary px-3.5 py-3 text-sm text-navy-deep outline-none transition-colors focus:border-cyan focus:bg-card";
const initial: UploadState = {};

export function UploadResultForm({ patients }: { patients: Patient[] }) {
  const [state, action, pending] = useActionState(uploadStandaloneResultAction, initial);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = useState("");
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 50);
    return patients.filter((p) => [p.full_name, p.phone ?? "", p.email ?? ""].some((v) => v.toLowerCase().includes(q))).slice(0, 50);
  }, [patients, query]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <form action={action} className="space-y-6">
      <section className="surface-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple">Step 1</p>
            <h2 className="mt-1 text-lg font-semibold text-navy-deep">Patient</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use an existing patient or register a new patient without leaving this workflow.</p>
          </div>
          <div className="flex rounded-full border border-border bg-secondary p-1">
            <button type="button" onClick={() => setMode("existing")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "existing" ? "bg-navy text-primary-foreground" : "text-navy"}`}>Existing patient</button>
            <button type="button" onClick={() => setMode("new")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "new" ? "bg-navy text-primary-foreground" : "text-navy"}`}><UserPlus className="mr-1 inline h-3.5 w-3.5" />New patient</button>
          </div>
        </div>
        <input type="hidden" name="patientMode" value={mode} />
        {mode === "existing" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div>
              <label className="text-sm font-medium text-navy-deep">Find patient</label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, phone or email" className="w-full rounded-xl border border-border bg-secondary py-3 pl-9 pr-3 text-sm outline-none focus:border-cyan focus:bg-card" />
              </div>
            </div>
            <label className="text-sm font-medium text-navy-deep">Patient
              <select name="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} required className={fieldClass}>
                <option value="">Select patient…</option>
                {filteredPatients.map((p) => <option key={p.id} value={p.id}>{p.full_name}{p.phone ? ` · ${p.phone}` : ""}</option>)}
              </select>
            </label>
            {selectedPatient ? <div className="rounded-xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground md:col-span-2"><span className="font-semibold text-navy-deep">Selected:</span> {selectedPatient.full_name} · {selectedPatient.email || "No email"} · {selectedPatient.phone || "No phone"}</div> : null}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-navy-deep">Full name<input name="fullName" required={mode === "new"} className={fieldClass} placeholder="Patient full name" /></label>
            <label className="text-sm font-medium text-navy-deep">Sex<select name="sex" className={fieldClass}><option value="">Not specified</option><option>Male</option><option>Female</option></select></label>
            <label className="text-sm font-medium text-navy-deep">Date of birth<input name="dateOfBirth" type="date" className={fieldClass} /></label>
            <label className="text-sm font-medium text-navy-deep">Phone<input name="phone" className={fieldClass} placeholder="080…" /></label>
            <label className="text-sm font-medium text-navy-deep sm:col-span-2">Email<input name="email" type="email" className={fieldClass} placeholder="patient@example.com" /></label>
          </div>
        )}
      </section>

      <section className="surface-card p-5 sm:p-7">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple">Step 2</p><h2 className="mt-1 text-lg font-semibold text-navy-deep">Report details</h2><p className="mt-1 text-sm text-muted-foreground">These details identify the supplied document inside Salem. The investigation name can be different from the existing catalogue.</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-navy-deep">Lab number<input name="labNumber" required className={fieldClass} placeholder="e.g. SML-000123" /></label>
          <label className="text-sm font-medium text-navy-deep">Investigation / result type<input name="investigationName" required className={fieldClass} placeholder="e.g. Full Blood Count" /></label>
          <label className="text-sm font-medium text-navy-deep">Date collected<input name="dateCollected" type="date" className={fieldClass} /></label>
          <label className="text-sm font-medium text-navy-deep sm:col-span-2">Request<input name="request" className={fieldClass} placeholder="Reason for test / request" /></label>
          <label className="text-sm font-medium text-navy-deep">Specimen<input name="specimen" className={fieldClass} placeholder="e.g. Blood" /></label>
          <label className="text-sm font-medium text-navy-deep sm:col-span-3">Report comment<textarea name="reportComment" rows={3} className={fieldClass} placeholder="Optional laboratory comment or note" /></label>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-7">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple">Step 3</p><h2 className="mt-1 text-lg font-semibold text-navy-deep">Finished result document</h2><p className="mt-1 text-sm text-muted-foreground">Upload the already-completed PDF. Salem stores it privately and carries it through approval, publication and patient delivery.</p></div>
        <div className="mt-5 rounded-2xl border-2 border-dashed border-border bg-secondary/50 p-7 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-card text-navy shadow-soft"><UploadCloud className="h-6 w-6" /></span>
          <p className="mt-3 text-sm font-semibold text-navy-deep">Choose the final report PDF</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF only · maximum 15MB · private patient document</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-navy hover:border-cyan hover:bg-accent">Browse PDF</button>
          <input ref={inputRef} name="file" type="file" accept="application/pdf,.pdf" required className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
        </div>
        {fileName ? <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy"><FileText className="h-4 w-4" /></span><span className="truncate text-sm font-medium text-navy-deep">{fileName}</span></span><button type="button" onClick={() => { setFileName(""); if (inputRef.current) inputRef.current.value = ""; }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove selected PDF"><X className="h-4 w-4" /></button></div> : null}
      </section>

      {state.error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{state.error}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">After upload, the report remains private and enters the normal approval workflow. It is not emailed to the patient until an authorized staff member publishes it.</p>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"><UploadCloud className="h-4 w-4" />{pending ? "Creating report…" : "Upload & continue"}</button>
      </div>
    </form>
  );
}
