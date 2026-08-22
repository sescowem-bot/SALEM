import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAuditLogs } from "@/lib/data/audit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Logs | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function AuditPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "audit.view")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to the audit trail.
        </p>
      </AdminShell>
    );
  }

  const logs = await listAuditLogs({ limit: 200 });

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Audit logs"
      lead={`Most recent ${logs.length} entr${logs.length === 1 ? "y" : "ies"} across the system, newest first.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {logs.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No audit activity recorded yet.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {logs.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                <ClipboardList className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-navy-deep">{entry.action.replaceAll("_", " ")}</span>
                <span className="block text-xs text-muted-foreground">
                  {entry.entity_type}
                  {entry.entity_id ? ` · ${entry.entity_id}` : ""} · {entry.actor_role ?? "system"} ·{" "}
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
