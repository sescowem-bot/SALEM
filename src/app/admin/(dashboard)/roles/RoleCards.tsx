"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { updateRolePermissionsAction, type ActionState } from "./actions";
import { PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_LABELS, type Permission, type StaffRole } from "@/lib/auth/permissions";

const initial: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

/**
 * One editable role card: a checkbox per permission, grouped by resource
 * area, with its own save action. super_admin never renders this — see
 * RoleCard below — it always has every permission and isn't editable, so a
 * bad edit here can never lock every admin out of the system.
 */
export function EditableRoleCard({ role, initialPermissions }: { role: StaffRole; initialPermissions: Permission[] }) {
  const [state, action] = useActionState(updateRolePermissionsAction, initial);
  const [checked, setChecked] = useState<Set<Permission>>(new Set(initialPermissions));

  function toggle(permission: Permission) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  return (
    <form action={action} className="surface-card p-6">
      <input type="hidden" name="role" value={role} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">{ROLE_LABELS[role]}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {checked.size} permission{checked.size === 1 ? "" : "s"}
          </p>
        </div>
        <SaveButton />
      </div>

      {state.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>}
      {state.ok && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">Saved.</p>}

      <div className="mt-4 space-y-4">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.label}>
            <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
            <div className="mt-2 space-y-1.5">
              {group.permissions.map((permission) => (
                <label key={permission} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary">
                  <input
                    type="checkbox"
                    name="permission"
                    value={permission}
                    checked={checked.has(permission)}
                    onChange={() => toggle(permission)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-navy accent-navy"
                  />
                  <span className="text-navy-deep">{PERMISSION_LABELS[permission]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}

/** Read-only role card — used for super_admin, and for any viewer who isn't super_admin (view-only per the RLS/app-layer write gate). */
export function ReadOnlyRoleCard({ role, permissions, note }: { role: StaffRole; permissions: Permission[]; note?: string }) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-sm font-semibold text-navy-deep">{ROLE_LABELS[role]}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {permissions.length} permission{permissions.length === 1 ? "" : "s"}
        {note ? ` · ${note}` : ""}
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {permissions.map((p) => (
          <li key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-navy-deep">
            <Check className="h-3 w-3 text-cyan" />
            {PERMISSION_LABELS[p]}
          </li>
        ))}
      </ul>
    </div>
  );
}
