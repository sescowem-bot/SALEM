import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listDepartmentsWithFunctions } from "@/lib/data/departments";
import { DepartmentsClient } from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Departments & Functions | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function DepartmentsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "departments.manage")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Only a Super Admin or Admin can manage departments and functions.
        </p>
      </AdminShell>
    );
  }

  const departments = await listDepartmentsWithFunctions(staff.role);
  const totalFunctions = departments.reduce((sum, d) => sum + d.functions.length, 0);

  return (
    <AdminShell
      eyebrow="Administration · Org structure"
      title="Departments & functions"
      lead={`${departments.length} department${departments.length === 1 ? "" : "s"} · ${totalFunctions} function${totalFunctions === 1 ? "" : "s"} · a department can have multiple functions; functions can be created, edited, deactivated and reassigned independently.`}
      backTo="/admin/staff"
      backLabel="Back to staff"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <DepartmentsClient departments={departments} />
    </AdminShell>
  );
}
