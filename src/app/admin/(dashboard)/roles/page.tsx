import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { STAFF_ROLES, ALL_PERMISSIONS } from "@/lib/auth/permissions";
import { getRolePermissionsMatrix } from "@/lib/auth/rolePermissions";
import { EditableRoleCard, ReadOnlyRoleCard } from "./RoleCards";

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

  // The live matrix — one DB read (request-memoized), shared with every
  // hasPermission()/can() check elsewhere in this same request.
  const matrix = await getRolePermissionsMatrix();
  const isSuperAdmin = staff.role === "super_admin";

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Roles & permissions"
      lead={
        isSuperAdmin
          ? "Tick which permissions each role holds and save — changes apply immediately, app-wide, no redeploy needed."
          : "The live permission matrix. Only super_admin can edit this — you're viewing it read-only."
      }
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {STAFF_ROLES.map((role) => {
          if (role === "super_admin") {
            return (
              <ReadOnlyRoleCard
                key={role}
                role={role}
                permissions={[...ALL_PERMISSIONS]}
                note="always has every permission — not editable, so it can never be locked out"
              />
            );
          }
          if (isSuperAdmin) {
            return <EditableRoleCard key={role} role={role} initialPermissions={matrix[role] ?? []} />;
          }
          return <ReadOnlyRoleCard key={role} role={role} permissions={matrix[role] ?? []} />;
        })}
      </div>
    </AdminShell>
  );
}
