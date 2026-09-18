"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import {
  createTemplateStructure,
  deleteTemplate,
  setTemplateActive,
  updateTemplateStructure,
  type NewTemplateStructureInput,
} from "@/lib/data/testCatalog";

export interface TemplateActionState { error?: string; ok?: boolean }

function parseJson(raw: FormDataEntryValue | null): unknown {
  try { return JSON.parse(String(raw ?? "[]")); } catch { return []; }
}

function readStructure(formData: FormData): NewTemplateStructureInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    structureType: String(formData.get("structureType") ?? "field_based") as NewTemplateStructureInput["structureType"],
    fields: parseJson(formData.get("fieldsJson")) as NewTemplateStructureInput["fields"],
    columns: parseJson(formData.get("columnsJson")) as string[],
    rows: parseJson(formData.get("rowsJson")) as string[],
  };
}

export async function createResultTemplateAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const staff = await requireStaff();
  const input = readStructure(formData);
  const returnTo = String(formData.get("returnTo") ?? "/admin/services/templates");
  if (input.name.length < 2) return { error: "Template name is required." };
  let template;
  try { template = await createTemplateStructure(input, staff.role); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not create result template." }; }
  revalidatePath("/admin/services/templates");
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}templateId=${encodeURIComponent(template.id)}`);
}

export async function updateResultTemplateAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const staff = await requireStaff();
  const id = String(formData.get("templateId") ?? "");
  const input = readStructure(formData);
  if (!id) return { error: "Missing template id." };
  try {
    if (input.name.length < 2) return { error: "Template name is required." };
    await updateTemplateStructure({ ...input, id, description: String(formData.get("description") ?? "") }, staff.role, staff.userId);
    revalidatePath("/admin/services/templates");
    revalidatePath(`/admin/services/templates/${id}`);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update result template." };
  }
}

export async function toggleTemplateActiveAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const staff = await requireStaff();
  const id = String(formData.get("templateId") ?? "");
  if (!id) return { error: "Missing template id." };
  try {
    await setTemplateActive(id, formData.get("isActive") === "true", staff.role, staff.userId);
    revalidatePath("/admin/services/templates");
    return { ok: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not update template." }; }
}

export async function deleteResultTemplateAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const staff = await requireStaff();
  const id = String(formData.get("templateId") ?? "");
  if (!id) return { error: "Missing template id." };
  try { await deleteTemplate(id, staff.role, staff.userId); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not delete template." }; }
  revalidatePath("/admin/services/templates");
  redirect("/admin/services/templates?deleted=1");
}
