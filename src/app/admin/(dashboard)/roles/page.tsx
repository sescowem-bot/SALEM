import type { Metadata } from "next";
import { ShieldCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { STAFF_ROLES, ROLE_LABELS, getPermissionsForRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Roles & Permissions | Salem Staff Area", robots: { index: false, follow: false } };

export default async function RolesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  if (!can(staff, "staff.manage")) return <AdminShell eyebrow="Administration" title="Not available" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Only Super Admin can manage staff roles and permissions.</p></AdminShell>;
  return <AdminShell eyebrow="Administration · Access control" title="Roles & permissions" lead="Roles are reusable permission bundles. A staff member can hold multiple roles, with the primary role shown for identification." backTo="/admin/staff" backLabel="Back to staff" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="surface-card p-5"><ShieldCheck className="h-5 w-5 text-navy"/><p className="mt-3 text-2xl font-semibold text-navy-deep">{STAFF_ROLES.length}</p><p className="text-xs text-muted-foreground">Available roles</p></div><div className="surface-card p-5"><Users className="h-5 w-5 text-navy"/><p className="mt-3 text-2xl font-semibold text-navy-deep">Multi-role</p><p className="text-xs text-muted-foreground">Supported per staff account</p></div><div className="surface-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Management</p><p className="mt-3 text-sm font-semibold text-navy-deep">Administration → Staff</p><p className="mt-1 text-xs text-muted-foreground">Assign department, primary role and additional roles there.</p></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{STAFF_ROLES.map(role=>{const perms=getPermissionsForRole(role);return <section key={role} className="rounded-2xl border border-border bg-card p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-navy-deep">{ROLE_LABELS[role]}</h2><p className="mt-1 text-xs text-muted-foreground">{perms.length} permissions</p></div><span className="rounded-xl bg-accent p-2 text-navy"><ShieldCheck className="h-4 w-4"/></span></div><div className="mt-4 flex flex-wrap gap-1.5">{perms.map(p=><span key={p} className="rounded-lg border border-border bg-secondary px-2 py-1 text-[10px] font-medium text-navy-deep">{p}</span>)}</div></section>})}</div>
  </AdminShell>;
}
