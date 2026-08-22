import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listContactSubmissions } from "@/lib/data/communications";
import { ContactStatusForm } from "./ContactStatusForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Messages | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "enquiries.manage")) {
    return (
      <AdminShell eyebrow="Communications" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to contact messages.
        </p>
      </AdminShell>
    );
  }

  const messages = await listContactSubmissions(staff.role);

  return (
    <AdminShell
      eyebrow="Communications · Staff Area"
      title="Contact messages"
      lead={`${messages.length} submission${messages.length === 1 ? "" : "s"} from the public contact form. This shows admin visibility only — no outbound email is sent from here.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {messages.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No contact messages yet.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
              <span className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{m.full_name}</span>
                    <StatusBadge status={m.status} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {m.email ?? "No email"} {m.phone ? `· ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString()}
                  </span>
                  <span className="mt-1 block max-w-xl text-sm text-navy-deep">{m.message}</span>
                </span>
              </span>
              <ContactStatusForm submissionId={m.id} status={m.status} />
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
