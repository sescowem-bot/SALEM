"use client";

import { useEffect, useState, useActionState } from "react";
import { updateContactStatusAction, type ActionState } from "./actions";

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"] as const;
const initial: ActionState = {};

export function ContactStatusForm({ submissionId, status }: { submissionId: string; status: string }) {
  const [state, action, isPending] = useActionState(updateContactStatusAction, initial);
  const [value, setValue] = useState(status);
  useEffect(() => setValue(status), [status]);

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="submissionId" value={submissionId} />
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
