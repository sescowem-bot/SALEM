import { CalendarCheck, FileText, ShieldCheck, Microscope, Home, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/siteContent";

const heroLab = "/images/hero-lab.jpg";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden gradient-hero pt-28 lg:pt-36">
      <div
        className="grid-lab pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28">
        <div className="rise-in min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-soft">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Medical Diagnostic Laboratory
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
            Accurate <span className="text-gradient-accent">Diagnostics</span>. Better Health.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-cyan-soft/80 sm:text-lg">
            Advanced medical laboratory testing delivered with scientific precision, compassionate
            care and clear, reliable results.
          </p>

          <p className="mt-5 border-l-2 border-cyan/60 pl-4 text-sm italic text-cyan-soft/90 sm:text-base">
            “{siteConfig.tagline}”
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full gradient-accent px-6 py-3.5 text-sm font-semibold text-navy-deep shadow-glow transition-transform hover:scale-[1.03]"
            >
              <CalendarCheck className="h-4.5 w-4.5 shrink-0" /> Book an Appointment
            </Link>
            <Link
              href="/results"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              <FileText className="h-4.5 w-4.5 shrink-0" /> Access Your Results
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 shadow-lift">
            <Image
              src={heroLab}
              alt="Scientist at Salem Medical Laboratories operating a modern diagnostic analyser"
              width={1600}
              height={1104}
              priority
              className="h-[22rem] w-full object-cover sm:h-[28rem] lg:h-[34rem]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>

          <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-card/95 px-4 py-3 shadow-lift backdrop-blur sm:left-6">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-navy">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy-deep">Secure e-copy results</p>
              <p className="truncate text-xs text-muted-foreground">By email or WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: CalendarCheck,
              title: "Book a test",
              body: "Pick a time that suits you.",
              href: "/book",
            },
            {
              icon: Home,
              title: "Home collection",
              body: "Our phlebotomist comes to you.",
              href: "/home-collection",
            },
            {
              icon: Microscope,
              title: "Walk-in enquiry",
              body: "Speak to our lab team today.",
              href: "/contact",
            },
            {
              icon: FileText,
              title: "Access results",
              body: "Secure e-copy, verified.",
              href: "/results",
            },
          ].map(({ icon: Icon, title, body, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan/45 hover:bg-white/14"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan-soft">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  {title}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-cyan-soft/70">{body}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
