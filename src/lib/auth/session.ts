import "server-only";
import { redirect } from "next/navigation";
import { getSessionClient } from "@/lib/supabase/server-client";
import type { Permission, StaffRole } from "./permissions";
import { getPermissionsForRole } from "./rolePermissions";

export interface CurrentStaff {
  userId: string;
  email: string | null;
  fullName: string;
  role: StaffRole;
  qualification: string | null;
  designation: string | null;
  isActive: boolean;
  /**
   * The live permission set for this staff member's role, resolved once
   * per request from the DB-backed role_permissions matrix (see
   * ./rolePermissions.ts). can() below reads this synchronously — it's
   * resolved here, once, so every can(staff, ...) call site across ~40
   * pages/components doesn't need to become async just because the
   * permission matrix moved from hardcoded to editable.
   */
  permissions: Permission[];
}

/**
 * Resolves the signed-in Supabase Auth user AND their staff_profiles row,
 * using the session (RLS-respecting) client — never the service-role
 * client, so this can never return a staff member that RLS itself
 * wouldn't recognise. Returns null if unauthenticated, if there is no
 * matching staff_profiles row, or if the profile is inactive.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await getSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("staff_profiles")
    .select("full_name, role, qualification, designation, is_active")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.is_active) return null;

  const permissions = await getPermissionsForRole(profile.role);

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    qualification: profile.qualification,
    designation: profile.designation,
    isActive: profile.is_active,
    permissions,
  };
}

/**
 * For Server Components/layouts: resolves the current staff member or
 * redirects to /admin/login. Second layer of defence behind middleware.ts.
 */
export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/admin/login");
  }
  return staff;
}

/**
 * For Server Components/Actions/Route Handlers that need a specific
 * permission, not just "any signed-in staff member". Throws rather than
 * redirecting, since this is typically called from inside a Server Action
 * or data-layer function where a thrown error is the correct signal to the
 * caller — pages should check `can(staff, permission)` and render/redirect
 * accordingly instead of relying on the throw for UI flow.
 */
export async function requirePermission(permission: Permission): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (!can(staff, permission)) {
    throw new Error(`Forbidden: role "${staff.role}" lacks permission "${permission}".`);
  }
  return staff;
}

/**
 * Synchronous by design — see the `permissions` field comment on
 * CurrentStaff above. Reads the already-resolved, request-fresh
 * permission set; it does not itself touch the database.
 */
export function can(staff: CurrentStaff | null, permission: Permission): boolean {
  if (!staff) return false;
  return staff.permissions.includes(permission);
}
