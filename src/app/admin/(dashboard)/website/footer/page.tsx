import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getWebsitePage } from "@/lib/data/websitePages";
import { WebsiteContentPublishBar } from "../WebsiteContentPublishBar";
import { FooterEditorForm } from "./FooterEditorForm";
import type { FooterContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Footer | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function FooterCmsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">Your role ({staff.role}) does not have access to website content.</p>
      </AdminShell>
    );
  }

  const page = await getWebsitePage("footer", staff.role);

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="Footer"
      lead="Contact details and social links in the footer always come live from Settings — this only edits the footer's description and copyright text."
      backTo="/admin/website"
      backLabel="Back to website"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <WebsiteContentPublishBar pageKey="footer" status={page.status} updatedAt={page.updated_at} publishedAt={page.published_at} />
        <FooterEditorForm content={(page.draft_content as FooterContent) ?? {}} />
      </div>
    </AdminShell>
  );
}
