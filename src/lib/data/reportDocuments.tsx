import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { getReportDetail } from "./labReports";
import { getTestWithStructure } from "./testCatalog";
import { getSiteSettings } from "./siteSettings";
import { resolveSignatoryForStaff } from "./signatories";
import {
  getSignedReportPdfUrl,
  getSignatureImageDataUri,
  getSiteMediaDataUri,
  uploadFinalReportPdf,
} from "./storage";
import { logAudit } from "./audit";
import {
  ReportPdfDocument,
  type ReportPdfInput,
  type ReportPdfTest,
  type ReportPdfApprovalInfo,
} from "@/lib/pdf/reportPdfDocument";

/**
 * Advanced 5 — Professional Reporting, Letterhead, Signature & Final PDF.
 *
 * This module has two jobs, kept in one file because they share almost all
 * of their data assembly:
 *
 *  1. buildReportPdfData() / renderReportPdfBuffer() — turn the *existing*
 *     report/test/result data (lib/data/labReports.ts, lib/data/testCatalog.ts)
 *     plus site branding (lib/data/siteSettings.ts) into the shared
 *     ReportPdfDocument (lib/pdf/reportPdfDocument.tsx). Used for BOTH the
 *     live, non-final Report Preview (any authorized viewer, any status)
 *     and the stored final document below — same template, so the preview
 *     never lies about what the final document will look like.
 *
 *  2. generateFinalReportPdf() — called once, right after an approval
 *     decision transitions a report to "reviewed" (lib/data/approvals.ts
 *     approveApprovalRequest). Resolves the specific approver's linked
 *     signatory (never an arbitrary one), renders the PDF, stores it in the
 *     private lab-report-pdfs bucket, and records it in
 *     report_final_documents keyed to that exact version number — so a
 *     later amendment/re-approval produces a new row, never an overwrite.
 */

async function buildReportPdfData(input: {
  labReportId: string;
  approvalInfo?: { approverStaffId: string; approverName: string; decidedAt: string } | null;
  isFinal: boolean;
}): Promise<ReportPdfInput> {
  const { report, reportTests, fieldValues, tableCells } = await getReportDetail(input.labReportId);
  const siteSettings = await getSiteSettings();

  const tests: ReportPdfTest[] = await Promise.all(
    reportTests.map(async (rt) => {
      const joined = rt as unknown as { tests: { id: string; name: string } | null; comment: string | null };
      const structure = await getTestWithStructure(rt.test_id);

      if (!structure) {
        return { testName: joined.tests?.name ?? "Unknown test", comment: rt.comment, structureType: "field_based" as const, fields: [], tableColumns: [], tableRows: [] };
      }

      if (structure.template.structure_type === "field_based") {
        const fields = structure.fields
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((f) => {
            const fv = fieldValues.find((v) => v.template_field_id === f.id && v.report_test_id === rt.id);
            const value = fv?.value_text ?? (fv?.value_numeric !== null && fv?.value_numeric !== undefined ? String(fv.value_numeric) : "");
            return {
              label: f.label,
              value: value ?? "",
              unit: fv?.unit ?? f.unit ?? null,
              referenceRange: fv?.reference_range_display ?? null,
              flag: fv?.flag ?? null,
            };
          });
        return { testName: joined.tests?.name ?? structure.name, comment: rt.comment, structureType: "field_based" as const, fields, tableColumns: [], tableRows: [] };
      }

      const columns = structure.tableColumns.slice().sort((a, b) => a.sort_order - b.sort_order);
      const rows = structure.tableRows
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => ({
          rowLabel: row.row_label,
          cells: columns.map((col) => ({
            columnLabel: col.column_label,
            value: tableCells.find((c) => c.report_test_id === rt.id && c.template_table_row_id === row.id && c.template_table_column_id === col.id)?.value ?? "",
          })),
        }));
      return {
        testName: joined.tests?.name ?? structure.name,
        comment: rt.comment,
        structureType: "table_based" as const,
        fields: [],
        tableColumns: columns.map((c) => c.column_label),
        tableRows: rows,
      };
    })
  );

  let approval: ReportPdfApprovalInfo | null = null;
  if (input.approvalInfo) {
    const signatory = await resolveSignatoryForStaff(input.approvalInfo.approverStaffId);
    const signatureDataUri =
      signatory?.signature_image_url ? await getSignatureImageDataUri(signatory.signature_image_url) : null;

    approval = {
      approverName: signatory?.full_name ?? input.approvalInfo.approverName,
      approverDesignation: signatory?.designation ?? null,
      approverQualification: signatory?.qualification ?? null,
      decidedAt: new Date(input.approvalInfo.decidedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
      signatureDataUri,
      isAuthorizedSignatory: Boolean(signatory),
    };
  }

  // Only a dedicated print letterhead is used as the document image — the
  // website logo is never substituted for it (Advanced 8 §3: "Do not
  // replace it with our website branding"). If no letterhead has been
  // uploaded yet, ReportPdfDocument's clean text-based header (org name,
  // address, contact) is used instead of an image, which is still a
  // proper letterhead built from verified org info — not marketing
  // branding — until the real letterhead file is uploaded in Settings.
  const letterheadStoragePath = siteSettings.letterheadPath;
  const letterheadDataUri = letterheadStoragePath ? await getSiteMediaDataUri(letterheadStoragePath) : null;

  return {
    org: {
      orgName: siteSettings.orgName,
      tagline: siteSettings.tagline,
      addressLine1: siteSettings.addressLine1,
      addressLine2: siteSettings.addressLine2,
      city: siteSettings.city,
      state: siteSettings.state,
      emailPrimary: siteSettings.emailPrimary,
      phonePrimary: siteSettings.phonePrimary,
      letterheadDataUri,
    },
    report: {
      labNumber: report.lab_number,
      resultReference: report.result_reference,
      status: report.status,
      patientName: report.patient_name_snapshot,
      patientSex: report.patient_sex_snapshot,
      patientDob: report.patient_dob_snapshot,
      request: report.request,
      specimen: report.specimen,
      dateCollected: report.date_collected,
      dateReported: report.date_reported,
      reportComment: report.report_comment,
      versionNumber: report.current_version_number,
    },
    tests,
    approval,
    generatedAt: new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
    isFinal: input.isFinal,
  };
}

