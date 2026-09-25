import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { getWebsitePage } from "@/lib/data/websitePages";
import { WebsiteContentPublishBar } from "../WebsiteContentPublishBar";
import { SimpleContentEditor } from "../ManagedContentEditors";
import type { BookingContent } from "@/lib/data/websiteContentTypes";
export const dynamic="force-dynamic";
export const metadata: Metadata={title:"booking | Salem Staff Area",robots:{index:false,follow:false}};
export default async function Page(){const staff=await requireStaff();const navItems=getAdminNavItems(staff);if(!can(staff,"settings.manage"))return <AdminShell eyebrow="Website" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><p className="surface-card p-6 text-sm text-muted-foreground">Your role does not have access to website content.</p></AdminShell>;const page=await getWebsitePage("booking",staff.role);return <AdminShell eyebrow="Website · Staff Area" title="booking" lead="Edit the draft, preview it, then publish when the content is ready." backTo="/admin/website" backLabel="Back to website" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><div className="space-y-6"><WebsiteContentPublishBar pageKey="booking" status={page.status} updatedAt={page.updated_at} publishedAt={page.published_at}/><div className="mt-6"><SimpleContentEditor pageKey="booking" type="booking" content={(page.draft_content as BookingContent) ?? {}} /></div></div></AdminShell>}