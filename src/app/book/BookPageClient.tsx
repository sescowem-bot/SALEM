"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, MapPin, Home, ShieldCheck, Check } from "lucide-react";
import { siteConfig } from "@/data/siteContent";

const steps = ["Test", "Date", "Location", "Details", "Review", "Confirm"];
const times = ["7:30 am", "9:00 am", "10:30 am", "12:00 pm", "2:00 pm", "4:30 pm"];
const days = [
  { d: "Mon", n: "11" },
  { d: "Tue", n: "12" },
  { d: "Wed", n: "13" },
  { d: "Thu", n: "14" },
  { d: "Fri", n: "15" },
  { d: "Sat", n: "16" },
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

export function BookPageClient() {
  const [selectedDay, setSelectedDay] = useState(2);
  const [selectedTime, setSelectedTime] = useState(1);
  const [location, setLocation] = useState<"lab" | "home">("lab");

  return (
    <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i <= 1
                        ? "bg-navy text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i < 1 ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${i <= 1 ? "text-navy-deep" : "text-muted-foreground"}`}
                  >
                    {s}
                  </span>
                </span>
                {i < steps.length - 1 ? (
                  <span className="hidden h-px w-8 bg-border sm:block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <div className="surface-card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy-deep">Choose a date and time</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Pick a day that works for you</p>

              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {days.map((day, i) => (
                  <button
                    key={day.n}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                      i === selectedDay
                        ? "border-cyan bg-accent text-navy-deep"
                        : "border-border text-muted-foreground hover:border-cyan hover:bg-accent"
                    }`}
                  >
                    <span className="block text-[0.7rem] font-medium uppercase tracking-wide">
                      {day.d}
                    </span>
                    <span className="mt-1 block text-lg font-semibold text-navy-deep">{day.n}</span>
                  </button>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Available slots
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {times.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(i)}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                      i === selectedTime
                        ? "bg-navy text-primary-foreground"
                        : "border border-border text-navy hover:border-cyan hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Where should we test you?
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "lab" as const,
                    icon: MapPin,
                    t: "Walk in to the lab",
                    s: siteConfig.address.line1,
                  },
                  {
                    key: "home" as const,
                    icon: Home,
                    t: "Home collection",
                    s: "Phlebotomist visits you",
                  },
                ].map(({ key, icon: Icon, t, s }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLocation(key)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      location === key ? "border-cyan bg-accent" : "border-border hover:border-cyan"
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy-deep">{t}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{s}</span>
                    </span>
                  </button>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Patient details
              </h3>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <label className="block text-sm font-medium text-navy-deep">
                  Full name
                  <input className={fieldClass} placeholder="Your full name" name="fullName" />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Phone number
                  <input className={fieldClass} placeholder="+234 …" name="phone" />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Email address
                  <input className={fieldClass} placeholder="you@email.com" name="email" />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Date of birth
                  <input className={fieldClass} placeholder="DD / MM / YYYY" name="dob" />
                </label>
                <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                  Test or panel requested
                  <input
                    className={fieldClass}
                    placeholder="e.g. Full Blood Count, or attach your doctor's request"
                    name="testRequested"
                  />
                </label>
                <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                  Notes for the laboratory (optional)
                  <textarea
                    rows={3}
                    className={fieldClass}
                    placeholder="Referring doctor, fasting status, accessibility needs…"
                    name="notes"
                  />
                </label>
              </form>
            </div>

            <aside className="surface-card p-6 lg:sticky lg:top-28">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Booking summary
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  [
                    "Date",
                    days[selectedDay] ? `${days[selectedDay].d} ${days[selectedDay].n}` : "—",
                  ],
                  ["Time", times[selectedTime] ?? "—"],
                  ["Location", location === "lab" ? "Walk-in laboratory" : "Home collection"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 text-right font-medium text-navy-deep">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Pricing is confirmed by our front desk once your test or package is selected.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
              >
                <CalendarCheck className="h-4 w-4 shrink-0" /> Review &amp; confirm
              </button>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                Payment is completed at the laboratory or on collection. Your details stay
                confidential.
              </p>
              <Link
                href="/contact"
                className="mt-4 block text-center text-xs font-semibold text-purple hover:text-navy"
              >
                Prefer to speak with someone? Contact us
              </Link>
            </aside>
          </div>
        </div>
      </section>
  );
}
