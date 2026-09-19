"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, ChevronDown, ListTree, Pencil, Plus, Power, X } from "lucide-react";
import {
  saveDepartmentAction,
  setDepartmentStatusAction,
  saveDepartmentFunctionAction,
  setDepartmentFunctionStatusAction,
  type ActionState,
} from "./actions";
import type { DepartmentWithFunctions } from "@/lib/data/departments";
import type { Database } from "@/lib/supabase/database.types";

type DepartmentFunction = Database["public"]["Tables"]["department_functions"]["Row"];

const initial: ActionState = {};

const field =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-navy-deep outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/15";

function Submit({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:opacity-50"
    >
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatusToggle({ id, active, hiddenField, action }: { id: string; active: boolean; hiddenField: string; action: typeof setDepartmentStatusAction }) {
  const [, formAction] = useActionState(action, initial);
  return (
    <form action={formAction}>
      <input type="hidden" name={hiddenField} value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        title={active ? "Deactivate" : "Reactivate"}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"
      >
        <Power className="h-3.5 w-3.5" />
        {active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

function DepartmentForm({
  department,
  onDone,
}: {
  department?: DepartmentWithFunctions;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveDepartmentAction, initial);
  return (
    <form action={action} className="rounded-2xl border border-border bg-secondary/60 p-4">
      {department ? <input type="hidden" name="departmentId" value={department.id} /> : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
          <Building2 className="h-4 w-4" /> {department ? `Edit ${department.name}` : "New department"}
        </div>
        <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <label className="mt-3 block text-sm font-medium text-navy-deep">
        Name
        <input name="name" required maxLength={150} defaultValue={department?.name ?? ""} placeholder="e.g. Finance" className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium text-navy-deep">
        Description
        <input name="description" maxLength={500} defaultValue={department?.description ?? ""} placeholder="Short description (optional)" className={field} />
      </label>
      {state.error ? <p className="mt-2 text-xs text-destructive">{state.error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Submit label={department ? "Save changes" : "Add department"} />
        <button type="button" onClick={onDone} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}

function FunctionForm({
  fn,
  departments,
  defaultDepartmentId,
  onDone,
}: {
  fn?: DepartmentFunction;
  departments: DepartmentWithFunctions[];
  defaultDepartmentId?: string;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveDepartmentFunctionAction, initial);
  return (
    <form action={action} className="rounded-2xl border border-border bg-secondary/60 p-4">
      {fn ? <input type="hidden" name="functionId" value={fn.id} /> : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy-deep">
          <ListTree className="h-4 w-4" /> {fn ? `Edit ${fn.name}` : "New function"}
        </div>
        <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Name
          <input name="name" required maxLength={150} defaultValue={fn?.name ?? ""} placeholder="e.g. Phlebotomy" className={field} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Department
          <select name="departmentId" required defaultValue={fn?.department_id ?? defaultDepartmentId ?? ""} className={field}>
            <option value="" disabled>
              Choose a department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {!d.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Description
          <input name="description" maxLength={500} defaultValue={fn?.description ?? ""} placeholder="Short description (optional)" className={field} />
        </label>
      </div>
      {state.error ? <p className="mt-2 text-xs text-destructive">{state.error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Submit label={fn ? "Save changes" : "Add function"} />
        <button type="button" onClick={onDone} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}

function DepartmentCard({
  department,
  allDepartments,
}: {
  department: DepartmentWithFunctions;
  allDepartments: DepartmentWithFunctions[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingFunction, setAddingFunction] = useState(false);
  const [editingFunctionId, setEditingFunctionId] = useState<string | null>(null);

  return (
    <div className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 items-start gap-2 text-left">
          <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-navy-deep">{department.name}</h3>
              <StatusBadge active={department.is_active} />
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
                {department.functions.length} function{department.functions.length === 1 ? "" : "s"}
              </span>
            </div>
            {department.description ? <p className="mt-1 text-xs text-muted-foreground">{department.description}</p> : null}
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border"
            aria-label={`Edit ${department.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <StatusToggle id={department.id} active={department.is_active} hiddenField="departmentId" action={setDepartmentStatusAction} />
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <DepartmentForm department={department} onDone={() => setEditing(false)} />
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {department.functions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No functions assigned to this department yet.</p>
          ) : (
            <div className="grid gap-2">
              {department.functions.map((fn) => (
                <div key={fn.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-navy-deep">{fn.name}</p>
                        <StatusBadge active={fn.is_active} />
                      </div>
                      {fn.description ? <p className="mt-0.5 text-xs text-muted-foreground">{fn.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFunctionId(editingFunctionId === fn.id ? null : fn.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                        aria-label={`Edit ${fn.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <StatusToggle id={fn.id} active={fn.is_active} hiddenField="functionId" action={setDepartmentFunctionStatusAction} />
                    </div>
                  </div>
                  {editingFunctionId === fn.id ? (
                    <div className="mt-3">
                      <FunctionForm fn={fn} departments={allDepartments} onDone={() => setEditingFunctionId(null)} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {addingFunction ? (
            <FunctionForm departments={allDepartments} defaultDepartmentId={department.id} onDone={() => setAddingFunction(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAddingFunction(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Add function to {department.name}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DepartmentsClient({ departments }: { departments: DepartmentWithFunctions[] }) {
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return departments;
    const term = q.toLowerCase();
    return departments.filter(
      (d) => d.name.toLowerCase().includes(term) || d.functions.some((fn) => fn.name.toLowerCase().includes(term))
    );
  }, [departments, q]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search departments or functions…"
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-cyan lg:max-w-sm"
        />
        <button
          type="button"
          onClick={() => setAddingDepartment((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <Plus className="h-4 w-4" /> New department
        </button>
      </div>

      {addingDepartment ? <DepartmentForm onDone={() => setAddingDepartment(false)} /> : null}

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-muted-foreground">No departments match your search.</div>
        ) : (
          filtered.map((department) => <DepartmentCard key={department.id} department={department} allDepartments={departments} />)
        )}
      </div>
    </div>
  );
}
