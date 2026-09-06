import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getWebsitePage } from "@/lib/data/websitePages";
import { WebsiteContentPublishBar } from "../WebsiteContentPublishBar";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageHeroUploader } from "./HomepageHeroUploader";
import { getSiteMediaPublicUrl } from "@/lib/data/storage";
import type { HomepageContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function HomepageCmsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">Your role ({staff.role}) does not have access to website content.</p>
      </AdminShell>
    );
  }

  const page = await getWebsitePage("homepage", staff.role);

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="Homepage"
      lead="Edit the hero, about preview, services intro, trust section, and closing CTA. Nothing here goes live until you publish."
      backTo="/admin/website"
      backLabel="Back to website"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <HomepageHeroUploader
          currentUrl={typeof page.draft_content.heroImagePath === "string" ? getSiteMediaPublicUrl(page.draft_content.heroImagePath) : null}
          hasCurrent={typeof page.draft_content.heroImagePath === "string" && page.draft_content.heroImagePath.length > 0}
        />
        <WebsiteContentPublishBar pageKey="homepage" status={page.status} updatedAt={page.updated_at} publishedAt={page.published_at} />
        <HomepageEditorForm content={(page.draft_content as HomepageContent) ?? {}} />
      </div>
    </AdminShell>
  );
}
