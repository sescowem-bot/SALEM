"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePatientAction, type ActionState } from "../actions";
import type { Database } from "@/lib/supabase/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const initial: ActionState = {};

export function PatientEditForm({ patient }: { patient: Patient }) {
  const [state, action] = useActionState(updatePatientAction, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-6">
      <input type="hidden" name="patientId" value={patient.id} />
      <h2 className="text-sm font-semibold text-navy-deep">Patient details</h2>
      <label className="block text-sm font-medium text-navy-deep">
        Full name
        <input name="fullName" required defaultValue={patient.full_name} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-navy-deep">
        Sex
        <select name="sex" defaultValue={patient.sex ?? ""} className={fieldClass}>
          <option value="">Not specified</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-navy-deep">
        Date of birth
        <input name="dateOfBirth" type="date" defaultValue={patient.date_of_birth ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-navy-deep">
        Phone
        <input name="phone" defaultValue={patient.phone ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-navy-deep">
        Email
        <input name="email" type="email" defaultValue={patient.email ?? ""} className={fieldClass} />
      </label>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
