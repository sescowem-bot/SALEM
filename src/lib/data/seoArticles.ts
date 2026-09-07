import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { getSiteMediaPublicUrl } from "./storage";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

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
  guard(role);
  const db = getServiceRoleClient() as any;
  const now = new Date().toISOString();
  const { id, created_by: _createdBy, updated_by: _updatedBy, updated_at: _updatedAt, published_at: inputPublishedAt, ...fields } = input as any;

  const payload = {
    ...fields,
    title: input.title.trim(),
    slug: input.slug.trim().toLowerCase(),
    content: input.content.trim(),
    updated_at: now,
    updated_by: actorId ?? null,
  };

  // Never clear an existing publish timestamp merely because an editor saves.
  // Publication is controlled explicitly by setArticleStatus().
  if (!id && payload.status === "published") payload.published_at = inputPublishedAt ?? now;

  const result = id
    ? await db.from("seo_articles").update(payload).eq("id", id).select("*").single()
    : await db.from("seo_articles").insert({ ...payload, created_by: actorId ?? null }).select("*").single();

  if (result.error) throw result.error;
  await logAudit({ action: "WEBSITE_CONTENT_UPDATED", entityType: "seo_articles", entityId: result.data.id, actorId, actorRole: role });
  return result.data as Article;
}

export async function uploadArticleFeaturedImage(input: {
  articleId: string;
  file: File;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<string> {
  guard(input.actorRole);
  const allowed = ["image/jpeg", "image/png", "image/webp"] as const;
  if (!allowed.includes(input.file.type as (typeof allowed)[number])) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (input.file.size > 5 * 1024 * 1024) {
    throw new Error("Featured image is too large. The limit is 5MB.");
  }

  const db = getServiceRoleClient() as any;
  let imageUrl: string;
  if (isCloudinaryConfigured()) {
    const uploaded = await uploadToCloudinary({
      file: input.file,
      fileName: input.file.name,
      folder: `salem/blog/${input.articleId}`,
      resourceType: "image",
    });
    if (!uploaded?.secure_url) throw new Error("Cloudinary did not return an image URL.");
    imageUrl = uploaded.secure_url;
  } else {
    const ext = input.file.type === "image/png" ? "png" : input.file.type === "image/webp" ? "webp" : "jpg";
    const path = `blog/${input.articleId}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from("site-media").upload(path, input.file, { contentType: input.file.type, upsert: false });
    if (error) throw error;
    imageUrl = getSiteMediaPublicUrl(path);
  }

  const { error } = await db.from("seo_articles").update({
    featured_image_url: imageUrl,
    updated_at: new Date().toISOString(),
    updated_by: input.actorId ?? null,
  }).eq("id", input.articleId);
  if (error) throw error;

  await logAudit({
    action: "WEBSITE_CONTENT_UPDATED",
    entityType: "seo_articles",
    entityId: input.articleId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { featuredImageUploaded: true, fileName: input.file.name },
  });

  return imageUrl;
}

export async function setArticleStatus(id: string, status: Article["status"], role: StaffRole, actorId?: string): Promise<Article> {
  guard(role);
  const db = getServiceRoleClient() as any;
  const now = new Date().toISOString();
  const patch = {
    status,
    published_at: status === "published" ? now : null,
    updated_at: now,
    updated_by: actorId ?? null,
  };
  const { data, error } = await db.from("seo_articles").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  await logAudit({ action: "WEBSITE_CONTENT_PUBLISHED", entityType: "seo_articles", entityId: id, actorId, actorRole: role, metadata: { status } });
  return data as Article;
}
