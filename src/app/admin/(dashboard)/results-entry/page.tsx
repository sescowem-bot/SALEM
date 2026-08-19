import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listTestCategories, listActiveTests } from "@/lib/data/testCatalog";
import { getPatientById } from "@/lib/data/patients";
import { NewVisitClient } from "./NewVisitClient";

export const metadata: Metadata = {
  title: "Start a Visit | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ResultsEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const { patientId } = await searchParams;

  if (!can(staff, "reports.view")) {
    return (
      <AdminShell
        eyebrow="Results System · Staff Area"
        title="Not available for your role"
        lead={`Your role (${staff.role}) does not have access to laboratory results.`}
        staffName={staff.fullName}
        staffRole={staff.role}
        navItems={navItems}
      >
        <p className="surface-card p-6 text-sm text-muted-foreground">
          If you believe this is incorrect, contact a super admin.
        </p>
      </AdminShell>
    );
  }

  const canRegisterPatients = can(staff, "patients.register");
  const canCreateVisit = can(staff, "reports.create_draft");

  const [categories, tests, preselectedPatient] = await Promise.all([
    listTestCategories(),
    listActiveTests(),
    patientId ? getPatientById(patientId) : Promise.resolve(null),
  ]);

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="Start a visit"
      lead="Find or register a patient, then select the tests being run for this visit."
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <NewVisitClient
        categories={categories}
        tests={tests}
        preselectedPatient={preselectedPatient}
        canRegisterPatients={canRegisterPatients}
        canCreateVisit={canCreateVisit}
      />
    </AdminShell>
  );
}
