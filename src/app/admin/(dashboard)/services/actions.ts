"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import {
  createService,
  createServiceWithNewTemplate,
  updateService,
  publishService,
  unpublishService,
  archiveService,
  setServiceFeatured,
  reorderService,
  isServiceSlugTaken,
  type ServiceEditableFields,
} from "@/lib/data/testCatalog";
import { uploadServiceImage, removeServiceImage } from "@/lib/data/storage";
import { serviceEditorSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function toEditableFields(parsed: {
  name: string;
  categoryId: string;
  templateId?: string;
  slug: string;
  publicDescription?: string;
  fullDescription?: string;
  preparationInfo?: string;
  requirements?: string;
  whatToAvoid?: string;
  importantNotes?: string;
  turnaroundTime?: string;
  priceNgn?: number;
  showPrice: "true" | "false";
  featured: "true" | "false";
  ctaLabel?: string;
  ctaDestination?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: "true" | "false";
}): ServiceEditableFields {
  return {
    name: parsed.name,
    categoryId: parsed.categoryId,
    templateId: parsed.templateId ?? "",
    slug: parsed.slug,
    publicDescription: parsed.publicDescription || null,
    fullDescription: parsed.fullDescription || null,
    preparationInfo: parsed.preparationInfo || null,
    requirements: parsed.requirements || null,
    whatToAvoid: parsed.whatToAvoid || null,
    importantNotes: parsed.importantNotes || null,
    turnaroundTime: parsed.turnaroundTime || null,
    priceNgn: parsed.priceNgn == null ? null : Number(parsed.priceNgn),
    showPrice: parsed.showPrice === "true",
    featured: parsed.featured === "true",
    ctaLabel: parsed.ctaLabel || null,
    ctaDestination: parsed.ctaDestination || null,
    seoTitle: parsed.seoTitle || null,
    seoDescription: parsed.seoDescription || null,
    isActive: parsed.isActive === "true",
  };
}

/**
 * newTemplate{Fields,Columns,Rows}Json arrive as JSON strings (FormData has
 * no native array-of-objects support) built client-side by the "create new
 * result template" builder in ServiceEditorForm.tsx — same pattern as
 * addCustomInvestigationAction in reports/[id]/actions.ts.
 */
function parseJsonArray(raw: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
}

function readForm(formData: FormData) {
  return {
    testId: (formData.get("testId") as string) || undefined,
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    templateId: formData.get("templateId") || "",
    templateMode: (formData.get("templateMode") as string) || "existing",
    newTemplateStructureType: formData.get("newTemplateStructureType") || undefined,
    newTemplateFields: parseJsonArray(formData.get("newTemplateFieldsJson")),
    newTemplateColumns: parseJsonArray(formData.get("newTemplateColumnsJson")),
    newTemplateRows: parseJsonArray(formData.get("newTemplateRowsJson")),
    slug: formData.get("slug"),
    publicDescription: formData.get("publicDescription") || "",
    fullDescription: formData.get("fullDescription") || "",
    preparationInfo: formData.get("preparationInfo") || "",
    requirements: formData.get("requirements") || "",
    whatToAvoid: formData.get("whatToAvoid") || "",
    importantNotes: formData.get("importantNotes") || "",
    turnaroundTime: formData.get("turnaroundTime") || "",
    priceNgn: (formData.get("priceNgn") as string) || "",
    showPrice: (formData.get("showPrice") as string) || "false",
    featured: (formData.get("featured") as string) || "false",
    ctaLabel: formData.get("ctaLabel") || "",
    ctaDestination: formData.get("ctaDestination") || "",
    seoTitle: formData.get("seoTitle") || "",
    seoDescription: formData.get("seoDescription") || "",
    isActive: (formData.get("isActive") as string) || "true",
  };
}

export async function createServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = serviceEditorSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid service details." };

  let newId: string;
  try {
    if (await isServiceSlugTaken(parsed.data.slug, undefined, staff.role)) {
      return { error: "That slug is already in use by another service." };
    }
    const editableFields = toEditableFields(parsed.data);
    const created =
      parsed.data.templateMode === "new"
        ? await createServiceWithNewTemplate(
            editableFields,
            {
              name: parsed.data.name,
              structureType: parsed.data.newTemplateStructureType!,
              fields: parsed.data.newTemplateFields,
              columns: parsed.data.newTemplateColumns,
              rows: parsed.data.newTemplateRows,
            },
            staff.role,
            staff.userId
          )
        : await createService(editableFields, staff.role, staff.userId);
    newId = created.id;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to manage services." };
    }
    return { error: err instanceof Error ? err.message : "Could not create service." };
  }

  revalidatePath("/admin/services");
  redirect(`/admin/services/${newId}`);
}

export async function updateServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = serviceEditorSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid service details." };
  if (!parsed.data.testId) return { error: "Missing service id." };

  try {
    if (await isServiceSlugTaken(parsed.data.slug, parsed.data.testId, staff.role)) {
      return { error: "That slug is already in use by another service." };
    }
    await updateService(parsed.data.testId, toEditableFields(parsed.data), staff.role, staff.userId);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to manage services." };
    }
    return { error: err instanceof Error ? err.message : "Could not save service." };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${parsed.data.testId}`);
  revalidatePath("/services");
  return { ok: true };
}

export async function publishServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  if (!testId) return { error: "Missing service id." };

  try {
    await publishService(testId, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not publish service." };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${testId}`);
  revalidatePath("/services");
  return { ok: true };
}

export async function unpublishServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  if (!testId) return { error: "Missing service id." };

  try {
    await unpublishService(testId, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not unpublish service." };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${testId}`);
  revalidatePath("/services");
  return { ok: true };
}

export async function archiveServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  if (!testId) return { error: "Missing service id." };

  try {
    await archiveService(testId, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not archive service." };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${testId}`);
  revalidatePath("/services");
  return { ok: true };
}

export async function toggleFeaturedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  const featured = formData.get("featured") === "true";
  if (!testId) return { error: "Missing service id." };

  try {
    await setServiceFeatured(testId, featured, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update service." };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

export async function reorderServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  const direction = formData.get("direction") as "up" | "down";
  if (!testId || !direction) return { error: "Missing reorder details." };

  try {
    await reorderService(testId, direction, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reorder service." };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

export async function uploadServiceImageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  const file = formData.get("file") as File | null;
  if (!testId) return { error: "Missing service id." };
  if (!file || file.size === 0) return { error: "Choose an image to upload." };

  try {
    await uploadServiceImage({
      testId,
      file,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not upload image." };
  }

  revalidatePath(`/admin/services/${testId}`);
  revalidatePath("/services");
  return { ok: true };
}

export async function removeServiceImageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const testId = formData.get("testId") as string;
  if (!testId) return { error: "Missing service id." };

  try {
    await removeServiceImage(testId, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not remove image." };
  }

  revalidatePath(`/admin/services/${testId}`);
  revalidatePath("/services");
  return { ok: true };
}
