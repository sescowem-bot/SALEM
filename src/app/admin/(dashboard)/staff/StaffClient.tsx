"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, Search, Pencil, X } from "lucide-react";
import { createStaffAction, updateStaffAction, setStaffStatusAction, type ActionState } from "./actions";
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/auth/permissions";
import type { Database } from "@/lib/supabase/database.types";

type StaffProfile = Database["public"]["Tables"]["staff_profiles"]["Row"];

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

function AddStaffForm({ onDone }: { onDone: () => void }) {
  const [state, action] = useActionState(createStaffAction, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-deep">Add staff account</h3>
        <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Full name
          <input name="fullName" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Role
          <select name="role" required className={fieldClass} defaultValue="frontdesk">
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Email
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Temporary password
          <input name="password" type="password" required minLength={8} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Designation
          <input name="designation" className={fieldClass} placeholder="e.g. Senior Medical Lab Scientist" />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Qualification
          <input name="qualification" className={fieldClass} placeholder="e.g. AMLSN, BMLS" />
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Phone
          <input name="phone" className={fieldClass} />
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton label="Create account" />
    </form>
  );
}

function EditStaffForm({ profile, onDone }: { profile: StaffProfile; onDone: () => void }) {
  const [state, action] = useActionState(updateStaffAction, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-6">
      <input type="hidden" name="staffId" value={profile.id} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-deep">Edit {profile.full_name}</h3>
        <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Full name
          <input name="fullName" required defaultValue={profile.full_name} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Role
          <select name="role" required defaultValue={profile.role} className={fieldClass}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Designation
          <input name="designation" defaultValue={profile.designation ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Qualification
          <input name="qualification" defaultValue={profile.qualification ?? ""} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Phone
          <input name="phone" defaultValue={profile.phone ?? ""} className={fieldClass} />
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton label="Save changes" />
    </form>
  );
}

function StatusToggleForm({ staffId, isActive }: { staffId: string; isActive: boolean }) {
  const [state, action, isPending] = useActionState(setStaffStatusAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="active" value={(!isActive).toString()} />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          isActive
            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {isPending ? "…" : isActive ? "Deactivate" : "Activate"}
      </button>
      {state.error ? <p className="mt-1 text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function StaffClient({
  directory,
  canManage,
  currentUserId,
}: {
  directory: StaffProfile[];
  canManage: boolean;
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active) return false;
      if (q && !s.full_name.toLowerCase().includes(q) && !(s.designation ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [directory, query, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {canManage ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <span className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or designation…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3.5 text-sm text-navy-deep outline-none focus:border-cyan"
              />
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as StaffRole | "all")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan"
            >
              <option value="all">All roles</option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
          >
            <UserPlus className="h-4 w-4 shrink-0" /> Add staff
          </button>
        </div>
      ) : null}

      {showAdd ? <AddStaffForm onDone={() => setShowAdd(false)} /> : null}

      {filtered.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No staff match this search/filter.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {filtered.map((s) => (
            <div key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{s.full_name}</span>
                    {s.id === currentUserId ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-navy">You</span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ${
                        s.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border bg-secondary text-muted-foreground"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {ROLE_LABELS[s.role]} {s.designation ? `· ${s.designation}` : ""}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {s.qualification ?? "No qualification on file"} {s.phone ? `· ${s.phone}` : ""}
                  </span>
                </span>
                {canManage ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                      className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-navy"
                      aria-label="Edit staff"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <StatusToggleForm staffId={s.id} isActive={s.is_active} />
                  </div>
                ) : null}
              </div>
              {editingId === s.id ? (
                <div className="p-5 pt-0">
                  <EditStaffForm profile={s} onDone={() => setEditingId(null)} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
