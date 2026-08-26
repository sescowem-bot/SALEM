"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  FileText,
  Save,
  Send,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  ShieldCheck,
  XCircle,
  History,
  Eye,
  Download,
  Copy,
  KeyRound,
  Mail,
  MessageCircle,
} from "lucide-react";
import {
  saveFieldResultAction,
  saveTableCellAction,
  uploadPdfAction,
  submitForApprovalAction,
  approveApprovalRequestAction,
  rejectApprovalRequestAction,
  returnApprovalRequestAction,
  returnForCorrectionAction,
  publishAction,
  unlockPublishedReportAction,
  resetAccessCodeAction,
  sendAccessCodeAction,
  type ActionState,
} from "./actions";
import type { ReportTestViewModel } from "./page";
import type { Database } from "@/lib/supabase/database.types";
import type { ApproverOption } from "@/lib/data/approvals";
import type { FinalDocumentSummary } from "@/lib/data/reportDocuments";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { MailWarning, MailCheck, Clock3 } from "lucide-react";
import { DirtyFieldsProvider, useDirtyFields } from "./DirtyFieldsContext";

type LabReport = Database["public"]["Tables"]["lab_reports"]["Row"];

interface ApprovalHistoryRow {
  id: string;
  status: string;
  decision_comment: string | null;
  decided_at: string | null;
  created_at: string;
  requested_by: { full_name: string } | null;
  assigned_approver: { full_name: string } | null;
  decided_by_staff: { full_name: string } | null;
}

interface VersionHistoryRow {
  id: string;
  version_number: number;
  change_type: string;
  changed_by: string | null;
  changed_at: string;
}

interface NotificationRow {
  id: string;
  event_type: string;
  recipient_type: string;
  recipient_email: string | null;
  status: string;
  failure_reason: string | null;
  created_at: string;
  sent_at: string | null;
}

