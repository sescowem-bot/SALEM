"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/bookingConstants";
import { createAppointmentAction, type ActionState } from "./actions";

const initial: ActionState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Saving\u2026" : "Add appointment"}
    </button>
  );
}

/**
 * Lets front desk / admin log a walk-in or phone booking directly, instead
 * of only being able to manage requests that came in through the public
 * booking form (Advanced 7.1 — this action was previously missing
 * entirely from the Appointments admin page).
 */
export function CreateAppointmentForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createAppointmentAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-navy-deep"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" /> Add appointment
      </button>
    );
  }

  return (
    <form action={action} className="surface-card w-full space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-deep">Log a walk-in or phone booking</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-muted-foreground hover:text-navy">
          Cancel
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Full name
          <input name="fullName" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Phone
          <input name="phone" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Email (optional)
          <input type="email" name="email" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Test / package
          <input name="testOrPackage" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Date
          <input type="date" name="preferredDate" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Time
          <select name="preferredTime" required className={fieldClass}>
            {APPOINTMENT_TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Location
          <select name="locationType" required className={fieldClass} defaultValue="lab">
            <option value="lab">Walk-in at lab</option>
            <option value="home">Home collection</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Notes
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
      </div>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
