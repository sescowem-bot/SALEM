import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { siteConfig } from "@/data/siteContent";

export const metadata: Metadata = {
  title: "Settings | Salem Staff Area",
  robots: { index: false, follow: false },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm font-medium text-navy-deep">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to system settings.
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Settings"
      lead="Brand and contact information currently live in the codebase (src/data/siteContent.ts), not a database table, so this page is read-only for now. Editable, DB-backed branding/logo/settings management is genuinely pending — see the final report for what that would take."
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="surface-card p-6">
        <h2 className="text-sm font-semibold text-navy-deep">Business & contact information</h2>
        <div className="mt-2 divide-y divide-border">
          <Row label="Site name" value={siteConfig.name} />
          <Row label="Tagline" value={siteConfig.tagline} />
          <Row label="Address" value={`${siteConfig.address.line1}, ${siteConfig.address.line2}`} />
          <Row label="Phone" value={siteConfig.phone.primary} />
          <Row label="WhatsApp" value={siteConfig.phone.whatsapp} />
          <Row label="General email" value={siteConfig.email.general} />
          <Row label="Results email" value={siteConfig.email.results} />
          <Row label="Weekday hours" value={siteConfig.hours.weekdays} />
          <Row label="Weekend hours" value={siteConfig.hours.weekend} />
        </div>
      </div>
    </AdminShell>
  );
}