const EVENT_LABEL: Record<string, string> = {
  approval_requested: "Approver notified",
  report_approved: "Approval notice",
  report_rejected: "Rejection notice",
  report_returned: "Return notice",
  report_published: "Publish notice",
  patient_result_available: "Patient result-ready email",
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-navy-deep outline-none transition-colors focus:border-cyan focus:bg-card";

const initial: ActionState = {};

function MiniSubmit({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-2.5 py-2 text-xs font-semibold text-navy transition-colors hover:bg-cyan/25 disabled:opacity-50"
    >
      <Save className="h-3.5 w-3.5" /> {pending ? "…" : label}
    </button>
  );
}

function SelectField({
  value,
  disabled,
  options,
}: {
  value: string;
  disabled: boolean;
  options: string[];
}) {
  // Controlled — see AppointmentStatusForm.tsx for the full explanation:
  // React 19 resets uncontrolled fields to their first option after every
  // action submission, which made a saved Positive/Negative-style result
  // visually snap back to the "Select" placeholder even though the save
  // had actually succeeded.
  const [current, setCurrent] = useState(value);
  useEffect(() => setCurrent(value), [value]);
  return (
    <select
      name="valueText"
      value={current}
      disabled={disabled}
      onChange={(e) => setCurrent(e.target.value)}
      className={fieldClass}
    >
      <option value="" disabled>
        Select
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function FieldRow({
  reportTestId,
  testId,
  labReportId,
  field,
  value,
  disabled,
}: {
  reportTestId: string;
  testId: string;
  labReportId: string;
  field: { id: string; label: string; input_type: string; unit: string | null; options: string[] | null };
  value?: { valueText: string | null; valueNumeric: number | null; flag: string | null };
  disabled: boolean;
}) {
  const [state, action] = useActionState(saveFieldResultAction, initial);
  const { markDirty, markClean } = useDirtyFields();
  const dirtyKey = `field-${reportTestId}-${field.id}`;

  useEffect(() => {
    if (state.ok) markClean(dirtyKey);
  }, [state.ok, markClean, dirtyKey]);

  return (
    <form
      action={action}
      onChangeCapture={() => markDirty(dirtyKey)}
      className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[160px_1fr_100px_auto]"
    >
      <input type="hidden" name="reportTestId" value={reportTestId} />
      <input type="hidden" name="testId" value={testId} />
      <input type="hidden" name="templateFieldId" value={field.id} />
      <input type="hidden" name="labReportId" value={labReportId} />

      <label className="text-sm font-medium text-navy-deep sm:pb-2">{field.label}</label>

      {field.input_type === "numeric" ? (
        <input
          type="number"
          step="any"
          name="valueNumeric"
          defaultValue={value?.valueNumeric ?? ""}
          disabled={disabled}
          className={fieldClass}
        />
      ) : field.input_type === "select" || field.input_type === "positive_negative" ? (
        <SelectField
          value={value?.valueText ?? ""}
          disabled={disabled}
          options={field.options ?? (field.input_type === "positive_negative" ? ["Positive", "Negative"] : [])}
        />
      ) : (
        <input type="text" name="valueText" defaultValue={value?.valueText ?? ""} disabled={disabled} className={fieldClass} />
      )}

      {field.unit ? <span className="text-xs text-muted-foreground sm:pb-2.5">{field.unit}</span> : <span />}

      {!disabled ? <MiniSubmit /> : <span />}

      {state.error ? <p className="col-span-full text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

function TableCell({
  reportTestId,
  labReportId,
  rowId,
  columnId,
  value,
  disabled,
}: {
  reportTestId: string;
  labReportId: string;
  rowId: string;
  columnId: string;
  value?: string | null;
  disabled: boolean;
}) {
  const [state, action] = useActionState(saveTableCellAction, initial);
  const { markDirty, markClean } = useDirtyFields();
  const dirtyKey = `cell-${reportTestId}-${rowId}-${columnId}`;

  useEffect(() => {
    if (state.ok) markClean(dirtyKey);
  }, [state.ok, markClean, dirtyKey]);

  return (
    <form action={action} onChangeCapture={() => markDirty(dirtyKey)} className="flex items-center gap-1">
      <input type="hidden" name="reportTestId" value={reportTestId} />
      <input type="hidden" name="templateTableRowId" value={rowId} />
      <input type="hidden" name="templateTableColumnId" value={columnId} />
      <input type="hidden" name="labReportId" value={labReportId} />
      <input type="text" name="value" defaultValue={value ?? ""} disabled={disabled} className={`${fieldClass} mt-0 w-20`} />
      {!disabled ? <MiniSubmit label="" /> : null}
    </form>
  );
}

function PdfUploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent disabled:opacity-50"
    >
      <UploadCloud className="h-3.5 w-3.5" /> {pending ? "Uploading…" : "Upload PDF"}
    </button>
  );
}

function PdfUpload({ reportTestId, labReportId }: { reportTestId: string; labReportId: string }) {
  const [state, action] = useActionState(uploadPdfAction, initial);

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="reportTestId" value={reportTestId} />
      <input type="hidden" name="labReportId" value={labReportId} />
      <input type="file" name="file" accept="application/pdf" required className="text-xs" />
      <PdfUploadButton />
      {state.error ? <p className="w-full text-xs text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="w-full text-xs text-navy">Uploaded.</p> : null}
    </form>
  );
}

function WorkflowSubmit({
  label,
  icon: Icon,
  variant,
  disabled,
}: {
  label: string;
  icon: typeof Send;
  variant: "primary" | "secondary";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
          : "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent disabled:opacity-60"
      }
    >
      <Icon className="h-4 w-4 shrink-0" /> {pending ? "…" : label}
    </button>
  );
}

/**
 * Shared by the initial Publish success state and the Reset-access-code
 * control — same "shown once, copy it now" moment either way, since the
 * plaintext genuinely will not be retrievable again after this render.
 */
function SendAccessCodeSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[0.65rem] font-semibold text-navy hover:border-cyan disabled:opacity-60"
    >
      <Mail className="h-3 w-3" /> {pending ? "Sending…" : "Email now"}
    </button>
  );
}

function SendAccessCodeEmailButton({ labReportId, accessCode }: { labReportId: string; accessCode: string }) {
  const [state, action] = useActionState(sendAccessCodeAction, initial);

  if (state.ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
        <Mail className="h-3 w-3" /> Sent
      </span>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="labReportId" value={labReportId} />
      <input type="hidden" name="accessCode" value={accessCode} />
      <SendAccessCodeSubmit />
      {state.error ? <p className="mt-1 text-[0.6rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

function AccessCodeReveal({
  accessCode,
  labReference,
  labReportId,
  patientPhone,
}: {
  accessCode: string;
  labReference?: string;
  labReportId: string;
  patientPhone?: string | null;
}) {
  const [copiedField, setCopiedField] = useState<"reference" | "code" | null>(null);

  const copy = (value: string, field: "reference" | "code") => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const whatsAppHref = patientPhone
    ? `https://wa.me/${patientPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Your Salem Medical Laboratories result is ready.${labReference ? `\nLab reference: ${labReference}` : ""}\nAccess code: ${accessCode}\nView it at ${
          typeof window !== "undefined" ? window.location.origin : ""
        }/results`
      )}`
    : null;

  return (
    <div className="mt-2 w-full max-w-sm rounded-lg border border-cyan/40 bg-accent p-3 text-xs text-navy-deep">
      <p className="mb-2 flex items-center gap-1.5 font-semibold">
        <ShieldCheck className="h-4 w-4 shrink-0" /> Shown once — copy both now and deliver to the patient securely
      </p>
      {labReference ? (
        <div className="mb-2 flex items-center justify-between gap-2 rounded border border-cyan/30 bg-card px-2 py-1.5">
          <div>
            <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Lab reference</p>
            <span className="font-mono font-semibold">{labReference}</span>
          </div>
          <button
            type="button"
            onClick={() => copy(labReference, "reference")}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[0.65rem] font-semibold text-navy hover:border-cyan"
          >
            <Copy className="h-3 w-3" /> {copiedField === "reference" ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
      <div className="mb-2 flex items-center justify-between gap-2 rounded border border-cyan/30 bg-card px-2 py-1.5">
        <div>
          <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Access code</p>
          <span className="font-mono font-semibold">{accessCode}</span>
        </div>
        <button
          type="button"
          onClick={() => copy(accessCode, "code")}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[0.65rem] font-semibold text-navy hover:border-cyan"
        >
          <Copy className="h-3 w-3" /> {copiedField === "code" ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SendAccessCodeEmailButton labReportId={labReportId} accessCode={accessCode} />
        {whatsAppHref ? (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="h-3 w-3" /> Share via WhatsApp
          </a>
        ) : (
          <span className="text-[0.6rem] text-muted-foreground">No phone on file for WhatsApp</span>
        )}
      </div>
    </div>
  );
}

function WorkflowButton({
  action,
  label,
  icon: Icon,
  labReportId,
  variant = "primary",
  labReference,
  patientPhone,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  icon: typeof Send;
  labReportId: string;
  variant?: "primary" | "secondary";
  labReference?: string;
  patientPhone?: string | null;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="labReportId" value={labReportId} />
      <WorkflowSubmit label={label} icon={Icon} variant={variant} />
      {state.error ? <p className="mt-1.5 text-xs text-destructive">{state.error}</p> : null}
      {state.accessCode ? (
        <AccessCodeReveal
          accessCode={state.accessCode}
          labReference={labReference}
          labReportId={labReportId}
          patientPhone={patientPhone}
        />
      ) : null}
    </form>
  );
}

/**
 * Lets an admin/pathologist reissue a published report's access code when
 * the patient (or the admin themselves) never received or lost the
 * original — see resetPatientAccessCode in lib/data/labReports.ts for why
 * this is a reissue, not a lookup: the plaintext was never stored anywhere
 * after the one-time reveal at publish, by design.
 */
function ResetAccessCodeControl({
  labReportId,
  labReference,
  patientPhone,
}: {
  labReportId: string;
  labReference?: string;
  patientPhone?: string | null;
}) {
  const [state, action] = useActionState(resetAccessCodeAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (state.accessCode) {
    return (
      <AccessCodeReveal
        accessCode={state.accessCode}
        labReference={labReference}
        labReportId={labReportId}
        patientPhone={patientPhone}
      />
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
      >
        <KeyRound className="h-3.5 w-3.5" /> Reset access code
      </button>
    );
  }

  return (
    <form action={action} className="flex shrink-0 flex-col items-end gap-1.5">
      <input type="hidden" name="labReportId" value={labReportId} />
      <p className="max-w-[200px] text-right text-[0.65rem] text-muted-foreground">
        The current code stops working immediately. You&apos;ll need to redeliver the new one.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[0.65rem] font-semibold text-muted-foreground hover:text-navy"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          <KeyRound className="h-3.5 w-3.5" /> Confirm reset
        </button>
      </div>
      {state.error ? <p className="text-[0.65rem] text-destructive">{state.error}</p> : null}
    </form>
  );
}

function ApproverSelect({
  labReportId,
  approvers,
}: {
  labReportId: string;
  approvers: ApproverOption[];
}) {
  const [state, action] = useActionState(submitForApprovalAction, initial);
  const [approverId, setApproverId] = useState("");
  const { dirtyCount } = useDirtyFields();

  if (approvers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active approver accounts are available right now. Ask a super admin to enable one before submitting.
      </p>
    );
  }

  const selectedApprover = approvers.find((a) => a.id === approverId);

  if (state.ok && selectedApprover) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Report saved and submitted to {selectedApprover.full_name} for approval.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="labReportId" value={labReportId} />
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Select authorized approver
      </label>
      <select
        name="approverId"
        required
        value={approverId}
        onChange={(e) => setApproverId(e.target.value)}
        className="w-64 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-navy-deep outline-none focus:border-cyan"
      >
        <option value="" disabled>
          Choose an approver
        </option>
        {approvers.map((a) => (
          <option key={a.id} value={a.id}>
            {a.full_name} — {a.designation ?? a.role.replace("_", " ")}
          </option>
        ))}
      </select>
      {dirtyCount > 0 ? (
        <p className="max-w-xs text-xs font-medium text-amber-700">
          You have {dirtyCount} unsaved result field{dirtyCount === 1 ? "" : "s"} above. Save {dirtyCount === 1 ? "it" : "them"}{" "}
          before submitting for approval, so the approver reviews your latest entries.
        </p>
      ) : null}
      <WorkflowSubmit label="Submit for approval" icon={Send} variant="primary" disabled={dirtyCount > 0} />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

function ApprovalDecisionButtons({ labReportId, requestId }: { labReportId: string; requestId: string }) {
  const [approveState, approveFormAction] = useActionState(approveApprovalRequestAction, initial);
  const [rejectState, rejectFormAction] = useActionState(rejectApprovalRequestAction, initial);
  const [returnState, returnFormAction] = useActionState(returnApprovalRequestAction, initial);
  const [rejectComment, setRejectComment] = useState("");
  const [returnComment, setReturnComment] = useState("");

  return (
    <div className="flex flex-wrap items-start gap-4">
      <form action={approveFormAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="labReportId" value={labReportId} />
        <WorkflowSubmit label="Approve" icon={CheckCircle2} variant="primary" />
        {approveState.error ? <p className="mt-1.5 text-xs text-destructive">{approveState.error}</p> : null}
      </form>

      <form action={rejectFormAction} className="flex flex-col gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="labReportId" value={labReportId} />
        <textarea
          name="comment"
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="Reason for rejecting (optional)"
          rows={1}
          className="w-56 rounded-lg border border-border bg-secondary px-3 py-2 text-xs outline-none focus:border-cyan"
        />
        <button
          type="submit"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-destructive/40 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <XCircle className="h-4 w-4 shrink-0" /> Reject
        </button>
        {rejectState.error ? <p className="text-xs text-destructive">{rejectState.error}</p> : null}
      </form>

      <form action={returnFormAction} className="flex flex-col gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="labReportId" value={labReportId} />
        <textarea
          name="comment"
          value={returnComment}
          onChange={(e) => setReturnComment(e.target.value)}
          placeholder="Reason for returning (optional)"
          rows={1}
          className="w-56 rounded-lg border border-border bg-secondary px-3 py-2 text-xs outline-none focus:border-cyan"
        />
        <button
          type="submit"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4 shrink-0" /> Return for correction
        </button>
        {returnState.error ? <p className="text-xs text-destructive">{returnState.error}</p> : null}
      </form>
    </div>
  );
}

function StatusHistoryPanel({
  approvalHistory,
  versionHistory,
}: {
  approvalHistory: ApprovalHistoryRow[];
  versionHistory: VersionHistoryRow[];
}) {
  if (approvalHistory.length === 0 && versionHistory.length === 0) return null;

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 shrink-0 text-purple" />
        <h2 className="text-base font-semibold text-navy-deep">Status history</h2>
      </div>

      {approvalHistory.length > 0 ? (
        <ul className="mt-4 space-y-3 border-l border-border pl-4">
          {approvalHistory.map((h) => (
            <li key={h.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="text-xs text-muted-foreground">
                  {new Date(h.decided_at ?? h.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Submitted by {h.requested_by?.full_name ?? "—"} to {h.assigned_approver?.full_name ?? "—"}
                {h.decided_by_staff ? ` · decided by ${h.decided_by_staff.full_name}` : ""}
              </p>
              {h.decision_comment ? <p className="mt-0.5 text-xs text-navy-deep">“{h.decision_comment}”</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {versionHistory.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document versions</p>
          <ul className="mt-2 space-y-1.5">
            {versionHistory.map((v) => (
              <li key={v.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  v{v.version_number} · {v.change_type.replace("_", " ")}
                </span>
                <span>{new Date(v.changed_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ReportDetailClient({
  report,
  tests,
  canEdit,
  canDecideApproval,
  canReturnReviewed,
  canPublish,
  canUnlockPublished,
  canResetAccessCode,
  approvers,
  activeApprovalRequestId,
  approvalHistory,
  versionHistory,
  finalDocument,
  notifications,
  patientPhone,
}: {
  report: LabReport;
  tests: ReportTestViewModel[];
  canEdit: boolean;
  canDecideApproval: boolean;
  canReturnReviewed: boolean;
  canPublish: boolean;
  canUnlockPublished: boolean;
  canResetAccessCode: boolean;
  approvers: ApproverOption[];
  activeApprovalRequestId: string | null;
  approvalHistory: ApprovalHistoryRow[];
  versionHistory: VersionHistoryRow[];
  finalDocument: FinalDocumentSummary | null;
  notifications: NotificationRow[];
  patientPhone: string | null;
}) {
  const canSubmit = canEdit && report.status === "draft" && !report.submitted_for_review;
  const pendingApprover =
    approvalHistory.find((h) => h.status === "pending")?.assigned_approver?.full_name ?? null;

  return (
    <DirtyFieldsProvider>
      <div className="space-y-6">
      <section className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-sm font-semibold text-navy-deep">Document</h2>
          <p className="text-xs text-muted-foreground">
            {finalDocument
              ? `Final PDF generated for version v${finalDocument.versionNumber} on ${new Date(finalDocument.generatedAt).toLocaleString()}.`
              : "No final PDF yet — generated automatically once this report is approved."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/reports/${report.id}/preview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </Link>
          {finalDocument ? (
            <a
              href={`/admin/reports/${report.id}/download`}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <Download className="h-3.5 w-3.5" /> Download final PDF
            </a>
          ) : null}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy-deep">Delivery</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              report.status === "published" && report.access_code_hash
                ? "bg-emerald-100 text-emerald-700"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {report.status === "published" && report.access_code_hash
              ? `Available to patient since ${report.published_at ? new Date(report.published_at).toLocaleString() : "publication"}`
              : "Not yet available to patient"}
          </span>
        </div>

        {report.result_reference ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 p-3">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Lab reference number
              </p>
              <p className="font-mono text-sm font-semibold text-navy-deep">{report.result_reference}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Safe to re-share — this is what the patient enters on /results alongside their access code. Unlike
                the access code, it doesn&apos;t change.
              </p>
            </div>
            {canResetAccessCode ? (
              <ResetAccessCodeControl
                labReportId={report.id}
                labReference={report.result_reference ?? undefined}
                patientPhone={patientPhone}
              />
            ) : null}
          </div>
        ) : null}

        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notifications recorded for this report yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <div className="flex items-center gap-2">
                  {n.status === "sent" ? (
                    <MailCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : n.status === "failed" ? (
                    <MailWarning className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-medium text-navy-deep">{EVENT_LABEL[n.event_type] ?? n.event_type}</span>
                  <span className="text-muted-foreground">
                    &middot; {n.recipient_type === "patient" ? "Patient" : "Staff"}
                    {n.recipient_email ? ` (${n.recipient_email})` : " (no email on file)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="capitalize">{n.status}</span>
                  <span>{new Date(n.sent_at ?? n.created_at).toLocaleString()}</span>
                  {n.status === "failed" && n.failure_reason ? (
                    <span className="text-destructive">— {n.failure_reason}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tests.map((t) => (
        <section key={t.reportTestId} className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-purple" />
            <h2 className="text-base font-semibold text-navy-deep">{t.testName}</h2>
          </div>

          {t.structure.template.structure_type === "field_based" ? (
            <div className="mt-4 space-y-3">
              {t.structure.fields.map((field) => (
                <FieldRow
                  key={field.id}
                  reportTestId={t.reportTestId}
                  testId={t.testId}
                  labReportId={report.id}
                  field={field}
                  value={t.fieldValues.find((v) => v.templateFieldId === field.id)}
                  disabled={!canEdit}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Antigen
                    </th>
                    {t.structure.tableColumns.map((col) => (
                      <th key={col.id} className="pb-2 pr-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        {col.column_label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {t.structure.tableRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 pr-3 text-sm font-medium text-navy-deep">{row.row_label}</td>
                      {t.structure.tableColumns.map((col) => (
                        <td key={col.id} className="py-2 pr-3">
                          <TableCell
                            reportTestId={t.reportTestId}
                            labReportId={report.id}
                            rowId={row.id}
                            columnId={col.id}
                            value={t.tableCells.find((c) => c.rowId === row.id && c.columnId === col.id)?.value}
                            disabled={!canEdit}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {t.pdfSignedUrl ? (
            <a
              href={t.pdfSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy underline underline-offset-2"
            >
              <FileText className="h-3.5 w-3.5" /> View uploaded PDF (link expires shortly)
            </a>
          ) : null}

          {canEdit ? <PdfUpload reportTestId={t.reportTestId} labReportId={report.id} /> : null}
        </section>
      ))}

      <section className="surface-card flex flex-wrap items-start gap-4 p-6 sm:p-8">
        {canSubmit ? <ApproverSelect labReportId={report.id} approvers={approvers} /> : null}

        {!canDecideApproval && report.status === "draft" && report.submitted_for_review ? (
          <p className="text-sm text-muted-foreground">
            {pendingApprover
              ? `Submitted — awaiting a decision from ${pendingApprover}.`
              : "Submitted — awaiting a decision from the assigned approver."}
          </p>
        ) : null}

        {canDecideApproval && activeApprovalRequestId ? (
          <ApprovalDecisionButtons labReportId={report.id} requestId={activeApprovalRequestId} />
        ) : null}

        {canReturnReviewed ? <ReturnForCorrectionForm labReportId={report.id} /> : null}

        {canPublish ? (
          <WorkflowButton
            action={publishAction}
            label="Publish"
            icon={ShieldCheck}
            labReportId={report.id}
            labReference={report.result_reference ?? undefined}
            patientPhone={patientPhone}
          />
        ) : null}

        {canUnlockPublished ? <UnlockPublishedForm labReportId={report.id} /> : null}

        {!canEdit &&
        !canDecideApproval &&
        !canReturnReviewed &&
        !canPublish &&
        !canUnlockPublished &&
        !(report.status === "draft" && report.submitted_for_review) ? (
          <p className="text-sm text-muted-foreground">No further action available for your role on this report.</p>
        ) : null}
      </section>

      <StatusHistoryPanel approvalHistory={approvalHistory} versionHistory={versionHistory} />
      </div>
    </DirtyFieldsProvider>
  );
}

function ReturnForCorrectionForm({ labReportId }: { labReportId: string }) {
  const [state, action] = useActionState(returnForCorrectionAction, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="labReportId" value={labReportId} />
      <textarea
        name="comment"
        placeholder="Reason for returning (optional)"
        rows={1}
        className="w-56 rounded-lg border border-border bg-secondary px-3 py-2 text-xs outline-none focus:border-cyan"
      />
      <button
        type="submit"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-destructive/50 hover:text-destructive"
      >
        <RotateCcw className="h-4 w-4 shrink-0" /> Return for correction
      </button>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}

/**
 * Reopening an already-published report is materially riskier than an
 * approver's ordinary return-for-correction — the patient may already have
 * viewed or downloaded this exact result — so unlike ReturnForCorrectionForm
 * above, the reason is required, and the copy spells out the consequence
 * (goes back through submit -> approve -> republish) rather than looking
 * like a routine one-click action.
 */
function UnlockPublishedForm({ labReportId }: { labReportId: string }) {
  const [state, action] = useActionState(unlockPublishedReportAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/60 px-5 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50"
      >
        <RotateCcw className="h-4 w-4 shrink-0" /> Unlock for correction
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <input type="hidden" name="labReportId" value={labReportId} />
      <p className="text-xs text-amber-900">
        This report is published and the patient may already have viewed or downloaded it. Reopening moves it back
        to draft — you&apos;ll need to correct the result, resubmit for approval, and republish before the patient
        sees the update. Their existing access code will keep working.
      </p>
      <textarea
        name="comment"
        required
        placeholder="Reason for reopening this report (required)"
        rows={2}
        className="rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none focus:border-cyan"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <RotateCcw className="h-4 w-4 shrink-0" /> Confirm unlock
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold text-muted-foreground hover:text-navy"
        >
          Cancel
        </button>
      </div>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}