/**
 * On-demand, non-stored PDF for the Report Preview screen — any authorized
 * viewer, any report status. Never written to report_final_documents; this
 * is what "before final release" (§1) needs, distinct from generateFinalReportPdf.
 */
export async function renderReportPreviewPdfBuffer(labReportId: string, actorRole: StaffRole): Promise<Buffer> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot preview report documents.`);
  }
  const data = await buildReportPdfData({ labReportId, approvalInfo: null, isFinal: false });
  return renderToBuffer(<ReportPdfDocument data={data} />);
}

/** Data for the on-screen HTML Report Preview (mirrors the PDF template's content, not its layout). */
export async function getReportPreviewData(labReportId: string, actorRole: StaffRole): Promise<ReportPdfInput> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot preview report documents.`);
  }
  return buildReportPdfData({ labReportId, approvalInfo: null, isFinal: false });
}

/**
 * Called once, immediately after approveApprovalRequest transitions a
 * report to "reviewed" (lib/data/approvals.ts). NOT separately permission-
 * gated beyond the reports.review check already performed by the caller —
 * this function is the system-generated side effect of that decision, not
 * a standalone action a role opts into.
 */
export async function generateFinalReportPdf(input: {
  labReportId: string;
  approvalRequestId: string;
  approverStaffId: string;
  approverName: string;
  decidedAt: string;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<void> {
  const data = await buildReportPdfData({
    labReportId: input.labReportId,
    approvalInfo: { approverStaffId: input.approverStaffId, approverName: input.approverName, decidedAt: input.decidedAt },
    isFinal: true,
  });

  const buffer = await renderToBuffer(<ReportPdfDocument data={data} />);

  const storagePath = await uploadFinalReportPdf({
    labReportId: input.labReportId,
    versionNumber: data.report.versionNumber,
    buffer,
    actorRole: input.actorRole,
    actorId: input.actorId,
  });

  const signatory = await resolveSignatoryForStaff(input.approverStaffId);

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("report_final_documents")
    .upsert(
      {
        lab_report_id: input.labReportId,
        version_number: data.report.versionNumber,
        approval_request_id: input.approvalRequestId,
        signatory_id: signatory?.id ?? null,
        storage_path: storagePath,
        generated_by: input.actorId ?? null,
      },
      { onConflict: "lab_report_id,version_number" }
    );
  if (error) throw error;

  await logAudit({
    action: "FINAL_PDF_GENERATED",
    entityType: "lab_reports",
    entityId: input.labReportId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { versionNumber: data.report.versionNumber, approvalRequestId: input.approvalRequestId, signed: Boolean(signatory?.signature_image_url) },
  });
}

/**
 * Troubleshooting §6 — storage path (never a signed URL) for the admin
 * download route to stream directly, so the browser only ever sees our own
 * domain and a professional filename.
 */
export async function getFinalDocumentForDownload(
  labReportId: string,
  actorRole: StaffRole
): Promise<{ storagePath: string; labNumber: string } | null> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot access report documents.`);
  }
  const supabase = getServiceRoleClient();
  const [{ data: finalDoc }, { data: report }] = await Promise.all([
    supabase
      .from("report_final_documents")
      .select("storage_path")
      .eq("lab_report_id", labReportId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("lab_reports").select("lab_number").eq("id", labReportId).maybeSingle(),
  ]);
  if (!finalDoc?.storage_path || !report?.lab_number) return null;
  return { storagePath: finalDoc.storage_path, labNumber: report.lab_number };
}

export interface FinalDocumentSummary {
  id: string;
  versionNumber: number;
  generatedAt: string;
  signedUrl: string;
}

/** Latest finalized document for a report, if any — for the Admin report screen's "Download Final PDF". */
export async function getLatestFinalDocument(labReportId: string, actorRole: StaffRole): Promise<FinalDocumentSummary | null> {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot access report documents.`);
  }
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_final_documents")
    .select("id, version_number, storage_path, generated_at")
    .eq("lab_report_id", labReportId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    versionNumber: data.version_number,
    generatedAt: data.generated_at,
    signedUrl: await getSignedReportPdfUrl(data.storage_path),
  };
}

/** Every finalized document for a report, oldest first — for the version-history / audit view. */
export async function listFinalDocuments(labReportId: string, actorRole: StaffRole) {
  if (!hasPermission(actorRole, "reports.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot access report documents.`);
  }
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("report_final_documents")
    .select("id, version_number, generated_at, generated_by:staff_profiles!report_final_documents_generated_by_fkey(full_name)")
    .eq("lab_report_id", labReportId)
    .order("version_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
