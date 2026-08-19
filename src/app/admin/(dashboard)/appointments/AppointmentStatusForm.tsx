"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateAppointmentStatusAction, type ActionState } from "./actions";

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"] as const;
const initial: ActionState = {};

function StatusSelect({ status }: { status: string }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="status"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-navy-deep outline-none focus:border-cyan disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function AppointmentStatusForm({ requestId, status }: { requestId: string; status: string }) {
  const [state, action] = useActionState(updateAppointmentStatusAction, initial);
  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <StatusSelect status={status} />
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}
