"use client";

import { useState } from "react";
import { Sparkles, X, Send, ShieldAlert, CalendarCheck, MapPin, FileText } from "lucide-react";
import Link from "next/link";

/**
 * Salem Assistant — UI shell only.
 *
 * This component is NOT wired to any AI API. The input is intentionally
 * disabled and the quick-reply chips route to real pages instead of
 * generating text. Wire this up to an API later; keep the disclaimer and
 * the "does not diagnose" language when you do.
 */
const suggestions = [
  { icon: CalendarCheck, label: "How do I book a test?", to: "/book" as const },
  { icon: MapPin, label: "How does home collection work?", to: "/home-collection" as const },
  { icon: FileText, label: "How do I access my results?", to: "/results" as const },
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div className="fixed bottom-[9.5rem] right-5 z-50 flex max-h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift sm:bottom-[10.5rem] sm:right-6">
          <div className="flex items-center justify-between gap-3 gradient-hero px-5 py-4">
            <div className="flex items-center gap-2.5 text-white">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Salem Assistant</p>
                <p className="text-[0.7rem] text-cyan-soft/70">Not yet connected</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-start gap-2.5 rounded-2xl border border-cyan/25 bg-accent/40 p-3.5 text-xs leading-relaxed text-navy">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
              <p>
                This assistant can answer questions about Salem&apos;s tests, services, preparation,
                appointments, home collection and result access. It does not diagnose, interpret
                personal results, or replace advice from your doctor.
              </p>
            </div>

            <div className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed text-navy-deep">
              Hi, I&apos;m the Salem Assistant. I&apos;m not connected yet — once I am, I&apos;ll be
              able to answer questions right here. For now, these might help:
            </div>

            <div className="space-y-2">
              {suggestions.map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  href={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm font-medium text-navy-deep transition-colors hover:border-cyan hover:bg-accent"
                >
                  <Icon className="h-4 w-4 shrink-0 text-navy" /> {label}
                </Link>
              ))}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              disabled
              placeholder="Assistant coming soon…"
              className="min-w-0 flex-1 rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-primary-foreground opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      {/*
        Stacked directly above the WhatsApp button (same right edge) rather
        than beside it. The WhatsApp button grows wider on sm+ screens once
        its "Chat with us" label appears, which used to collide with this
        button when they were positioned side by side (Advanced 7 QA §6) —
        stacking vertically avoids any overlap regardless of either
        button's width, on desktop, tablet, or mobile.
      */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Salem Assistant"
        className="fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full gradient-accent text-navy-deep shadow-lift transition-transform hover:scale-[1.06] sm:bottom-28 sm:right-6"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    </>
  );
}
