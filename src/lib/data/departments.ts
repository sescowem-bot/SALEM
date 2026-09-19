import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import type { StaffRole } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/rolePermissions";
import { logAudit } from "./audit";

/**
 * Department & Function Management.
 *
 * Extends the Phase 5/6 department foundation (lib/data/staff.ts had a
 * minimal listDepartments/createDepartment, super_admin-only) with full
 * CRUD for departments plus a new department_functions table: a function
 * (a job function/duty — e.g. "Phlebotomy", "Billing") belongs to exactly
 * one department, and a department can have many functions.
 *
 * Deliberately a separate module rather than folded into lib/data/staff.ts:
 * this is org-structure management, not staff account administration, and
 * it is gated by its own "departments.manage" permission (super_admin +
 * admin — see lib/auth/permissions.ts) rather than "staff.manage" (which
 * stays super_admin-only for account creation). lib/data/staff.ts's
 * existing listDepartments/createDepartment and the Staff page's inline
 * "Departments" quick-add are untouched — this module is the canonical,
 * fuller management surface (edit, deactivate/reactivate, functions),
 * reachable from Administration → Departments & Functions.
 *
 * RLS mirrors this at the table level (see
 * supabase/migrations/20260920090001_department_functions.sql): both
 * `departments` and `department_functions` now allow super_admin + admin
 * for all-table access, matching this file's app-layer checks.
 */

type Department = Database["public"]["Tables"]["departments"]["Row"];
type DepartmentFunctionRow = Database["public"]["Tables"]["department_functions"]["Row"];
export interface DepartmentWithFunctions extends Department {
  functions: DepartmentFunctionRow[];
}

const assertManage = async (role: StaffRole) => {
  if (!(await hasPermission(role, "departments.manage"))) {
    throw new Error(`Forbidden: role "${role}" cannot manage departments or functions.`);
  }
};

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

/** Full department directory (active + inactive) for the management screen. */
export async function listAllDepartmentsForManagement(actorRole: StaffRole): Promise<Department[]> {
  await assertManage(actorRole);
  const { data, error } = await getServiceRoleClient().from("departments").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

/**
 * Departments with their assigned functions attached — the "view each
 * department and see its assigned functions" screen. Two queries + an
 * in-memory group-by rather than a nested select, so the shape stays a
 * plain array of functions per department regardless of how Supabase
 * would nest a to-many relationship.
 */
export async function listDepartmentsWithFunctions(actorRole: StaffRole): Promise<DepartmentWithFunctions[]> {
  await assertManage(actorRole);
  const supabase = getServiceRoleClient();
  const [{ data: departments, error: deptError }, { data: functions, error: fnError }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("department_functions").select("*").order("name"),
  ]);
  if (deptError) throw deptError;
  if (fnError) throw fnError;

  return (departments ?? []).map((department) => ({
    ...department,
    functions: (functions ?? []).filter((fn) => fn.department_id === department.id),
  }));
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
}

export async function createDepartment(
  input: DepartmentInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<Department> {
  await assertManage(actorRole);
  const { data, error } = await getServiceRoleClient()
    .from("departments")
    .insert({ name: input.name.trim(), description: input.description?.trim() || null })
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "DEPARTMENT_CREATED",
    entityType: "departments",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { name: data.name },
  });

  return data;
}

export async function updateDepartment(
  departmentId: string,
  input: DepartmentInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<Department> {
  await assertManage(actorRole);
  const { data, error } = await getServiceRoleClient()
    .from("departments")
    .update({ name: input.name.trim(), description: input.description?.trim() || null })
    .eq("id", departmentId)
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "DEPARTMENT_UPDATED",
    entityType: "departments",
    entityId: departmentId,
    actorId,
    actorRole,
    metadata: { name: data.name },
  });

  return data;
}

