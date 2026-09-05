import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type Article = {
  id: string; title: string; slug: string; excerpt: string | null; content: string;
  seo_title: string | null; seo_description: string | null; featured_image_url: string | null;
  status: "draft" | "published" | "archived"; published_at: string | null; updated_at: string;
  created_by: string | null; updated_by: string | null;
};

function guard(role: StaffRole) { if (!hasPermission(role, "settings.manage")) throw new Error(`Forbidden: role "${role}" cannot manage SEO content.`); }
export async function listPublishedArticles(): Promise<Article[]> {
  const db = getServiceRoleClient() as any;
  const { data, error } = await db.from("seo_articles").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const db = getServiceRoleClient() as any;
  const { data, error } = await db.from("seo_articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error; return data;
}
export async function listAllArticles(role: StaffRole): Promise<Article[]> {
  guard(role); const db = getServiceRoleClient() as any;
  const { data, error } = await db.from("seo_articles").select("*").order("updated_at", { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function upsertArticle(input: Partial<Article> & { title: string; slug: string; content: string }, role: StaffRole, actorId?: string) {
  guard(role); const db = getServiceRoleClient() as any;
  const payload = { ...input, updated_at: new Date().toISOString(), updated_by: actorId ?? null };
  const { data, error } = input.id ? await db.from("seo_articles").update(payload).eq("id", input.id).select("*").single() : await db.from("seo_articles").insert({ ...payload, created_by: actorId ?? null }).select("*").single();
  if (error) throw error;
  await logAudit({ action: "WEBSITE_CONTENT_UPDATED", entityType: "seo_articles", entityId: data.id, actorId, actorRole: role });
  return data as Article;
}
export async function setArticleStatus(id: string, status: Article["status"], role: StaffRole, actorId?: string) {
  guard(role); const db = getServiceRoleClient() as any;
  const { error } = await db.from("seo_articles").update({ status, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString(), updated_by: actorId ?? null }).eq("id", id);
  if (error) throw error;
  await logAudit({ action: "WEBSITE_CONTENT_PUBLISHED", entityType: "seo_articles", entityId: id, actorId, actorRole: role, metadata: { status } });
}
