"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Home } from "lucide-react";
import { HOME_COLLECTION_TIME_SLOTS } from "@/lib/bookingConstants";
import { requestHomeCollectionAction, type HomeCollectionState } from "./actions";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initialState: HomeCollectionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 sm:w-auto"
    >
      <Home className="h-4 w-4 shrink-0" /> {pending ? "Submitting\u2026" : "Request a home visit"}
    </button>
  );
}

export function HomeCollectionFormClient() {
  const [state, formAction] = useActionState(requestHomeCollectionAction, initialState);

  if (state.bookingReference) {
    return (
      <div className="surface-card p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-navy">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-navy-deep">Request received</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your reference number is below. Our team will confirm your visit shortly.
        </p>
        <p className="mt-4 rounded-xl border border-cyan/40 bg-accent p-4 font-mono text-base font-semibold text-navy-deep">
          {state.bookingReference}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-navy-deep">Request a home visit</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tell us where and when, and a phlebotomist will confirm your visit.
      </p>

      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Full name
          <input className={fieldClass} name="fullName" placeholder="Your full name" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Phone number
          <input className={fieldClass} name="phone" placeholder="+234 …" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Email address (optional)
          <input className={fieldClass} name="email" type="email" placeholder="you@email.com" />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Test or panel requested
          <input className={fieldClass} name="testOrPackage" placeholder="e.g. Full Blood Count" />
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Home address
          <textarea rows={2} className={fieldClass} name="address" placeholder="Street, area, city" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Preferred date
          <input className={fieldClass} name="preferredDate" type="date" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Preferred time
          <select className={fieldClass} name="preferredTime" required defaultValue="">
            <option value="" disabled>
              Choose a window
            </option>
            {HOME_COLLECTION_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Notes (optional)
          <textarea rows={3} className={fieldClass} name="notes" placeholder="Accessibility needs, fasting status…" />
        </label>

        {state.error ? <p className="text-sm font-medium text-destructive sm:col-span-2">{state.error}</p> : null}

        <div className="sm:col-span-2">
          <SubmitButton />
        </div>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">
        Prefer to talk it through?{" "}
        <Link href="/contact" className="font-semibold text-purple hover:text-navy">
          Contact us
        </Link>
      </p>
    </div>
  );
}
