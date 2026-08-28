"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarClock } from "lucide-react";
import { rescheduleAppointmentAction, type ActionState } from "./actions";

const initial: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Saving\u2026" : "Save"}
    </button>
  );
}

/**
 * Admin reschedule + internal-notes control for a single appointment
 * request. Collapsed by default (a row per booking already shows enough),
 * expands into a small inline form. Rescheduling writes to
 * `rescheduled_date`/`rescheduled_time` — the patient's original
 * `preferred_date`/`preferred_time` is never overwritten.
 */
export function AppointmentRescheduleForm({
  requestId,
  rescheduledDate,
  rescheduledTime,
  adminNotes,
}: {
  requestId: string;
  rescheduledDate: string | null;
  rescheduledTime: string | null;
  adminNotes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(rescheduleAppointmentAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"
      >
        <CalendarClock className="h-3.5 w-3.5 shrink-0" />
        {rescheduledDate ? "Rescheduled — edit" : "Reschedule / notes"}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-2 w-full max-w-sm space-y-2 rounded-xl border border-border bg-secondary/60 p-3"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[0.65rem] font-medium text-muted-foreground">
          New date
          <input
            type="date"
            name="rescheduledDate"
            defaultValue={rescheduledDate ?? ""}
            className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-navy-deep outline-none focus:border-cyan"
          />
        </label>
        <label className="block text-[0.65rem] font-medium text-muted-foreground">
          New time
          <input
            type="text"
            name="rescheduledTime"
            placeholder="e.g. 1:00 PM"
            defaultValue={rescheduledTime ?? ""}
            className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-navy-deep outline-none focus:border-cyan"
          />
        </label>
      </div>
      <label className="block text-[0.65rem] font-medium text-muted-foreground">
        Internal notes (staff only)
        <textarea
          name="adminNotes"
          rows={2}
          defaultValue={adminNotes ?? ""}
          placeholder="Confirmed by phone, patient asked to move earlier…"
          className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-navy-deep outline-none focus:border-cyan"
        />
      </label>
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-2">
        <SaveButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
        >
          Close
        </button>
      </div>
    </form>
  );
}
