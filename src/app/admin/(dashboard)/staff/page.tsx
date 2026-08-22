import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listStaffProfiles } from "@/lib/data/staff";
import { StaffClient } from "./StaffClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function StaffPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  const canView = can(staff, "staff.manage") || staff.role === "admin";
  if (!canView) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to staff records.
        </p>
      </AdminShell>
    );
  }

  const canManage = can(staff, "staff.manage");
  const directory = await listStaffProfiles(staff.role);

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Staff"
      lead={
        canManage
          ? `${directory.length} account${directory.length === 1 ? "" : "s"} · manage roles and account status.`
          : `${directory.length} account${directory.length === 1 ? "" : "s"} · read-only directory for your role.`
      }
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <StaffClient directory={directory} canManage={canManage} currentUserId={staff.userId} />
    </AdminShell>
  );
}
