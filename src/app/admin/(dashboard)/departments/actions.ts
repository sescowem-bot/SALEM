"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import {
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  reactivateDepartment,
  createDepartmentFunction,
  updateDepartmentFunction,
  deactivateDepartmentFunction,
  reactivateDepartmentFunction,
} from "@/lib/data/departments";
import {
  departmentSchema,
  departmentStatusSchema,
  departmentFunctionSchema,
  departmentFunctionStatusSchema,
} from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden")) return "You do not have permission to do that.";
    return err.message;
  }
  return "Something went wrong.";
}

const PATH = "/admin/departments";

export async function saveDepartmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = departmentSchema.safeParse({
    departmentId: formData.get("departmentId") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid department details." };

  const input = { name: parsed.data.name, description: parsed.data.description || null };

  try {
    if (parsed.data.departmentId) {
      await updateDepartment(parsed.data.departmentId, input, staff.role, staff.userId);
    } else {
      await createDepartment(input, staff.role, staff.userId);
    }
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function setDepartmentStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = departmentStatusSchema.safeParse({
    departmentId: formData.get("departmentId"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    if (parsed.data.active === "true") {
      await reactivateDepartment(parsed.data.departmentId, staff.role, staff.userId);
    } else {
      await deactivateDepartment(parsed.data.departmentId, staff.role, staff.userId);
    }
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function saveDepartmentFunctionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = departmentFunctionSchema.safeParse({
    functionId: formData.get("functionId") || undefined,
    departmentId: formData.get("departmentId"),
    name: formData.get("name"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid function details." };

  const input = {
    departmentId: parsed.data.departmentId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  };

  try {
    if (parsed.data.functionId) {
      await updateDepartmentFunction(parsed.data.functionId, input, staff.role, staff.userId);
    } else {
      await createDepartmentFunction(input, staff.role, staff.userId);
    }
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function setDepartmentFunctionStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = departmentFunctionStatusSchema.safeParse({
    functionId: formData.get("functionId"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    if (parsed.data.active === "true") {
      await reactivateDepartmentFunction(parsed.data.functionId, staff.role, staff.userId);
    } else {
      await deactivateDepartmentFunction(parsed.data.functionId, staff.role, staff.userId);
    }
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(PATH);
  return { ok: true };
}
