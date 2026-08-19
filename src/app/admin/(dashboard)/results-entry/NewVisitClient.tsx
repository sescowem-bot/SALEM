"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Search, UserPlus, ClipboardList } from "lucide-react";
import { registerPatientAction, createVisitAction, searchPatientsAction, type ActionState } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type TestCategory = Database["public"]["Tables"]["test_categories"]["Row"];
type Test = Database["public"]["Tables"]["tests"]["Row"];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

function SubmitButton({ label, icon: Icon }: { label: string; icon: typeof UserPlus }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
    >
      <Icon className="h-4 w-4 shrink-0" /> {pending ? "Saving…" : label}
    </button>
  );
}

const initialState: ActionState = {};

export function NewVisitClient({
  categories,
  tests,
  preselectedPatient,
  canRegisterPatients,
  canCreateVisit,
}: {
  categories: TestCategory[];
  tests: Test[];
  preselectedPatient: Patient | null;
  canRegisterPatients: boolean;
  canCreateVisit: boolean;
}) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [showRegister, setShowRegister] = useState(false);

  const [registerState, registerAction] = useActionState(registerPatientAction, initialState);
  const [visitState, visitAction] = useActionState(createVisitAction, initialState);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchPatientsAction(value));
    });
  }

  return (
    <div className="space-y-6">
      {!selectedPatient ? (
        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-navy-deep">1. Find or register a patient</h2>

          <div className="mt-4">
            <label className="block text-sm font-medium text-navy-deep">
              Search by name
              <span className="relative mt-1.5 block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={`${fieldClass} pl-10`}
                  placeholder="Start typing a patient's name…"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                />
              </span>
            </label>

            {isSearching ? <p className="mt-2 text-xs text-muted-foreground">Searching…</p> : null}

            {results.length > 0 ? (
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(p)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-medium text-navy-deep">{p.full_name}</span>
                      <span className="text-xs text-muted-foreground">{p.sex ?? "—"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {canRegisterPatients ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowRegister((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                {showRegister ? "Cancel" : "Register a new patient"}
              </button>

              {showRegister ? (
                <form action={registerAction} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                    Full name
                    <input className={fieldClass} name="fullName" required />
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    Sex
                    <select className={fieldClass} name="sex" defaultValue="">
                      <option value="">Unspecified</option>
                      <option>Female</option>
                      <option>Male</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    Date of birth
                    <input type="date" className={fieldClass} name="dateOfBirth" />
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    Phone
                    <input className={fieldClass} name="phone" />
                  </label>
                  <label className="block text-sm font-medium text-navy-deep">
                    Email
                    <input type="email" className={fieldClass} name="email" />
                  </label>

                  {registerState.error ? (
                    <p className="text-sm font-medium text-destructive sm:col-span-2">{registerState.error}</p>
                  ) : null}

                  <div className="sm:col-span-2">
                    <SubmitButton label="Register patient" icon={UserPlus} />
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="surface-card flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
            <p className="mt-1 text-base font-semibold text-navy-deep">{selectedPatient.full_name}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPatient(null)}
            className="text-sm font-medium text-muted-foreground hover:text-navy"
          >
            Change
          </button>
        </section>
      )}

      {selectedPatient && canCreateVisit ? (
        <form action={visitAction} className="space-y-6">
          <input type="hidden" name="patientId" value={selectedPatient.id} />

          <section className="surface-card p-6 sm:p-8">
            <h2 className="text-base font-semibold text-navy-deep">2. Visit details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-navy-deep">
                Lab number
                <input className={fieldClass} name="labNumber" placeholder="e.g. 034" required />
              </label>
              <label className="block text-sm font-medium text-navy-deep">
                Date collected
                <input type="date" className={fieldClass} name="dateCollected" />
              </label>
              <label className="block text-sm font-medium text-navy-deep">
                Specimen
                <input className={fieldClass} name="specimen" placeholder="e.g. Serum, EDTA whole blood" />
              </label>
              <label className="block text-sm font-medium text-navy-deep sm:col-span-2 lg:col-span-3">
                Request
                <input className={fieldClass} name="request" placeholder="e.g. FBS, BP & PCV" />
              </label>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="text-base font-semibold text-navy-deep">3. Select tests</h2>
            <div className="mt-5 space-y-5">
              {categories.map((category) => {
                const categoryTests = tests.filter((t) => t.category_id === category.id);
                if (categoryTests.length === 0) return null;
                return (
                  <div key={category.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categoryTests.map((test) => (
                        <label
                          key={test.id}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-navy-deep transition-colors has-[:checked]:border-cyan has-[:checked]:bg-accent"
                        >
                          <input type="checkbox" name="testIds" value={test.id} className="accent-cyan" />
                          {test.name}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {visitState.error ? <p className="text-sm font-medium text-destructive">{visitState.error}</p> : null}

          <SubmitButton label="Create visit" icon={ClipboardList} />
        </form>
      ) : null}
    </div>
  );
}
