"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { saveDraftContent, publishPageContent, unpublishPageContent } from "@/lib/data/websitePages";
import { updateSiteSettings, type SiteSettingsInput } from "@/lib/data/siteSettings";
import { uploadSiteMedia, removeSiteMediaSlot, type SiteMediaSlot } from "@/lib/data/storage";
import {
  homepageContentSchema,
  aboutContentSchema,
  contactContentSchema,
  footerContentSchema,
  seoContentSchema,
  siteSettingsSchema,
} from "@/lib/validation/schemas";
import type { WebsitePageKey } from "@/lib/supabase/database.types";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

const SCHEMAS_BY_PAGE: Record<WebsitePageKey, (typeof homepageContentSchema)> = {
  homepage: homepageContentSchema,
  about: aboutContentSchema as unknown as typeof homepageContentSchema,
  contact: contactContentSchema as unknown as typeof homepageContentSchema,
  footer: footerContentSchema as unknown as typeof homepageContentSchema,
  seo: seoContentSchema as unknown as typeof homepageContentSchema,
};

const PUBLIC_PATH_BY_PAGE: Record<WebsitePageKey, string> = {
  homepage: "/",
  about: "/about",
  contact: "/contact",
  footer: "/",
  seo: "/",
};

function stripEmpty(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "" || v === undefined) continue;
    out[k] = v === "true" ? true : v === "false" ? false : v;
  }
  return out;
}

export async function saveWebsiteDraftAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const pageKey = formData.get("pageKey") as WebsitePageKey;
  const contentRaw = formData.get("content") as string;
  if (!pageKey || !contentRaw) return { error: "Missing content." };

  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(contentRaw);
  } catch {
    return { error: "Invalid content payload." };
  }

  const schema = SCHEMAS_BY_PAGE[pageKey];
  if (!schema) return { error: "Unknown page." };

  const validated = schema.safeParse(parsedJson);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Invalid content." };

  try {
    await saveDraftContent(pageKey, stripEmpty(validated.data), staff.role, staff.userId);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to manage website content." };
    }
    return { error: err instanceof Error ? err.message : "Could not save draft." };
  }

  revalidatePath(`/admin/website/${pageKey}`);
  revalidatePath(`/admin/website/preview/${pageKey}`);
  return { ok: true };
}

export async function publishWebsiteContentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const pageKey = formData.get("pageKey") as WebsitePageKey;
  if (!pageKey) return { error: "Missing page." };

  try {
    await publishPageContent(pageKey, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not publish." };
  }

  revalidatePath(`/admin/website/${pageKey}`);
  revalidatePath(PUBLIC_PATH_BY_PAGE[pageKey]);
  return { ok: true };
}

export async function unpublishWebsiteContentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const pageKey = formData.get("pageKey") as WebsitePageKey;
  if (!pageKey) return { error: "Missing page." };

  try {
    await unpublishPageContent(pageKey, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not unpublish." };
  }

  revalidatePath(`/admin/website/${pageKey}`);
  revalidatePath(PUBLIC_PATH_BY_PAGE[pageKey]);
  return { ok: true };
}

export async function updateSiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const raw = Object.fromEntries(formData.entries());
  const validated = siteSettingsSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.issues[0]?.message ?? "Invalid settings." };

  const snakeCase: SiteSettingsInput = {
    org_name: validated.data.orgName || null,
    short_name: validated.data.shortName || null,
    tagline: validated.data.tagline || null,
    description: validated.data.description || null,
    copyright_text: validated.data.copyrightText || null,
    email_primary: validated.data.emailPrimary || null,
    email_secondary: validated.data.emailSecondary || null,
    phone_primary: validated.data.phonePrimary || null,
    phone_secondary: validated.data.phoneSecondary || null,
    whatsapp_number: validated.data.whatsappNumber || null,
    address_line1: validated.data.addressLine1 || null,
    address_line2: validated.data.addressLine2 || null,
    city: validated.data.city || null,
    state: validated.data.state || null,
    hours_weekdays: validated.data.hoursWeekdays || null,
    hours_weekend: validated.data.hoursWeekend || null,
    social_facebook: validated.data.socialFacebook || null,
    social_instagram: validated.data.socialInstagram || null,
    social_linkedin: validated.data.socialLinkedin || null,
    social_twitter: validated.data.socialTwitter || null,
    social_youtube: validated.data.socialYoutube || null,
    patient_email_includes_access_code: validated.data.patientEmailIncludesAccessCode === "true",
    booking_window_days: validated.data.bookingWindowDays ? Number(validated.data.bookingWindowDays) : undefined,
    booking_min_notice_hours: validated.data.bookingMinNoticeHours ? Number(validated.data.bookingMinNoticeHours) : undefined,
  };

  try {
    await updateSiteSettings(snakeCase, staff.role, staff.userId);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return { error: "You do not have permission to update website settings." };
    }
    return { error: err instanceof Error ? err.message : "Could not save settings." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function uploadSiteMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const slot = formData.get("slot") as SiteMediaSlot;
  const file = formData.get("file") as File | null;
  if (!slot) return { error: "Missing media slot." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };

  try {
    await uploadSiteMedia({
      slot,
      file,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      actorRole: staff.role,
      actorId: staff.userId,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not upload image." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeSiteMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const slot = formData.get("slot") as SiteMediaSlot;
  if (!slot) return { error: "Missing media slot." };

  try {
    await removeSiteMediaSlot(slot, staff.role, staff.userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not remove image." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
