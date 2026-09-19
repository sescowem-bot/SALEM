"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { createTemplateStructure, type NewTemplateStructureInput } from "@/lib/data/testCatalog";

export interface TemplateActionState { error?: string }

export async function createResultTemplateAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const staff = await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const structureType = String(formData.get("structureType") ?? "field_based") as NewTemplateStructureInput["structureType"];
  const returnTo = String(formData.get("returnTo") ?? "/admin/services/new");
  let fields: NewTemplateStructureInput["fields"] = [];
  let columns: string[] = [];
  let rows: string[] = [];
  try {
    fields = JSON.parse(String(formData.get("fieldsJson") ?? "[]"));
    columns = JSON.parse(String(formData.get("columnsJson") ?? "[]"));
    rows = JSON.parse(String(formData.get("rowsJson") ?? "[]"));
  } catch {
    return { error: "The result structure could not be read. Please try again." };
  }
  if (name.length < 2) return { error: "Template name is required." };
  let template;
  try {
    template = await createTemplateStructure({ name, structureType, fields, columns, rows }, staff.role);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create result template." };
  }
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}templateId=${encodeURIComponent(template.id)}`);
}
