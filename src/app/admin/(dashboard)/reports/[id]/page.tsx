import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getReportDetail } from "@/lib/data/labReports";
import { getTestWithStructure, type TestWithStructure } from "@/lib/data/testCatalog";
import { getSignedReportPdfUrl } from "@/lib/data/storage";
import { ReportDetailClient } from "./ReportDetailClient";

export const metadata: Metadata = {
  title: "Laboratory Report | Salem Staff Area",
  robots: { index: false, follow: false },
};

export interface ReportTestViewModel {
  reportTestId: string;
  testId: string;
  testName: string;
  comment: string | null;
  structure: TestWithStructure;
  fieldValues: { templateFieldId: string; valueText: string | null; valueNumeric: number | null; flag: string | null }[];
  tableCells: { rowId: string; columnId: string; value: string | null }[];
  pdfSignedUrl: string | null;
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const { id } = await params;

  if (!can(staff, "reports.view")) {
    return (
      <AdminShell
        eyebrow="Results System"
        title="Not available for your role"
        staffName={staff.fullName}
        staffRole={staff.role}
        navItems={navItems}
      >
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to laboratory results.
        </p>
      </AdminShell>
    );
  }

  let detail;
  try {
    detail = await getReportDetail(id);
  } catch {
    notFound();
  }

  const { report, reportTests, fieldValues, tableCells } = detail;

  const testViewModels: ReportTestViewModel[] = await Promise.all(
    reportTests.map(async (rt) => {
      const joined = rt as unknown as { tests: { id: string; name: string } | null; pdf_storage_path: string | null };
      const structure = await getTestWithStructure(rt.test_id);
      const pdfSignedUrl = joined.pdf_storage_path ? await getSignedReportPdfUrl(joined.pdf_storage_path) : null;

      return {
        reportTestId: rt.id,
        testId: rt.test_id,
        testName: joined.tests?.name ?? "Unknown test",
        comment: rt.comment,
        structure: structure as TestWithStructure,
        fieldValues: fieldValues
          .filter((fv) => fv.report_test_id === rt.id)
          .map((fv) => ({
            templateFieldId: fv.template_field_id,
            valueText: fv.value_text,
            valueNumeric: fv.value_numeric,
            flag: fv.flag,
          })),
        tableCells: tableCells
          .filter((tc) => tc.report_test_id === rt.id)
          .map((tc) => ({
            rowId: tc.template_table_row_id,
            columnId: tc.template_table_column_id,
            value: tc.value,
          })),
        pdfSignedUrl,
      };
    })
  );

  const canEdit = can(staff, "reports.edit_draft") && report.status === "draft";
  const canReview =
    can(staff, "reports.review") && ((report.status === "draft" && report.submitted_for_review) || report.status === "reviewed");
  const canPublish = can(staff, "reports.publish") && report.status === "reviewed";

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title={`Report — ${report.patient_name_snapshot}`}
      lead={`Lab number ${report.lab_number} · Status: ${report.status}${report.submitted_for_review && report.status === "draft" ? " (submitted for review)" : ""}`}
      backTo="/admin/results-entry"
      backLabel="Back to results"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <ReportDetailClient
        report={report}
        tests={testViewModels}
        canEdit={canEdit}
        canReview={canReview}
        canPublish={canPublish}
      />
    </AdminShell>
  );
}