/**
 * Deactivating a department does not touch functions assigned to it or
 * staff already linked to it (staff_profiles.department_id is
 * ON DELETE SET NULL, not cascaded on deactivate) — it only stops the
 * department from being offered for new assignment via the "active
 * departments" read policy. Reassign any functions/staff first if the
 * department should no longer be used at all.
 */
export async function deactivateDepartment(departmentId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  await assertManage(actorRole);
  const { error } = await getServiceRoleClient().from("departments").update({ is_active: false }).eq("id", departmentId);
  if (error) throw error;
  await logAudit({ action: "DEPARTMENT_DEACTIVATED", entityType: "departments", entityId: departmentId, actorId, actorRole });
}

export async function reactivateDepartment(departmentId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  await assertManage(actorRole);
  const { error } = await getServiceRoleClient().from("departments").update({ is_active: true }).eq("id", departmentId);
  if (error) throw error;
  await logAudit({ action: "DEPARTMENT_REACTIVATED", entityType: "departments", entityId: departmentId, actorId, actorRole });
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Full function directory (active + inactive, any department) for the management screen. */
export async function listAllDepartmentFunctions(actorRole: StaffRole): Promise<DepartmentFunctionRow[]> {
  await assertManage(actorRole);
  const { data, error } = await getServiceRoleClient().from("department_functions").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export interface DepartmentFunctionInput {
  departmentId: string;
  name: string;
  description?: string | null;
}

export async function createDepartmentFunction(
  input: DepartmentFunctionInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<DepartmentFunctionRow> {
  await assertManage(actorRole);
  const { data, error } = await getServiceRoleClient()
    .from("department_functions")
    .insert({
      department_id: input.departmentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "DEPARTMENT_FUNCTION_CREATED",
    entityType: "department_functions",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { name: data.name, departmentId: data.department_id },
  });

  return data;
}

/**
 * Edits a function in place, including reassigning it to a different
 * department. Logs DEPARTMENT_FUNCTION_REASSIGNED (with the before/after
 * department) when department_id actually changes, and
 * DEPARTMENT_FUNCTION_UPDATED otherwise, so the audit trail distinguishes
 * a reassignment from an ordinary name/description edit.
 */
export async function updateDepartmentFunction(
  functionId: string,
  input: DepartmentFunctionInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<DepartmentFunctionRow> {
  await assertManage(actorRole);
  const supabase = getServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from("department_functions")
    .select("department_id")
    .eq("id", functionId)
    .single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from("department_functions")
    .update({
      department_id: input.departmentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .eq("id", functionId)
    .select()
    .single();
  if (error) throw error;

  const reassigned = existing.department_id !== input.departmentId;
  await logAudit({
    action: reassigned ? "DEPARTMENT_FUNCTION_REASSIGNED" : "DEPARTMENT_FUNCTION_UPDATED",
    entityType: "department_functions",
    entityId: functionId,
    actorId,
    actorRole,
    metadata: reassigned
      ? { name: data.name, fromDepartmentId: existing.department_id, toDepartmentId: input.departmentId }
      : { name: data.name, departmentId: data.department_id },
  });

  return data;
}

export async function deactivateDepartmentFunction(functionId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  await assertManage(actorRole);
  const { error } = await getServiceRoleClient().from("department_functions").update({ is_active: false }).eq("id", functionId);
  if (error) throw error;
  await logAudit({ action: "DEPARTMENT_FUNCTION_DEACTIVATED", entityType: "department_functions", entityId: functionId, actorId, actorRole });
}

export async function reactivateDepartmentFunction(functionId: string, actorRole: StaffRole, actorId?: string): Promise<void> {
  await assertManage(actorRole);
  const { error } = await getServiceRoleClient().from("department_functions").update({ is_active: true }).eq("id", functionId);
  if (error) throw error;
  await logAudit({ action: "DEPARTMENT_FUNCTION_REACTIVATED", entityType: "department_functions", entityId: functionId, actorId, actorRole });
}
