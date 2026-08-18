import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { ResultsEntryPageClient } from "./ResultsEntryPageClient";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";

export const metadata: Metadata = {
  title: "Enter Laboratory Result | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ResultsEntryPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "reports.view")) {
    return (
      <AdminShell
        eyebrow="Results System \u00b7 Staff Area"
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

  return (
    <AdminShell
      eyebrow="Results System \u00b7 Staff Area"
      title="Enter a laboratory result"
      lead="Prepared UI only — nothing here is saved or generates a PDF yet. Once the results system is connected, this screen will produce an official Salem-letterhead report."
      backTo="/"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <ResultsEntryPageClient />
    </AdminShell>
  );
}
