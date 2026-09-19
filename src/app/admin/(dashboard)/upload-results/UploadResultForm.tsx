"use client";

import { useActionState, useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadStandaloneResultAction } from "./actions";

type ReportOption = { id: string; labNumber: string; patientName: string; status: string; reportTests: { id: string; testName: string }[] };

export function UploadResultForm({ reports }: { reports: ReportOption[] }) {
  const [state, action, pending] = useActionState(uploadStandaloneResultAction, {});
  const [reportId, setReportId] = useState("");
  const tests = useMemo(() => reports.find((r) => r.id === reportId)?.reportTests ?? [], [reports, reportId]);
  return (
    <form action={action} className="surface-card grid gap-5 p-6 sm:p-8">
      <label className="text-sm font-medium text-navy-deep">Report
        <select name="labReportId" value={reportId} onChange={(e) => setReportId(e.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
          <option value="">Select a report…</option>
          {reports.map((r) => <option key={r.id} value={r.id}>{r.labNumber} — {r.patientName} ({r.status})</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-navy-deep">Investigation
        <select name="reportTestId" required disabled={!reportId} className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm disabled:opacity-50">
          <option value="">Select an investigation…</option>
          {tests.map((t) => <option key={t.id} value={t.id}>{t.testName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-navy-deep">Result PDF
        <input name="file" type="file" accept="application/pdf,.pdf" required className="mt-2 block w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm" />
        <span className="mt-1 block text-xs text-muted-foreground">PDF only · maximum 15MB. The supplied PDF is stored as provided.</span>
      </label>
      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="rounded-xl border border-cyan/40 bg-accent p-4 text-sm font-medium text-navy-deep">Result PDF uploaded successfully.</p> : null}
      <button type="submit" disabled={pending || !reportId} className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><UploadCloud className="h-4 w-4" />{pending ? "Uploading…" : "Upload result"}</button>
    </form>
  );
}
