import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { STAFF_ROLES, ROLE_LABELS, getPermissionsForRole } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Roles & Permissions | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function RolesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "staff.manage")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to this page.
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Roles & permissions"
      lead="The live permission matrix enforced by lib/auth/permissions.ts — every role below has exactly the permissions listed, nothing more."
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {STAFF_ROLES.map((role) => {
          const perms = getPermissionsForRole(role);
          return (
            <div key={role} className="surface-card p-6">
              <h2 className="text-sm font-semibold text-navy-deep">{ROLE_LABELS[role]}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{perms.length} permission{perms.length === 1 ? "" : "s"}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {perms.map((p) => (
                  <li
                    key={p}
                    className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-navy-deep"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
