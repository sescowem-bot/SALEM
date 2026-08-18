import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingWhatsApp } from "./WhatsAppButton";
import { AiAssistant } from "./AiAssistant";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <AiAssistant />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden gradient-hero pb-16 pt-28 lg:pb-20 lg:pt-40">
      <div
        className="grid-lab pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-cyan/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-soft/80">
          {eyebrow}
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {lead ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cyan-soft/80">{lead}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
