import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllArticles } from "@/lib/data/seoArticles";
import { ArticleEditor } from "./ArticleEditor";
export const dynamic="force-dynamic"; export const metadata: Metadata={title:"SEO Articles | Salem Staff Area",robots:{index:false,follow:false}};
export default async function ArticlesPage(){const staff=await requireStaff();const nav=getAdminNavItems(staff);if(!can(staff,"settings.manage"))return <AdminShell eyebrow="SEO" title="Not available" staffName={staff.fullName} staffRole={staff.role} navItems={nav}><p className="surface-card p-6">Your role does not have SEO content access.</p></AdminShell>;const articles=await listAllArticles(staff.role);return <AdminShell eyebrow="SEO · Content" title="SEO articles" lead="Create useful health information pages that can earn search visibility and support service pages." staffName={staff.fullName} staffRole={staff.role} navItems={nav}><ArticleEditor articles={articles}/></AdminShell>}
