"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { upsertArticle, setArticleStatus, uploadArticleFeaturedImage } from "@/lib/data/seoArticles";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export type ArticleActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  article?: any;
};

export async function saveArticleAction(formData: FormData): Promise<ArticleActionState> {
  try {
    const staff = await requireStaff();
    const id = clean(formData.get("id")) || undefined;
    const title = clean(formData.get("title"));
    const slug = clean(formData.get("slug"));
    const content = String(formData.get("content") ?? "").trim();

    if (!title) return { ok: false, error: "Article title is required." };
    if (!slug) return { ok: false, error: "URL slug is required." };
    if (!content) return { ok: false, error: "Article content is required." };

    const status = (clean(formData.get("status")) || "draft") as "draft" | "published" | "archived";
    if (!["draft", "published", "archived"].includes(status)) return { ok: false, error: "Invalid article status." };

    const article = await upsertArticle(
      {
        id,
        title,
        slug,
        excerpt: clean(formData.get("excerpt")) || null,
        content,
        seo_title: clean(formData.get("seo_title")) || null,
        seo_description: clean(formData.get("seo_description")) || null,
        status,
        featured_image_url: clean(formData.get("featured_image_url")) || null,
      },
      staff.role,
      staff.userId,
    );

    revalidatePath("/admin/seo-performance/articles");
    revalidatePath("/blog");
    revalidatePath(`/blog/${article.slug}`);

    return { ok: true, message: id ? "Article saved successfully." : "Article created and saved as a draft.", article };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the article." };
  }
}

export async function publishArticleAction(formData: FormData): Promise<ArticleActionState> {
  try {
    const staff = await requireStaff();
    const id = clean(formData.get("id"));
    if (!id) return { ok: false, error: "Save the article first before publishing." };

    const article = await setArticleStatus(id, "published", staff.role, staff.userId);
    revalidatePath("/admin/seo-performance/articles");
    revalidatePath("/blog");
    if (article?.slug) revalidatePath(`/blog/${article.slug}`);

    return { ok: true, message: "Article published successfully.", article };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not publish the article." };
  }
}

export async function uploadArticleFeaturedImageAction(formData: FormData): Promise<{ ok?: boolean; error?: string; imageUrl?: string }> {
  const staff = await requireStaff();
  const id = String(formData.get("id") || "");
  const file = formData.get("file");
  if (!id) return { error: "Save the article first, then upload its featured image." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a featured image to upload." };
  try {
    const imageUrl = await uploadArticleFeaturedImage({ articleId: id, file, actorRole: staff.role, actorId: staff.userId });
    revalidatePath("/admin/seo-performance/articles");
    revalidatePath("/blog");
    return { ok: true, imageUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not upload featured image." };
  }
}
