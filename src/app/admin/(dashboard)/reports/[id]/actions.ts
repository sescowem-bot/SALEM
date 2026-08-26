"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import {
  setFieldResult,
  setTableCellResult,
  returnForCorrection,
  publishReport,
  unlockPublishedReportForCorrection,
  resetPatientAccessCode,
  sendAccessCodeToPatientNow,
} from "@/lib/data/labReports";
import {
  submitReportForApproval,
  approveApprovalRequest,
  rejectApprovalRequest,
  returnApprovalRequestForCorrection,
} from "@/lib/data/approvals";
import { uploadReportPdf } from "@/lib/data/storage";
import {
  fieldResultSchema,
  tableCellSchema,
  reportTransitionSchema,
  submitForApprovalSchema,
  approvalDecisionSchema,
} from "@/lib/validation/schemas";

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
      flag: parsed.data.flag || undefined,
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

/** Advanced 4 — submit a draft for approval to a specific, chosen authorized approver. */
export async function submitForApprovalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = submitForApprovalSchema.safeParse({
    labReportId: formData.get("labReportId"),
    approverId: formData.get("approverId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose an approver." };

  try {
    await submitReportForApproval({
      labReportId: parsed.data.labReportId,
      approverId: parsed.data.approverId,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/workspace");
  revalidatePath("/admin/operations");
  return { ok: true };
}

/** Advanced 4 — approver actions on a specific approval_requests row (not just the report). */
export async function approveApprovalRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = approvalDecisionSchema.safeParse({ requestId: formData.get("requestId") });
  if (!parsed.success) return { error: "Invalid approval request." };
  const labReportId = String(formData.get("labReportId") ?? "");

  try {
    await approveApprovalRequest(parsed.data.requestId, staff.role, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  if (labReportId) revalidatePath(`/admin/reports/${labReportId}`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/operations");
  return { ok: true };
}

export async function rejectApprovalRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = approvalDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid approval request." };
  const labReportId = String(formData.get("labReportId") ?? "");

  try {
    await rejectApprovalRequest(parsed.data.requestId, parsed.data.comment || undefined, staff.role, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  if (labReportId) revalidatePath(`/admin/reports/${labReportId}`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/workspace");
  revalidatePath("/admin/operations");
  return { ok: true };
}

export async function returnApprovalRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = approvalDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid approval request." };
  const labReportId = String(formData.get("labReportId") ?? "");

  try {
    await returnApprovalRequestForCorrection(
      parsed.data.requestId,
      parsed.data.comment || undefined,
      staff.role,
      staff.userId
    );
  } catch (err) {
    return { error: friendlyError(err) };
  }

  if (labReportId) revalidatePath(`/admin/reports/${labReportId}`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/workspace");
  revalidatePath("/admin/operations");
  return { ok: true };
}

/** Plain report-level return-for-correction — used only for the "reviewed" (already approved,
 *  pre-publish) state, which has no pending approval_requests row to act on. */
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

/**
 * Reopens an already-published report for correction — see
 * unlockPublishedReportForCorrection in lib/data/labReports.ts for the full
 * rationale. A "reason" is required (not optional like a return-for-
 * correction comment) since this is a more consequential action worth a
 * paper trail explaining why an already-issued result is being reopened.
 */
export async function unlockPublishedReportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({
    labReportId: formData.get("labReportId"),
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report." };
  if (!parsed.data.comment) return { error: "Please state the reason for reopening this report." };

  try {
    await unlockPublishedReportForCorrection(parsed.data.labReportId, staff.role, staff.userId, parsed.data.comment);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * Reissues the patient access code for an already-published report. See
 * resetPatientAccessCode in lib/data/labReports.ts — the old code is
 * unrecoverable (only ever stored as a hash), so this is the only way to
 * help a patient (or an admin) who lost it.
 */
export async function resetAccessCodeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = reportTransitionSchema.safeParse({ labReportId: formData.get("labReportId") });
  if (!parsed.success) return { error: "Invalid report." };

  try {
    const { accessCodePlaintext } = await resetPatientAccessCode(parsed.data.labReportId, staff.role, staff.userId);
    revalidatePath(`/admin/reports/${parsed.data.labReportId}`);
    return { ok: true, accessCode: accessCodePlaintext };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

/**
 * Manual "send/resend now" — only callable with the exact code the admin
 * is currently looking at in the reveal box (see sendAccessCodeToPatientNow
 * in lib/data/labReports.ts, which re-verifies it against the stored hash
 * before sending anything).
 */
export async function sendAccessCodeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const labReportId = String(formData.get("labReportId") ?? "");
  const accessCode = String(formData.get("accessCode") ?? "");
  if (!labReportId || !accessCode) return { error: "Missing report or access code." };

  try {
    await sendAccessCodeToPatientNow(labReportId, accessCode, staff.role, staff.userId);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  return { ok: true };
}
