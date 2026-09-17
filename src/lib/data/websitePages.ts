import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database, WebsitePageKey } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type WebsitePageRow = Database["public"]["Tables"]["website_pages"]["Row"];

function requireSettingsManage(actorRole: StaffRole) {
  if (!hasPermission(actorRole, "settings.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage website content.`);
  }
}

/** Admin read — full row including draft_content, for the editor and the status bar. */
export async function getWebsitePage(pageKey: WebsitePageKey, actorRole: StaffRole): Promise<WebsitePageRow> {
  requireSettingsManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("website_pages").select("*").eq("page_key", pageKey).single();
  if (error) throw error;
  return data;
}

/** Public read — published_content only, with a generic-shaped fallback of `{}` if never published. */
export async function getPublishedPageContent<T extends object>(pageKey: WebsitePageKey): Promise<T> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("website_pages").select("published_content").eq("page_key", pageKey).maybeSingle();
  if (error) throw error;
  return (data?.published_content as T) ?? ({} as T);
}

export async function saveDraftContent(
  pageKey: WebsitePageKey,
  content: Record<string, unknown>,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  requireSettingsManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("website_pages")
    .update({ draft_content: content, status: "draft", updated_at: new Date().toISOString(), updated_by: actorId ?? null })
    .eq("page_key", pageKey);
  if (error) throw error;

  await logAudit({
    action: "WEBSITE_CONTENT_UPDATED",
    entityType: "website_pages",
    entityId: pageKey,
    actorId,
    actorRole,
  });
}

export async function publishPageContent(pageKey: WebsitePageKey, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireSettingsManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data: current, error: readError } = await supabase
    .from("website_pages")
    .select("draft_content")
    .eq("page_key", pageKey)
    .single();
  if (readError) throw readError;

  const { error } = await supabase
    .from("website_pages")
    .update({
      published_content: current.draft_content,
      status: "published",
      published_at: new Date().toISOString(),
      published_by: actorId ?? null,
    })
    .eq("page_key", pageKey);
  if (error) throw error;

  await logAudit({
    action: "WEBSITE_CONTENT_PUBLISHED",
    entityType: "website_pages",
    entityId: pageKey,
    actorId,
    actorRole,
  });
}

/** Reverts the page to unpublished — published_content is cleared, so the public site falls back to defaults. Draft content is untouched. */
export async function unpublishPageContent(pageKey: WebsitePageKey, actorRole: StaffRole, actorId?: string): Promise<void> {
  requireSettingsManage(actorRole);
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("website_pages")
    .update({ published_content: null, status: "draft" })
    .eq("page_key", pageKey);
  if (error) throw error;

  await logAudit({
    action: "WEBSITE_CONTENT_UNPUBLISHED",
    entityType: "website_pages",
    entityId: pageKey,
    actorId,
    actorRole,
  });
}

export async function listAllWebsitePages(actorRole: StaffRole): Promise<WebsitePageRow[]> {
  requireSettingsManage(actorRole);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("website_pages").select("*").order("page_key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
