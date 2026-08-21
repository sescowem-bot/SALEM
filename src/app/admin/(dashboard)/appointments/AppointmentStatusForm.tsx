"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { updateAppointmentStatusAction, type ActionState } from "./actions";

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"] as const;
const initial: ActionState = {};

export function AppointmentStatusForm({ requestId, status }: { requestId: string; status: string }) {
  const [state, action, isPending] = useActionState(updateAppointmentStatusAction, initial);
  // Controlled, not defaultValue: React 19 resets uncontrolled form fields
  // (including <select>, back to its FIRST <option> — "new" here) after
  // every action submission, regardless of defaultValue. That's the actual
  // cause of the "status resets to new" report — the database write was
  // already succeeding; only the dropdown's displayed value was wrong.
  // Keeping our own `value` in state sidesteps React's automatic
  // uncontrolled-field reset entirely, and the effect below re-syncs it if
  // the server-confirmed status ever changes from elsewhere (e.g. another
  // admin, or a fresh page load with different props).
  const [value, setValue] = useState(status);
  useEffect(() => setValue(status), [status]);

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <select
        name="status"
        value={value}
        disabled={isPending}
        onChange={(e) => {
          setValue(e.target.value);
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-navy-deep outline-none focus:border-cyan disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}
