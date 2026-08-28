"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateHomeCollectionStatusAction,
  assignPhlebotomistAction,
  updateHomeCollectionPaymentAction,
  type ActionState,
} from "./actions";

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

const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "waived"] as const;

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
 * Admin-controlled payment tracking (Advanced 7 QA §3). Deliberately just a
 * status + free-text amount/notes — no payment gateway assumed, so staff
 * can reflect whatever actually happened (cash on visit, bank transfer,
 * waived, etc.) without the UI forcing one workflow.
 */
export function HomeCollectionPaymentForm({
  requestId,
  paymentStatus,
  paymentAmountNgn,
  paymentNotes,
}: {
  requestId: string;
  paymentStatus: string;
  paymentAmountNgn: number | null;
  paymentNotes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateHomeCollectionPaymentAction, initial);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
          paymentStatus === "paid"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : paymentStatus === "waived"
              ? "border-border bg-secondary text-muted-foreground"
              : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        Payment: {paymentStatus}
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 w-full max-w-xs space-y-2 rounded-xl border border-border bg-secondary/60 p-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="block text-[0.65rem] font-medium text-muted-foreground">
        Payment status
        <select
          name="paymentStatus"
          defaultValue={paymentStatus}
          className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs capitalize text-navy-deep outline-none focus:border-cyan"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[0.65rem] font-medium text-muted-foreground">
        Amount (\u20a6, optional)
        <input
          type="number"
          name="paymentAmountNgn"
          min={0}
          defaultValue={paymentAmountNgn ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-navy-deep outline-none focus:border-cyan"
        />
      </label>
      <label className="block text-[0.65rem] font-medium text-muted-foreground">
        Notes
        <input
          type="text"
          name="paymentNotes"
          placeholder="e.g. Paid by transfer on arrival"
          defaultValue={paymentNotes ?? ""}
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
