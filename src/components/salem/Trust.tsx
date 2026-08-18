import { ShieldCheck, Timer, UserCheck, Sparkles } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Quality you can verify",
    body: "Internal quality control checks run on our analysers before patient samples are processed.",
  },
  {
    icon: Timer,
    title: "Turnaround that respects you",
    body: "We confirm an honest turnaround time for your specific test at the point of booking.",
  },
  {
    icon: UserCheck,
    title: "Scientists, not machines alone",
    body: "Qualified medical laboratory scientists review each report before it leaves us.",
  },
  {
    icon: Sparkles,
    title: "Clarity you can understand",
    body: "Plain-language reference ranges and notes, so results make sense to you.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="relative overflow-hidden bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
              Why Salem
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
              Built on accuracy. Delivered with warmth.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              We know a laboratory result is rarely just paperwork — it is a family waiting for
              news. That is why our standards are clinical, but our people are kind.
            </p>
            <div className="mt-8 rounded-2xl border border-cyan/25 bg-card p-6 shadow-soft">
              <p className="text-sm leading-relaxed text-navy">
                Every report that leaves Salem carries a scientist&apos;s review — so what you receive is
                a result you can act on, explained in language you understand.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="surface-card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-accent text-navy-deep">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-navy-deep">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
