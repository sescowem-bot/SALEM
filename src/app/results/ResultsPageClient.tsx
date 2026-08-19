"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck, Download, Lock, KeyRound, FileCheck2, Mail, FileText } from "lucide-react";
import { siteConfig } from "@/data/siteContent";
import { verifyResultAction, type VerifyState } from "./actions";
import type { PublishedResultDto } from "@/lib/data/verification";

const steps = [
  {
    icon: FileCheck2,
    title: "Verified & signed off",
    body: "Your report is reviewed by a laboratory scientist before release.",
  },
  {
    icon: KeyRound,
    title: "Private access code",
    body: "We send a one-time code tied to your lab reference number only.",
  },
  {
    icon: Download,
    title: "View or download e-copy",
    body: "Open the PDF on any device, or receive it by email or WhatsApp.",
  },
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initialState: VerifyState = {};

function UnlockButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
    >
      <Lock className="h-4 w-4 shrink-0" /> {pending ? "Checking\u2026" : "Unlock my report"}
    </button>
  );
}

export function ResultsPageClient() {
  const [state, formAction] = useActionState(verifyResultAction, initialState);

  return (
    <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-6">
              <div className="surface-card p-6 sm:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
                  <Lock className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-navy-deep">Enter your details</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Both fields are printed on your sample receipt and sent by SMS or email when your
                  result is released.
                </p>
                <form action={formAction} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium text-navy-deep">
                    Lab reference number
                    <input
                      className={fieldClass}
                      placeholder="e.g. SML-XXXX-XXXX"
                      name="reference"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    One-time access code
                    <input className={fieldClass} placeholder="6-digit code" name="code" required />
                  </label>
                  {state.error ? (
                    <p className="text-sm font-medium text-destructive">{state.error}</p>
                  ) : null}
                  <UnlockButton />
                </form>
                <p className="mt-4 text-xs text-muted-foreground">
                  Didn&apos;t receive a code? Email{" "}
                  <a
                    href={`mailto:${siteConfig.email.results}`}
                    className="font-semibold text-purple hover:text-navy"
                  >
                    {siteConfig.email.results}
                  </a>{" "}
                  or visit the laboratory with a valid ID.
                </p>
              </div>

              <div className="space-y-4">
                {steps.map(({ icon: Icon, title: t, body }, i) => (
                  <div
                    key={t}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-secondary p-5"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-deep">
                        <span className="mr-2 text-purple">0{i + 1}</span>
                        {t}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {state.result ? (
              <ReportPreview result={state.result} />
            ) : (
              <div className="surface-card grid min-h-[420px] place-items-center p-8 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-navy">
                    <Lock className="h-6 w-6" />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold text-navy-deep">
                    Your report will appear here
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Enter your lab reference number and access code on the left to securely view
                    your result.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
  );
}

function ReportPreview({ result }: { result: PublishedResultDto }) {
  return (
    <article className="surface-card overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border bg-secondary p-6 sm:p-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple">
            Salem Medical Laboratories
          </p>
          <h2 className="mt-2 text-xl font-semibold text-navy-deep sm:text-2xl">{result.patientName}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Lab number {result.labNumber} &middot; Reference {result.resultReference}
            {result.dateReported ? <> &middot; Reported {result.dateReported}</> : null}
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {result.tests.map((test) => (
          <div key={test.testName} className="overflow-hidden rounded-2xl border border-dashed border-border">
            <div className="bg-secondary px-4 py-2.5 text-sm font-semibold text-navy-deep">{test.testName}</div>

            {test.fields.length > 0 ? (
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 font-semibold">Investigation</th>
                    <th className="px-4 py-2 font-semibold">Result</th>
                    <th className="px-4 py-2 font-semibold">Unit</th>
                    <th className="px-4 py-2 font-semibold">Reference range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {test.fields.map((f) => (
                    <tr key={f.label}>
                      <td className="px-4 py-2.5 text-navy-deep">{f.label}</td>
                      <td className="px-4 py-2.5 font-medium text-navy-deep">{f.value || "\u2014"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{f.unit || "\u2014"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{f.referenceRange || "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {test.table.length > 0 ? (
              <div className="p-4 text-sm text-navy-deep">
                {Object.entries(
                  test.table.reduce<Record<string, { columnLabel: string; value: string | null }[]>>((acc, cell) => {
                    acc[cell.rowLabel] = acc[cell.rowLabel] ?? [];
                    acc[cell.rowLabel].push({ columnLabel: cell.columnLabel, value: cell.value });
                    return acc;
                  }, {})
                ).map(([rowLabel, cells]) => (
                  <p key={rowLabel} className="py-1">
                    <span className="font-medium">{rowLabel}:</span>{" "}
                    {cells.map((c) => `${c.columnLabel} ${c.value ?? "\u2014"}`).join(", ")}
                  </p>
                ))}
              </div>
            ) : null}

            {test.comment ? (
              <p className="border-t border-border px-4 py-3 text-sm italic text-muted-foreground">{test.comment}</p>
            ) : null}

            {test.pdfSignedUrl ? (
              <a
                href={test.pdfSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-navy hover:text-cyan"
              >
                <FileText className="h-4 w-4 shrink-0" /> View original PDF report
              </a>
            ) : null}
          </div>
        ))}

        <div className="rounded-2xl bg-secondary p-5">
          <span className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" /> Verified Salem Medical Laboratories result
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
          >
            <Mail className="h-4 w-4 shrink-0" /> Request a call to explain this report
          </Link>
        </div>
      </div>
    </article>
  );
}
