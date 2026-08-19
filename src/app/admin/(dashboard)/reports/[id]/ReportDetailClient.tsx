"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FileText, Save, Send, CheckCircle2, RotateCcw, UploadCloud, ShieldCheck } from "lucide-react";
import {
  saveFieldResultAction,
  saveTableCellAction,
  uploadPdfAction,
  submitForReviewAction,
  approveAction,
  returnForCorrectionAction,
  publishAction,
  type ActionState,
} from "./actions";
import type { ReportTestViewModel } from "./page";
import type { Database } from "@/lib/supabase/database.types";

type LabReport = Database["public"]["Tables"]["lab_reports"]["Row"];

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

  return (
    <form action={action} className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[160px_1fr_100px_auto]">
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
        <select name="valueText" defaultValue={value?.valueText ?? ""} disabled={disabled} className={fieldClass}>
          <option value="" disabled>
            Select
          </option>
          {(field.options ?? (field.input_type === "positive_negative" ? ["Positive", "Negative"] : [])).map(
            (opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
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
  const [, action] = useActionState(saveTableCellAction, initial);

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="reportTestId" value={reportTestId} />
      <input type="hidden" name="templateTableRowId" value={rowId} />
      <input type="hidden" name="templateTableColumnId" value={columnId} />
      <input type="hidden" name="labReportId" value={labReportId} />
      <input type="text" name="value" defaultValue={value ?? ""} disabled={disabled} className={`${fieldClass} mt-0 w-20`} />
      {!disabled ? <MiniSubmit label="" /> : null}
    </form>
  );
}

function PdfUpload({ reportTestId, labReportId }: { reportTestId: string; labReportId: string }) {
  const [state, action] = useActionState(uploadPdfAction, initial);
  const { pending } = useFormStatus();

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="reportTestId" value={reportTestId} />
      <input type="hidden" name="labReportId" value={labReportId} />
      <input type="file" name="file" accept="application/pdf" required className="text-xs" />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent disabled:opacity-50"
      >
        <UploadCloud className="h-3.5 w-3.5" /> {pending ? "Uploading…" : "Upload PDF"}
      </button>
      {state.error ? <p className="w-full text-xs text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="w-full text-xs text-navy">Uploaded.</p> : null}
    </form>
  );
}

function WorkflowSubmit({
  label,
  icon: Icon,
  variant,
}: {
  label: string;
  icon: typeof Send;
  variant: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
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

function WorkflowButton({
  action,
  label,
  icon: Icon,
  labReportId,
  variant = "primary",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  icon: typeof Send;
  labReportId: string;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="labReportId" value={labReportId} />
      <WorkflowSubmit label={label} icon={Icon} variant={variant} />
      {state.error ? <p className="mt-1.5 text-xs text-destructive">{state.error}</p> : null}
      {state.accessCode ? (
        <p className="mt-2 max-w-xs rounded-lg border border-cyan/40 bg-accent p-3 text-xs text-navy-deep">
          <ShieldCheck className="mb-1 h-4 w-4" /> {"Patient access code (shown once — deliver securely):"}{" "}
          <span className="font-mono font-semibold">{state.accessCode}</span>
        </p>
      ) : null}
    </form>
  );
}

export function ReportDetailClient({
  report,
  tests,
  canEdit,
  canReview,
  canPublish,
}: {
  report: LabReport;
  tests: ReportTestViewModel[];
  canEdit: boolean;
  canReview: boolean;
  canPublish: boolean;
}) {
  return (
    <div className="space-y-6">
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
        {canEdit ? (
          <WorkflowButton action={submitForReviewAction} label="Submit for review" icon={Send} labReportId={report.id} />
        ) : null}

        {canReview ? (
          <>
            <WorkflowButton action={approveAction} label="Approve" icon={CheckCircle2} labReportId={report.id} />
            <ReturnForCorrectionForm labReportId={report.id} />
          </>
        ) : null}

        {canPublish ? (
          <WorkflowButton action={publishAction} label="Publish" icon={ShieldCheck} labReportId={report.id} />
        ) : null}

        {!canEdit && !canReview && !canPublish ? (
          <p className="text-sm text-muted-foreground">No further action available for your role on this report.</p>
        ) : null}
      </section>
    </div>
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
