import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getPatientById, getPatientReportHistory } from "@/lib/data/patients";
import { PatientEditForm } from "./PatientEditForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patient | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const { id } = await params;

  if (!can(staff, "patients.view")) {
    return (
      <AdminShell eyebrow="Operations" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to patient records.
        </p>
      </AdminShell>
    );
  }

  const patient = await getPatientById(id);
  if (!patient) notFound();

  const [reports] = await Promise.all([getPatientReportHistory(id)]);
  const canEdit = can(staff, "patients.update");

  return (
    <AdminShell
      eyebrow="Operations · Staff Area"
      title={patient.full_name}
      lead="Patient profile, report history, and editable details."
      backTo="/admin/patients"
      backLabel="Back to patients"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {canEdit ? (
            <PatientEditForm patient={patient} />
          ) : (
            <div className="surface-card space-y-3 p-6">
              <h2 className="text-sm font-semibold text-navy-deep">Patient details</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sex</dt>
                  <dd className="text-navy-deep">{patient.sex ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date of birth</dt>
                  <dd className="text-navy-deep">{patient.date_of_birth ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
                  <dd className="text-navy-deep">{patient.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
                  <dd className="text-navy-deep">{patient.email ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <h2 className="text-sm font-semibold text-navy-deep">Report history</h2>
          {reports.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No laboratory reports on file for this patient.</p>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/reports/${r.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-navy-deep">Lab number {r.lab_number}</span>
                      <span className="block text-xs text-muted-foreground">{r.request ?? "No request notes"}</span>
                    </span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
