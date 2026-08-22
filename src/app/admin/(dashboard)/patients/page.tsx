import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listPatients } from "@/lib/data/patients";
import { PatientsClient } from "./PatientsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patients | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function PatientsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "patients.view")) {
    return (
      <AdminShell eyebrow="Operations" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to patient records.
        </p>
      </AdminShell>
    );
  }

  const canRegister = can(staff, "patients.register");
  const patients = await listPatients(staff.role, { limit: 100 });

  return (
    <AdminShell
      eyebrow="Operations · Staff Area"
      title="Patients"
      lead={`${patients.length} patient${patients.length === 1 ? "" : "s"} registered · showing the most recent 100.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <PatientsClient initialPatients={patients} canRegister={canRegister} />
    </AdminShell>
  );
}
