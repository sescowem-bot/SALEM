"use client";

import { useRef, useState } from "react";
import {
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Save,
  PenTool,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

type ResultRow = {
  id: string;
  investigation: string;
  result: string;
  unit: string;
  referenceRange: string;
};

function newRow(): ResultRow {
  return { id: crypto.randomUUID(), investigation: "", result: "", unit: "", referenceRange: "" };
}

export function ResultsEntryPageClient() {
  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="h-11 bg-card p-1 shadow-soft">
        <TabsTrigger value="manual" className="px-4 py-2 text-sm">
          Manual entry
        </TabsTrigger>
        <TabsTrigger value="upload" className="px-4 py-2 text-sm">
          Upload existing report
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="mt-6">
        <ManualEntryForm />
      </TabsContent>
      <TabsContent value="upload" className="mt-6">
        <UploadReportForm />
      </TabsContent>
    </Tabs>
  );
}

function ManualEntryForm() {
  const [rows, setRows] = useState<ResultRow[]>([newRow(), newRow(), newRow()]);

  const updateRow = (id: string, field: keyof ResultRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <section className="surface-card p-6 sm:p-8">
        <h2 className="text-base font-semibold text-navy-deep">Patient &amp; sample details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-navy-deep">
            Patient full name
            <input className={fieldClass} placeholder="Patient full name" name="patientName" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Lab reference number
            <input className={fieldClass} placeholder="e.g. SML-000000" name="labReference" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Date of birth
            <input className={fieldClass} placeholder="DD / MM / YYYY" name="dob" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Sex
            <select className={fieldClass} name="sex" defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Referring doctor
            <input className={fieldClass} placeholder="Optional" name="referringDoctor" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Date collected
            <input className={fieldClass} placeholder="DD / MM / YYYY" name="dateCollected" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Date reported
            <input className={fieldClass} placeholder="DD / MM / YYYY" name="dateReported" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Sample type
            <input
              className={fieldClass}
              placeholder="e.g. Serum, EDTA whole blood"
              name="sampleType"
            />
          </label>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-navy-deep">Investigations &amp; results</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> Add row
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-semibold">Investigation</th>
                <th className="pb-2 pr-3 font-semibold">Result</th>
                <th className="pb-2 pr-3 font-semibold">Unit</th>
                <th className="pb-2 pr-3 font-semibold">Reference range</th>
                <th className="pb-2 font-semibold sr-only">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-3">
                    <input
                      className={fieldClass}
                      placeholder="e.g. Haemoglobin"
                      value={row.investigation}
                      onChange={(e) => updateRow(row.id, "investigation", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={fieldClass}
                      placeholder="Value"
                      value={row.result}
                      onChange={(e) => updateRow(row.id, "result", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={fieldClass}
                      placeholder="g/dL"
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={fieldClass}
                      placeholder="12.0 – 15.5"
                      value={row.referenceRange}
                      onChange={(e) => updateRow(row.id, "referenceRange", e.target.value)}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove row"
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <h2 className="text-base font-semibold text-navy-deep">
          Scientist&apos;s comment &amp; sign-off
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
            Comment (optional)
            <textarea
              rows={3}
              className={fieldClass}
              placeholder="Clinical correlation notes, flagged values, advice…"
              name="comment"
            />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Reviewing scientist name
            <input className={fieldClass} placeholder="Full name" name="scientistName" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            License / MLSCN number
            <input className={fieldClass} placeholder="Optional" name="scientistLicense" />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
          <PenTool className="h-4 w-4 shrink-0" />
          Digital signature capture will be added here when the results system is connected.
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled
          title="Enabled once the results system is connected"
          className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground opacity-60"
        >
          <Save className="h-4 w-4 shrink-0" /> Save &amp; generate report
        </button>
        <p className="text-xs text-muted-foreground">
          This will generate an A4 Salem-letterhead PDF once wired up — not active yet.
        </p>
      </div>
    </form>
  );
}

function UploadReportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const acceptTypes = "application/pdf,image/jpeg,image/png";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((f) =>
      ["application/pdf", "image/jpeg", "image/png"].includes(f.type),
    );
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <h2 className="text-base font-semibold text-navy-deep">Patient &amp; sample details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-navy-deep">
            Patient full name
            <input className={fieldClass} placeholder="Patient full name" name="patientName" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Lab reference number
            <input className={fieldClass} placeholder="e.g. SML-000000" name="labReference" />
          </label>
          <label className="block text-sm font-medium text-navy-deep">
            Date reported
            <input className={fieldClass} placeholder="DD / MM / YYYY" name="dateReported" />
          </label>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <h2 className="text-base font-semibold text-navy-deep">Upload the existing report</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Accepted formats: PDF, JPG, PNG.</p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? "border-cyan bg-accent" : "border-border bg-secondary"
          }`}
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-card text-navy shadow-soft">
            <UploadCloud className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy-deep">Drag &amp; drop files here</p>
            <p className="mt-1 text-xs text-muted-foreground">or</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 ? (
          <ul className="mt-5 space-y-2.5">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                    {f.type === "application/pdf" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-navy-deep">
                      {f.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  aria-label={`Remove ${f.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          title="Enabled once the results system is connected"
          className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground opacity-60"
        >
          <Save className="h-4 w-4 shrink-0" /> Attach to patient record
        </button>
        <p className="text-xs text-muted-foreground">
          Files stay in this browser tab only — nothing is uploaded yet.
        </p>
      </div>
    </div>
  );
}
