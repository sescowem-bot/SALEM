import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllWebsitePages } from "@/lib/data/websitePages";
import type { WebsitePageKey } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website | Salem Staff Area",
  robots: { index: false, follow: false },
};

const PAGE_LABELS: Record<WebsitePageKey, string> = {
  homepage: "Homepage",
  about: "About page",
  contact: "Contact page",
  footer: "Footer",
  seo: "SEO",
};

export default async function WebsiteOverviewPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "settings.manage")) {
    return (
      <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">Your role ({staff.role}) does not have access to website content.</p>
      </AdminShell>
    );
  }

  const pages = await listAllWebsitePages(staff.role);
  const draftsPending = pages.filter((p) => p.status === "draft" || p.published_content == null).length;

  return (
    <AdminShell
      eyebrow="Website · Staff Area"
      title="Website content"
      lead={`${pages.length} editable sections. ${draftsPending} not yet published.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="surface-card divide-y divide-border">
        {pages.map((p) => (
          <Link
            key={p.page_key}
            href={`/admin/website/${p.page_key}`}
            className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-deep">{PAGE_LABELS[p.page_key]}</span>
                  <StatusBadge status={p.status} />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Edited {new Date(p.updated_at).toLocaleDateString()}
                  {p.published_at ? ` · published ${new Date(p.published_at).toLocaleDateString()}` : " · never published"}
                </span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="mt-5 surface-card flex items-center justify-between gap-4 p-5">
        <span className="text-sm text-navy-deep">Brand, contact & social settings</span>
        <Link href="/admin/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:text-navy">
          Manage settings <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
      <div className="mt-3 surface-card flex items-center justify-between gap-4 p-5">
        <span className="text-sm text-navy-deep">Services (Services CMS)</span>
        <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:text-navy">
          Manage services <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </AdminShell>
  );
}
