-- Advanced 3 — Website & Brand Content CMS.
--
-- Architecture decision (Phase L): two tables, not the six-plus a
-- field-per-column design would need.
--
-- 1. `site_settings` — a singleton row for organisation identity/contact/
--    social data (Phase B). This is operational config, not "content" —
--    the same category as the staff/patient records the admin foundation
--    already edits immediately (no draft gate) — so it writes straight
--    through, same as those.
--
-- 2. `website_pages` — one row per editable page section (homepage, about,
--    contact-page-copy, footer, seo), each holding `draft_content` /
--    `published_content` JSONB blobs rather than dozens of dedicated
--    columns. A homepage alone needs ~18 fields across 4 sections; five
--    wide tables for this would be exactly the "unnecessary database
--    complexity" Phase Q warns against, and JSONB still gives us
--    real drafts, timestamps, published_by/updated_by and auditability —
--    everything Phase L actually requires.
--
-- Deliberate non-duplication (per Phase G's explicit instruction not to
-- duplicate settings data, extended the same way to Phase F): contact
-- details (email/phone/whatsapp/address/hours) and social links live only
-- in `site_settings`. The "contact" and "footer" website_pages rows hold
-- page copy only (heading/intro/description/CTA) — never a second copy of
-- the same phone number or address. Server components read both and merge
-- at render time.

create type website_page_key as enum ('homepage', 'about', 'contact', 'footer', 'seo');
create type website_content_status as enum ('draft', 'published');

create table public.site_settings (
  -- Singleton-row pattern: a boolean primary key that must be true means
  -- exactly one row can ever exist, without a separate constraint table.
  id boolean primary key default true,
  constraint site_settings_singleton check (id),

  org_name text,
  short_name text,
  tagline text,
  description text,
  copyright_text text,

  logo_path text,
  logo_light_path text,
  favicon_path text,
  og_image_path text,

  email_primary text,
  email_secondary text,
  phone_primary text,
  phone_secondary text,
  whatsapp_number text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  hours_weekdays text,
  hours_weekend text,

  social_facebook text,
  social_instagram text,
  social_linkedin text,
  social_twitter text,
  social_youtube text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_profiles(id) on delete set null
);

comment on table public.site_settings is
  'Singleton row of organisation-wide brand/contact/social settings (Advanced 3, Phase B). Writes take effect immediately, same posture as staff/patient records — this is operational config, not versioned page content.';

-- Seed the singleton from the values already live in src/data/siteContent.ts
-- so the CMS starts from real, currently-published data, not empty fields.
-- Fields the client has not yet confirmed (a real street address, business
-- hours) are left null here exactly as they were left as a placeholder
-- label in the source file — nothing invented.
insert into public.site_settings (
  id, org_name, tagline,
  email_primary, phone_primary, whatsapp_number,
  social_instagram
) values (
  true, 'Salem Medical Laboratories', 'Precision you can trust. Clarity you can understand. Peace you can feel.',
  'salemlaboratories@gmail.com', '+234 706 937 3993', '+234 706 937 3993',
  'https://www.instagram.com/salem_medical_laboratory/'
);

create table public.website_pages (
  page_key website_page_key primary key,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb,
  status website_content_status not null default 'draft',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_profiles(id) on delete set null,
  published_at timestamptz,
  published_by uuid references public.staff_profiles(id) on delete set null
);

comment on table public.website_pages is
  'Draft/publish-versioned content for editable website sections (Advanced 3). The public site only ever reads published_content — draft_content is admin-only preview data and must never be exposed on a public route.';

insert into public.website_pages (page_key) values ('homepage'), ('about'), ('contact'), ('footer'), ('seo');

create index website_pages_status_idx on public.website_pages (status);

-- Public storage bucket for brand/website media (logo, favicon, OG image,
-- homepage/about hero images) — same public-read-only, service-role-write
-- posture as the "service-images" bucket from the Services CMS. Kept as a
-- separate bucket from service-images so brand assets and service
-- marketing photos don't share one flat namespace.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Advanced 3 audit actions, same pattern as the prior two migrations.
alter type audit_action add value if not exists 'SITE_SETTINGS_UPDATED';
alter type audit_action add value if not exists 'WEBSITE_CONTENT_UPDATED';
alter type audit_action add value if not exists 'WEBSITE_CONTENT_PUBLISHED';
alter type audit_action add value if not exists 'WEBSITE_CONTENT_UNPUBLISHED';
alter type audit_action add value if not exists 'WEBSITE_MEDIA_UPLOADED';
alter type audit_action add value if not exists 'WEBSITE_MEDIA_REMOVED';
