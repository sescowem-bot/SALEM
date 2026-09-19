"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { updateRolePermissions } from "@/lib/auth/rolePermissions";
import { ALL_PERMISSIONS, STAFF_ROLES, type Permission, type StaffRole } from "@/lib/auth/permissions";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function isStaffRole(value: FormDataEntryValue | null): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as string[]).includes(value);
}

function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

/**
 * Saves the complete permission set for one role, submitted as a set of
 * checked `permission` checkboxes from the /admin/roles form. Unchecked
 * boxes simply don't appear in formData — that's what makes this a
 * full replace rather than a diff (see updateRolePermissions).
 */
export async function updateRolePermissionsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const role = formData.get("role");
  if (!isStaffRole(role)) return { error: "Unknown role." };
  if (role === "super_admin") return { error: "super_admin always has every permission and cannot be edited." };

  const permissions = formData.getAll("permission").filter((p): p is string => typeof p === "string").filter(isPermission);

  try {
    await updateRolePermissions(role, permissions, { userId: staff.userId, role: staff.role });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "Only super_admin can edit the permission matrix." };
    }
    return { error: err instanceof Error ? err.message : "Could not save permissions." };
  }

  revalidatePath("/admin/roles");
  return { ok: true };
}
