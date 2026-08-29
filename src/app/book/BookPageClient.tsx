"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CalendarCheck, MapPin, Home, ShieldCheck, Check, Info } from "lucide-react";
import { siteConfig } from "@/data/siteContent";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/bookingConstants";
import { bookAppointmentAction, getSlotAvailabilityAction, type BookState } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Test = Database["public"]["Tables"]["tests"]["Row"];

const steps = ["Test", "Date", "Location", "Details", "Confirm"];

function nextDays(count: number) {
  const out: { label: string; dayNum: string; iso: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: String(d.getDate()),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return out;
}

/** "9:00 AM" / "1:00 PM" -> minutes since midnight, for same-day notice-window comparisons. */
function parseSlotMinutes(slot: string): number {
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (/PM/i.test(match[3])) hours += 12;
  return hours * 60 + Number(match[2]);
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initialState: BookState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
    >
      <CalendarCheck className="h-4 w-4 shrink-0" /> {pending ? "Submitting\u2026" : "Confirm booking"}
    </button>
  );
}

export function BookPageClient({
  tests,
  preselectedTestName,
  preselectedTest,
  bookingWindowDays = 14,
  bookingMinNoticeHours = 2,
}: {
  tests: Test[];
  preselectedTestName?: string;
  preselectedTest?: Test;
  bookingWindowDays?: number;
  bookingMinNoticeHours?: number;
}) {
  const days = nextDays(Math.min(Math.max(bookingWindowDays, 1), 14));

  // Admin-controlled minimum notice (Advanced 7 QA §2 / Advanced 8 §1):
  // only meaningful for "today" — any other day in the window is already
  // hours out. A slot earlier than "now + notice hours" is not
  // selectable; this is a legitimate "already in the past / too soon to
  // staff" restriction, unlike the capacity-based rejection removed
  // earlier, which blocked a slot simply because another patient had
  // already picked it.
  const isPastNotice = (dayIndex: number, timeIndex: number) => {
    if (days[dayIndex]?.iso !== days[0].iso) return false;
    const cutoffMinutes = new Date().getHours() * 60 + new Date().getMinutes() + bookingMinNoticeHours * 60;
    return parseSlotMinutes(APPOINTMENT_TIME_SLOTS[timeIndex]) < cutoffMinutes;
  };
  const firstBookableTimeIndex = (dayIndex: number) => {
    const idx = APPOINTMENT_TIME_SLOTS.findIndex((_, i) => !isPastNotice(dayIndex, i));
    return idx === -1 ? 0 : idx;
  };

  const [selectedDay, setSelectedDayState] = useState(0);
  // Start with a stable SSR-safe value. The mount effect below corrects
  // today's selection if the first slot is already inside the notice window;
  // this avoids a time-dependent server/client hydration mismatch.
  const [selectedTime, setSelectedTime] = useState(0);
  const [location, setLocation] = useState<"lab" | "home">("lab");
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();

  const [state, formAction] = useActionState(bookAppointmentAction, initialState);

  // Changing day is a user event, not a mount effect — safe to also
  // correct the time selection here directly, rather than in a
  // useEffect, if the previously-selected time would now be in the past.
  function setSelectedDay(dayIndex: number) {
    setSelectedDayState(dayIndex);
    if (isPastNotice(dayIndex, selectedTime)) {
      setSelectedTime(firstBookableTimeIndex(dayIndex));
    }
  }

  useEffect(() => {
    if (isPastNotice(selectedDay, selectedTime)) {
      setSelectedTime(firstBookableTimeIndex(selectedDay));
    }

    startTransition(async () => {
      const availability = await getSlotAvailabilityAction(days[selectedDay].iso);
      const counts: Record<string, number> = {};
      for (const { slot, bookedCount } of availability) counts[slot] = bookedCount;
      setSlotCounts(counts);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  if (state.bookingReference) {
    return (
      <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-6">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-navy">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-navy-deep">Booking received</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your reference number is below. Our front desk will confirm your slot shortly.
          </p>
          <p className="mt-4 rounded-xl border border-cyan/40 bg-accent p-4 font-mono text-base font-semibold text-navy-deep">
            {state.bookingReference}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{s}</span>
                </span>
                {i < steps.length - 1 ? (
                  <span className="hidden h-px w-8 bg-border sm:block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>

          <form action={formAction} className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <input type="hidden" name="preferredDate" value={days[selectedDay].iso} />
            <input type="hidden" name="preferredTime" value={APPOINTMENT_TIME_SLOTS[selectedTime]} />
            <input type="hidden" name="locationType" value={location} />

            <div className="surface-card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy-deep">Choose a date and time</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Pick a day that works for you</p>

              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {days.map((day, i) => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                      i === selectedDay
                        ? "border-cyan bg-accent text-navy-deep"
                        : "border-border text-muted-foreground hover:border-cyan hover:bg-accent"
                    }`}
                  >
                    <span className="block text-[0.7rem] font-medium uppercase tracking-wide">{day.label}</span>
                    <span className="mt-1 block text-lg font-semibold text-navy-deep">{day.dayNum}</span>
                  </button>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Available slots
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {APPOINTMENT_TIME_SLOTS.map((t, i) => {
                  // Booked count is shown as a "how busy" indicator only —
                  // never disabled. Multiple patients can request the same
                  // date/time; the front desk coordinates actual capacity
                  // when reviewing requests (Advanced 7 QA §2).
                  const bookedCount = slotCounts[t] ?? 0;
                  const busy = bookedCount >= 3;
                  // Unlike the capacity indicator above, a slot inside the
                  // admin-configured minimum-notice window genuinely isn't
                  // bookable (there isn't enough lead time to staff it), so
                  // this one IS disabled — a legitimate scheduling-rule
                  // restriction, not a same-slot conflict rejection.
                  const tooSoon = isPastNotice(selectedDay, i);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={tooSoon}
                      onClick={() => setSelectedTime(i)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        tooSoon
                          ? "cursor-not-allowed border border-border text-muted-foreground/50 line-through"
                          : i === selectedTime
                            ? "bg-navy text-primary-foreground"
                            : "border border-border text-navy hover:border-cyan hover:bg-accent"
                      }`}
                    >
                      {t}
                      {!tooSoon && busy ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                            i === selectedTime ? "bg-white/20" : "bg-accent text-navy-deep"
                          }`}
                        >
                          Popular
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                You can still request a &quot;Popular&quot; time slot — our front desk will confirm the exact time with you.
                {bookingMinNoticeHours > 0 ? ` Same-day bookings need at least ${bookingMinNoticeHours} hour${bookingMinNoticeHours === 1 ? "" : "s"}' notice.` : ""}
              </p>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-purple">
                Where should we test you?
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { key: "lab" as const, icon: MapPin, t: "Walk in to the lab", s: siteConfig.address.line1 },
                  { key: "home" as const, icon: Home, t: "Home collection", s: "Phlebotomist visits you" },
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-navy-deep">
                  Full name
                  <input className={fieldClass} placeholder="Your full name" name="fullName" required />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Phone number
                  <input className={fieldClass} placeholder="+234 …" name="phone" required />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Email address (optional)
                  <input className={fieldClass} placeholder="you@email.com" name="email" type="email" />
                </label>
                <label className="block text-sm font-medium text-navy-deep">
                  Test or panel requested
                  <input
                    className={fieldClass}
                    placeholder="e.g. Fasting Blood Sugar"
                    name="testOrPackage"
                    defaultValue={preselectedTestName}
                    list="salem-test-list"
                  />
                  <datalist id="salem-test-list">
                    {tests.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                </label>
                {preselectedTest &&
                (preselectedTest.preparation_info || preselectedTest.what_to_avoid || preselectedTest.important_notes) ? (
                  <div className="sm:col-span-2 space-y-3 rounded-2xl border border-cyan/30 bg-accent/40 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-deep">
                      <Info className="h-4 w-4 shrink-0 text-navy" /> Before your {preselectedTest.name} appointment
                    </p>
                    {preselectedTest.preparation_info ? (
                      <div>
                        <p className="text-xs font-semibold text-navy-deep">Preparation</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                          {preselectedTest.preparation_info}
                        </p>
                      </div>
                    ) : null}
                    {preselectedTest.what_to_avoid ? (
                      <div>
                        <p className="text-xs font-semibold text-navy-deep">What to do / avoid</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                          {preselectedTest.what_to_avoid}
                        </p>
                      </div>
                    ) : null}
                    {preselectedTest.important_notes ? (
                      <div>
                        <p className="text-xs font-semibold text-navy-deep">Important notes</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                          {preselectedTest.important_notes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                  Notes for the laboratory (optional)
                  <textarea
                    rows={3}
                    className={fieldClass}
                    placeholder="Referring doctor, fasting status, accessibility needs…"
                    name="notes"
                  />
                </label>
              </div>
            </div>

            <aside className="surface-card p-6 lg:sticky lg:top-28">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-purple">Booking summary</h2>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ["Date", `${days[selectedDay].label} ${days[selectedDay].dayNum}`],
                  ["Time", APPOINTMENT_TIME_SLOTS[selectedTime]],
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

              {state.error ? <p className="mt-4 text-sm font-medium text-destructive">{state.error}</p> : null}

              <SubmitButton />

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                Payment is completed at the laboratory or on collection. Your details stay confidential.
              </p>
              <Link
                href="/contact"
                className="mt-4 block text-center text-xs font-semibold text-purple hover:text-navy"
              >
                Prefer to speak with someone? Contact us
              </Link>
            </aside>
          </form>
        </div>
      </section>
  );
}
