import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { siteConfig } from "@/data/siteContent";
import { logAudit } from "./audit";
import { getSiteMediaPublicUrl } from "./storage";

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

/**
 * Merged shape consumed by public site components — the DB row's non-null
 * fields override the static siteConfig defaults, so a field nobody has
 * edited yet still renders correctly (Phase O: never blank the site just
 * because a CMS field is empty).
 */
export interface ResolvedSiteSettings {
  orgName: string;
  shortName: string | null;
  tagline: string;
  description: string | null;
  copyrightText: string | null;
  logoPath: string | null;
  logoLightPath: string | null;
  faviconPath: string | null;
  ogImagePath: string | null;
  letterheadPath: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  letterheadUrl: string | null;
  patientEmailIncludesAccessCode: boolean;
  emailPrimary: string;
  emailSecondary: string | null;
  phonePrimary: string;
  phonePrimaryHref: string;
  phoneSecondary: string | null;
  whatsappNumber: string;
  whatsappHref: string;
  addressLine1: string;
  addressLine2: string;
  city: string | null;
  state: string | null;
  hoursWeekdays: string;
  hoursWeekend: string;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialLinkedin: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  bookingWindowDays: number;
  bookingMinNoticeHours: number;
}

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
function toWhatsAppHref(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

function resolve(row: SiteSettingsRow | null): ResolvedSiteSettings {
  return {
    orgName: row?.org_name || siteConfig.name,
    shortName: row?.short_name ?? null,
    tagline: row?.tagline || siteConfig.tagline,
    description: row?.description ?? null,
    copyrightText: row?.copyright_text ?? null,
    logoPath: row?.logo_path ?? null,
    logoLightPath: row?.logo_light_path ?? null,
    faviconPath: row?.favicon_path ?? null,
    ogImagePath: row?.og_image_path ?? null,
    letterheadPath: row?.letterhead_path ?? null,
    logoUrl: row?.logo_path ? getSiteMediaPublicUrl(row.logo_path) : null,
    logoLightUrl: row?.logo_light_path ? getSiteMediaPublicUrl(row.logo_light_path) : null,
    faviconUrl: row?.favicon_path ? getSiteMediaPublicUrl(row.favicon_path) : null,
    ogImageUrl: row?.og_image_path ? getSiteMediaPublicUrl(row.og_image_path) : null,
    letterheadUrl: row?.letterhead_path ? getSiteMediaPublicUrl(row.letterhead_path) : null,
    patientEmailIncludesAccessCode: row?.patient_email_includes_access_code ?? false,
    emailPrimary: row?.email_primary || siteConfig.email.general,
    emailSecondary: row?.email_secondary ?? null,
    phonePrimary: row?.phone_primary || siteConfig.phone.primary,
    phonePrimaryHref: toTelHref(row?.phone_primary || siteConfig.phone.primary),
    phoneSecondary: row?.phone_secondary ?? null,
    whatsappNumber: row?.whatsapp_number || siteConfig.phone.whatsapp,
    whatsappHref: toWhatsAppHref(row?.whatsapp_number || siteConfig.phone.whatsapp),
    addressLine1: row?.address_line1 || siteConfig.address.line1,
    addressLine2: row?.address_line2 || siteConfig.address.line2,
    city: row?.city ?? null,
    state: row?.state ?? null,
    hoursWeekdays: row?.hours_weekdays || siteConfig.hours.weekdays,
    hoursWeekend: row?.hours_weekend || siteConfig.hours.weekend,
    socialFacebook: row?.social_facebook ?? null,
    socialInstagram: row?.social_instagram || siteConfig.social.instagramUrl,
    socialLinkedin: row?.social_linkedin ?? null,
    socialTwitter: row?.social_twitter ?? null,
    socialYoutube: row?.social_youtube ?? null,
    bookingWindowDays: row?.booking_window_days ?? 14,
    bookingMinNoticeHours: row?.booking_min_notice_hours ?? 2,
  };
}

/** Public read — safe to call from any server component. */
export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;
  return resolve(data);
}

/** Raw row for the admin settings form (needs to distinguish "unset" from "using fallback"). */
export async function getSiteSettingsRow(actorRole: StaffRole): Promise<SiteSettingsRow> {
  if (!hasPermission(actorRole, "settings.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view website settings.`);
  }
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

export type SiteSettingsInput = Partial<Omit<SiteSettingsRow, "id" | "updated_at" | "updated_by">>;

export async function updateSiteSettings(input: SiteSettingsInput, actorRole: StaffRole, actorId?: string): Promise<void> {
  if (!hasPermission(actorRole, "settings.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update website settings.`);
  }
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...input, updated_at: new Date().toISOString(), updated_by: actorId ?? null })
    .eq("id", true);
  if (error) throw error;

  await logAudit({
    action: "SITE_SETTINGS_UPDATED",
    entityType: "site_settings",
    actorId,
    actorRole,
    metadata: { updated: Object.keys(input) },
  });
}
