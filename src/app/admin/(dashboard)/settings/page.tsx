import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getSiteSettingsRow } from "@/lib/data/siteSettings";
import { getSiteMediaPublicUrl } from "@/lib/data/storage";
import { SettingsEditorForm } from "./SettingsEditorForm";
import { SiteMediaUploader } from "./SiteMediaUploader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Salem Staff Area",
  robots: { index: false, follow: false },
};

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

  const row = await getSiteSettingsRow(staff.role);

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="Settings"
      lead="Brand, contact and social information used across the whole website — header, footer, contact page and homepage all read from here. Changes save immediately, no publish step."
      backTo="/admin/website"
      backLabel="Back to website"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <SiteMediaUploader
          logoUrl={row.logo_path ? getSiteMediaPublicUrl(row.logo_path) : null}
          logoLightUrl={row.logo_light_path ? getSiteMediaPublicUrl(row.logo_light_path) : null}
          faviconUrl={row.favicon_path ? getSiteMediaPublicUrl(row.favicon_path) : null}
          ogImageUrl={row.og_image_path ? getSiteMediaPublicUrl(row.og_image_path) : null}
          letterheadUrl={row.letterhead_path ? getSiteMediaPublicUrl(row.letterhead_path) : null}
        />
        <SettingsEditorForm row={row} />
      </div>
    </AdminShell>
  );
}
