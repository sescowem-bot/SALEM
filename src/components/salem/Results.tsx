import { Lock, Mail, Download, KeyRound, FileCheck2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/siteContent";

const resultsImg = "/images/results.jpg";

const steps = [
  {
    icon: FileCheck2,
    title: "Verified & signed off",
    body: "Your report is reviewed by a laboratory scientist before release.",
  },
  {
    icon: KeyRound,
    title: "Private access code",
    body: "We send a one-time code tied to your reference number only.",
  },
  {
    icon: Download,
    title: "View or download e-copy",
    body: "Open the PDF on any device, or receive it by email or WhatsApp.",
  },
];

export function Results() {
  return (
    <section id="results" className="relative overflow-hidden gradient-hero py-20 lg:py-28">
      <div
        className="grid-lab pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan">
            Secure Result Access
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your results. Yours alone.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cyan-soft/80">
            No public portal, no shared inbox. Results are released against your unique reference
            and a one-time access code, then delivered as a secure e-copy.
          </p>

          <div className="mt-9 space-y-4">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur transition-colors hover:border-cyan/40 hover:bg-white/12"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan-soft">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    <span className="mr-2 text-cyan/70">0{i + 1}</span>
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-cyan-soft/70">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/results"
              className="inline-flex items-center gap-2 rounded-full gradient-accent px-6 py-3.5 text-sm font-semibold text-navy-deep shadow-glow transition-transform hover:scale-[1.03]"
            >
              <Lock className="h-4 w-4 shrink-0" /> Request my e-copy
            </Link>
            <a
              href={`mailto:${siteConfig.email.results}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              <Mail className="h-4 w-4 shrink-0" /> Email the records desk
            </a>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="overflow-hidden rounded-[2rem] border border-white/15 shadow-lift">
            <Image
              src={resultsImg}
              alt="Patient viewing a secure encrypted laboratory report on a phone"
              loading="lazy"
              width={1312}
              height={1008}
              className="h-[22rem] w-full object-cover sm:h-[28rem]"
            />
          </div>
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-lift sm:left-8">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
              <Lock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-deep">Encrypted end-to-end</p>
              <p className="text-xs text-muted-foreground">Confidential by policy and design</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
