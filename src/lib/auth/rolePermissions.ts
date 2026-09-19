import "server-only";
import { cache } from "react";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { logAudit } from "@/lib/data/audit";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  STAFF_ROLES,
  type Permission,
  type StaffRole,
} from "./permissions";

/**
 * The live role -> permission matrix, read from public.role_permissions.
 * Memoized per request with React's cache() — the table is read at most
 * once per request no matter how many hasPermission()/getPermissionsForRole()
 * calls happen during it (data-layer checks, nav rendering, page guards all
 * share the one read). A fresh request always re-reads the DB, so an edit
 * made on /admin/roles takes effect immediately for the very next request —
 * no redeploy, no manual cache-busting.
 *
 * super_admin is never read from the DB: it is hardcoded to "all
 * permissions" below, so a bad edit (or an empty/missing table) can never
 * lock every admin out of the system.
 */
export const getRolePermissionsMatrix = cache(async (): Promise<Record<StaffRole, Permission[]>> => {
  const matrix = Object.fromEntries(STAFF_ROLES.map((role) => [role, [] as Permission[]])) as Record<
    StaffRole,
    Permission[]
  >;
  matrix.super_admin = [...ALL_PERMISSIONS];

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("role_permissions").select("role, permission");

  if (error || !data) {
    // Fail safe to the last-known-good hardcoded matrix rather than
    // silently denying every non-super_admin role app-wide.
    console.error("[rolePermissions] failed to read role_permissions, falling back to defaults", error);
    return { ...DEFAULT_ROLE_PERMISSIONS, super_admin: matrix.super_admin };
  }

  for (const row of data) {
    const role = row.role as StaffRole;
    const permission = row.permission as Permission;
    if (matrix[role] && role !== "super_admin") matrix[role].push(permission);
  }
  return matrix;
});

export async function hasPermission(role: StaffRole, permission: Permission): Promise<boolean> {
  if (role === "super_admin") return true;
  const matrix = await getRolePermissionsMatrix();
  return matrix[role]?.includes(permission) ?? false;
}

export async function getPermissionsForRole(role: StaffRole): Promise<Permission[]> {
  if (role === "super_admin") return [...ALL_PERMISSIONS];
  const matrix = await getRolePermissionsMatrix();
  return matrix[role] ?? [];
}

/**
 * Overwrites the full permission set for one role. super_admin-only (both
 * here and in the role_permissions RLS policy — defence in depth), and
 * super_admin's own row set can never be targeted: it must stay
 * unconditionally "all permissions" so the recovery role can't be edited
 * into a lockout.
 *
 * Replaces (rather than diffs) the role's rows so the UI can simply submit
 * "here is the complete set this role should have now".
 */
export async function updateRolePermissions(
  targetRole: StaffRole,
  permissions: Permission[],
  actor: { userId: string; role: StaffRole }
): Promise<void> {
  if (actor.role !== "super_admin") {
    throw new Error("Forbidden: only super_admin can edit the permission matrix.");
  }
  if (targetRole === "super_admin") {
    throw new Error("super_admin always has every permission and cannot be edited.");
  }

  const uniquePermissions = [...new Set(permissions)].filter((p): p is Permission =>
    (ALL_PERMISSIONS as readonly string[]).includes(p)
  );

  const supabase = getServiceRoleClient();

  const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role", targetRole);
  if (deleteError) throw deleteError;

  if (uniquePermissions.length > 0) {
    const { error: insertError } = await supabase.from("role_permissions").insert(
      uniquePermissions.map((permission) => ({
        role: targetRole,
        permission,
        granted_by: actor.userId,
      }))
    );
    if (insertError) throw insertError;
  }

  await logAudit({
    action: "ROLE_PERMISSIONS_UPDATED",
    entityType: "role_permissions",
    entityId: targetRole,
    actorId: actor.userId,
    actorRole: actor.role,
    metadata: { role: targetRole, permissions: uniquePermissions },
  });
}
