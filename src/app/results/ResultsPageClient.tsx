"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Download, Printer, Lock, KeyRound, FileCheck2, Mail } from "lucide-react";
import { siteConfig } from "@/data/siteContent";

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

export function ResultsPageClient() {
  const [unlocked, setUnlocked] = useState(false);

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
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setUnlocked(true);
                  }}
                >
                  <label className="block text-sm font-medium text-navy-deep">
                    Lab reference number
                    <input
                      className={fieldClass}
                      placeholder="e.g. SML-000000"
                      name="reference"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    One-time access code
                    <input className={fieldClass} placeholder="6-digit code" name="code" required />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
                  >
                    <Lock className="h-4 w-4 shrink-0" /> Unlock my report
                  </button>
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

            {unlocked ? (
              <ReportPreview />
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

function ReportPreview() {
  return (
    <article className="surface-card overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border bg-secondary p-6 sm:p-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple">
            Sample report layout — for illustration only
          </p>
          <h2 className="mt-2 text-xl font-semibold text-navy-deep sm:text-2xl">
            This is a placeholder preview
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The real report — with your patient details, investigations, results, reference ranges
            and scientist sign-off on Salem letterhead — will render here once the results system is
            connected.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-2xl border border-dashed border-border">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Investigation</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Reference range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {["Investigation 1", "Investigation 2", "Investigation 3"].map((row) => (
                <tr key={row}>
                  <td className="px-4 py-3 text-navy-deep">{row}</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <span className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" /> Reviewed &amp; signed by
          </span>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            [Reviewing scientist name and signature — populated by the results system]
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-primary-foreground opacity-60"
            title="Enabled once the results system is connected"
          >
            <Download className="h-4 w-4 shrink-0" /> Download PDF
          </button>
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-navy opacity-60"
            title="Enabled once the results system is connected"
          >
            <Printer className="h-4 w-4 shrink-0" /> Print report
          </button>
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
