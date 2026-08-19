"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import {
  setFieldResult,
  setTableCellResult,
  submitForReview,
  returnForCorrection,
  transitionReportStatus,
  publishReport,
} from "@/lib/data/labReports";
import { uploadReportPdf } from "@/lib/data/storage";
import { fieldResultSchema, tableCellSchema, reportTransitionSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  ok?: boolean;
  accessCode?: string;
}

const initial: ActionState = {};
void initial;

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden")) return "You do not have permission to do that.";
    return err.message;
  }
  return "Something went wrong.";
}

export async function saveFieldResultAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const rawFlag = String(formData.get("flag") ?? "");
  const rawNumeric = formData.get("valueNumeric");

  const parsed = fieldResultSchema.safeParse({
    reportTestId: formData.get("reportTestId"),
    testId: formData.get("testId"),
    templateFieldId: formData.get("templateFieldId"),
    valueText: formData.get("valueText") || "",
    valueNumeric: rawNumeric && String(rawNumeric).trim() !== "" ? rawNumeric : undefined,
    flag: rawFlag || "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid value." };

  try {
    await setFieldResult({
      reportTestId: parsed.data.reportTestId,
      testId: parsed.data.testId,
      templateFieldId: parsed.data.templateFieldId,
      valueText: parsed.data.valueText || undefined,
      valueNumeric: parsed.data.valueNumeric,
      flag: (parsed.data.flag || undefined) as never,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  const labReportId = String(formData.get("labReportId") ?? "");
  if (labReportId) revalidatePath(`/admin/reports/${labReportId}`);
  return { ok: true };
}

export async function saveTableCellAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = tableCellSchema.safeParse({
    reportTestId: formData.get("reportTestId"),
    templateTableRowId: formData.get("templateTableRowId"),
    templateTableColumnId: formData.get("templateTableColumnId"),
    value: formData.get("value"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid value." };

  try {
    await setTableCellResult({ ...parsed.data, actorRole: staff.role, actorId: staff.userId });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  const labReportId = String(formData.get("labReportId") ?? "");
  if (labReportId) revalidatePath(`/admin/reports/${labReportId}`);
  return { ok: true };
}

export async function uploadPdfAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const file = formData.get("file");
  const reportTestId = String(formData.get("reportTestId") ?? "");
  const labReportId = String(formData.get("labReportId") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF file to upload." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are accepted." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { error: "PDF must be 15MB or smaller." };
  }

  try {
    await uploadReportPdf({
      labReportId,
      reportTestId,
      file,
      fileName: file.name,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${labReportId}`);
  return { ok: true };
}

export async function submitForReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({ labReportId: formData.get("labReportId") });
  if (!parsed.success) return { error: "Invalid report." };

  try {
    await submitForReview(parsed.data.labReportId, staff.role, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function approveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({ labReportId: formData.get("labReportId") });
  if (!parsed.success) return { error: "Invalid report." };

  try {
    await transitionReportStatus(parsed.data.labReportId, "reviewed", staff.userId, staff.role);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function returnForCorrectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({
    labReportId: formData.get("labReportId"),
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report." };

  try {
    await returnForCorrection(parsed.data.labReportId, staff.role, parsed.data.comment || undefined, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function publishAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({ labReportId: formData.get("labReportId") });
  if (!parsed.success) return { error: "Invalid report." };

  try {
    const { accessCodePlaintext } = await publishReport(parsed.data.labReportId, staff.role, staff.userId);
    revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
    revalidatePath("/admin/review");
    return { ok: true, accessCode: accessCodePlaintext ?? undefined };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}
