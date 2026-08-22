"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Search, UserPlus, X, User } from "lucide-react";
import { searchPatientsAction, registerPatientAction, type ActionState } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

const initial: ActionState = {};

function RegisterPatientForm({ onDone }: { onDone: () => void }) {
  const [state, action] = useActionState(registerPatientAction, initial);
  return (
    <form action={action} className="surface-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-deep">Register a new patient</h3>
        <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Full name
          <input name="fullName" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Sex
          <select name="sex" className={fieldClass} defaultValue="">
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Date of birth
          <input name="dateOfBirth" type="date" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Phone
          <input name="phone" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Email
          <input name="email" type="email" className={fieldClass} />
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton label="Register patient" />
    </form>
  );
}

export function PatientsClient({ initialPatients, canRegister }: { initialPatients: Patient[]; canRegister: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[] | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [showRegister, setShowRegister] = useState(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setResults(null);
      return;
    }
    startSearch(async () => {
      setResults(await searchPatientsAction(value));
    });
  }

  const list = results ?? initialPatients;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3.5 text-sm text-navy-deep outline-none focus:border-cyan"
          />
        </span>
        {canRegister ? (
          <button
            onClick={() => setShowRegister((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
          >
            <UserPlus className="h-4 w-4 shrink-0" /> Register patient
          </button>
        ) : null}
      </div>

      {showRegister ? <RegisterPatientForm onDone={() => setShowRegister(false)} /> : null}

      {isSearching ? <p className="text-sm text-muted-foreground">Searching…</p> : null}

      {list.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          {results !== null ? "No patients match that search." : "No patients registered yet."}
        </p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/admin/patients/${p.id}`}
              className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-navy-deep">{p.full_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.sex ?? "Sex not on file"} {p.date_of_birth ? `· ${p.date_of_birth}` : ""}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                {p.phone ?? p.email ?? "No contact on file"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
