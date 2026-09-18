import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listPatientsForResultsEntry } from "@/lib/data/patients";
import { UploadResultForm } from "./UploadResultForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upload Existing Result | Salem Staff Area", robots: { index: false, follow: false } };

export default async function UploadResultPage() {
  const staff = await requireStaff();
  if (!can(staff, "reports.create_draft")) redirect("/admin/reports");
  const navItems = getAdminNavItems(staff);
  const patients = await listPatientsForResultsEntry();

  return (
    <AdminShell
      eyebrow="Reports · Existing Result"
      title="Upload Existing Result"
      lead="Create a patient report record around a finished laboratory PDF, then send it through the normal approval and publication workflow."
      backTo="/admin/reports"
      backLabel="Back to reports"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <UploadResultForm patients={patients} />
    </AdminShell>
  );
}
