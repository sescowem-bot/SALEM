"use client";

import { useActionState, useEffect, useState } from "react";
import { updateHomeCollectionStatusAction, assignPhlebotomistAction, type ActionState } from "./actions";

const STATUSES = ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"] as const;
const initial: ActionState = {};

export function HomeCollectionStatusForm({ requestId, status }: { requestId: string; status: string }) {
  const [state, action, isPending] = useActionState(updateHomeCollectionStatusAction, initial);
  // Controlled select — see AppointmentStatusForm.tsx for why: React 19
  // resets uncontrolled form fields to their first option after every
  // action submission, which made this dropdown visually snap back to
  // "pending" even though the underlying status update had succeeded.
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
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function AssignPhlebotomistForm({
  requestId,
  phlebotomists,
  assignedId,
}: {
  requestId: string;
  phlebotomists: { id: string; full_name: string }[];
  assignedId?: string | null;
}) {
  const [state, action, isPending] = useActionState(assignPhlebotomistAction, initial);
  // Same controlled-select fix as above — an unassigned-vs-assigned select
  // is even more visible when it wrongly resets, since it snaps back to
  // the "Assign phlebotomist" placeholder after a successful assignment.
  const [value, setValue] = useState(assignedId ?? "");
  useEffect(() => setValue(assignedId ?? ""), [assignedId]);

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <select
        name="phlebotomistId"
        value={value}
        disabled={isPending}
        onChange={(e) => {
          setValue(e.target.value);
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-navy-deep outline-none focus:border-cyan disabled:opacity-50"
      >
        <option value="" disabled>
          Assign phlebotomist
        </option>
        {phlebotomists.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}
