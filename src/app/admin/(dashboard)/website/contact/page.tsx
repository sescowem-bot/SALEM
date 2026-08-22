import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getWebsitePage } from "@/lib/data/websitePages";
import { WebsiteContentPublishBar } from "../WebsiteContentPublishBar";
import { ContactEditorForm } from "./ContactEditorForm";
import type { ContactContent } from "@/lib/data/websiteContentTypes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Page | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ContactCmsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">Your role ({staff.role}) does not have access to website content.</p>
      </AdminShell>
    );
  }

  const page = await getWebsitePage("contact", staff.role);

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="Contact page"
      lead="This edits the page copy only — the phone/email/address shown here always come live from Settings. Messages submitted through the contact form are managed separately."
      backTo="/admin/website"
      backLabel="Back to website"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-xs text-muted-foreground">Looking for submitted enquiries, not page copy?</p>
          <div className="flex gap-2">
            <Link href="/admin/messages" className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy-deep hover:bg-accent">
              Contact messages
            </Link>
            <Link href="/admin/settings" className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy-deep hover:bg-accent">
              Contact details (Settings)
            </Link>
          </div>
        </div>
        <WebsiteContentPublishBar pageKey="contact" status={page.status} updatedAt={page.updated_at} publishedAt={page.published_at} />
        <ContactEditorForm content={(page.draft_content as ContactContent) ?? {}} />
      </div>
    </AdminShell>
  );
}
