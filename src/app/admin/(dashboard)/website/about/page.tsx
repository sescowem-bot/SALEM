import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getWebsitePage } from "@/lib/data/websitePages";
import { WebsiteContentPublishBar } from "../WebsiteContentPublishBar";
import { AboutEditorForm } from "./AboutEditorForm";
import type { AboutContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Page | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function AboutCmsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">Your role ({staff.role}) does not have access to website content.</p>
      </AdminShell>
    );
  }

  const page = await getWebsitePage("about", staff.role);

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="About page"
      lead="Existing content has been migrated in below — edit and publish when ready. Do not invent history, credentials, or certifications."
      backTo="/admin/website"
      backLabel="Back to website"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <WebsiteContentPublishBar pageKey="about" status={page.status} updatedAt={page.updated_at} publishedAt={page.published_at} />
        <AboutEditorForm content={(page.draft_content as AboutContent) ?? {}} />
      </div>
    </AdminShell>
  );
}
