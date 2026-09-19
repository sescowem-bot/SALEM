import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllReports, getReportDetail } from "@/lib/data/labReports";
import { UploadResultForm } from "./UploadResultForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upload Result | Salem Staff Area", robots: { index: false, follow: false } };

export default async function UploadResultPage() {
  const staff = await requireStaff();
  if (!can(staff, "reports.edit_draft")) redirect("/admin/reports");
  const navItems = getAdminNavItems(staff);
  const rows = await listAllReports(staff.role, { status: "all" });
  const details = await Promise.all(rows.map(async (r) => {
    const detail = await getReportDetail(r.id);
    return { id: r.id, labNumber: r.lab_number, patientName: r.patient_name_snapshot, status: r.status, reportTests: detail.reportTests.map((rt) => ({ id: rt.id, testName: (rt.tests as { name?: string } | null)?.name ?? "Investigation" })) };
  }));
  return (
    <AdminShell eyebrow="Results System · Staff Area" title="Upload Result" lead="Attach a supplied PDF result to the correct existing report investigation." backTo="/admin/reports" backLabel="Back to reports" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
      <UploadResultForm reports={details} />
    </AdminShell>
  );
}
