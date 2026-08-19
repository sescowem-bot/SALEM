"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateHomeCollectionStatusAction, assignPhlebotomistAction, type ActionState } from "./actions";

const STATUSES = ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"] as const;
const initial: ActionState = {};

function Select({ status }: { status: string }) {
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
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

export function HomeCollectionStatusForm({ requestId, status }: { requestId: string; status: string }) {
  const [state, action] = useActionState(updateHomeCollectionStatusAction, initial);
  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <Select status={status} />
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

function AssignSelect({ phlebotomists }: { phlebotomists: { id: string; full_name: string }[] }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="phlebotomistId"
      defaultValue=""
      disabled={pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
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
  );
}

export function AssignPhlebotomistForm({
  requestId,
  phlebotomists,
}: {
  requestId: string;
  phlebotomists: { id: string; full_name: string }[];
}) {
  const [state, action] = useActionState(assignPhlebotomistAction, initial);
  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <AssignSelect phlebotomists={phlebotomists} />
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}
