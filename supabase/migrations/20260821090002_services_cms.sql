-- Advanced 2 — Services CMS.
--
-- Decision recorded here per the task's Part J: the existing `tests` table
-- (supabase/migrations/20260815100001) already models exactly what the
-- public site calls a "service" — a bookable diagnostic test with a name,
-- category, public description, preparation info and price — and it's the
-- same row `lib/data/testCatalog.ts getTestWithStructure()` reads to power
-- the internal Add-Result form via its `template_id`. A public-facing
-- "service" and an internal "test" are the same real-world thing here, so a
-- second `services` table would just be a duplicate system with its own
-- sync problem against `tests`. We extend `tests` instead.
--
-- `is_active` already existed and continues to mean exactly what it always
-- meant: "offered by the lab / selectable for booking and result entry" —
-- untouched, and /book and /admin/results-entry keep using it exactly as
-- before. The new `content_status` below is a separate, additive concept:
-- "ready to show on the public marketing site." A test can be active
-- (bookable, used for results) while its public content is still a draft.

create type service_status as enum ('draft', 'published', 'archived');

alter table public.tests
  add column slug text,
  add column full_description text,
  add column requirements text,
  add column turnaround_time text,
  add column featured boolean not null default false,
  add column cta_label text,
  add column cta_destination text,
  add column seo_title text,
  add column seo_description text,
  add column hero_image_path text,
  add column content_status service_status not null default 'draft',
  add column published_at timestamptz,
  add column published_by uuid references public.staff_profiles(id) on delete set null;

comment on column public.tests.content_status is
  'Services CMS publish state (draft/published/archived). Independent of is_active — is_active still gates booking/result-entry eligibility exactly as before this migration; content_status only gates whether the service appears on the public /services directory and has a live /services/[slug] page.';
comment on column public.tests.slug is
  'URL slug for /services/[slug]. Unique among non-null values. Backfilled below for existing rows; new rows must set one via the admin editor.';
comment on column public.tests.hero_image_path is
  'Path within the public "service-images" storage bucket. Never a raw external URL — resolved to a public URL via lib/data/storage.ts.';

-- Backfill: preserve current live behaviour exactly. Every test that is
-- already active is already visible on the public /services page today (it
-- has no publish gate yet), so backfilling it to 'published' means this
-- migration does not remove anything currently live. Inactive tests were
-- already hidden from the public site, so they backfill to 'archived' to
-- match. New tests created after this migration default to 'draft' per the
-- ticket's real draft -> preview -> publish workflow.
update public.tests set content_status = 'published', published_at = now() where is_active = true;
update public.tests set content_status = 'archived' where is_active = false;

-- Slug backfill: lower-case, non-alphanumerics to hyphens, trimmed. Collisions
-- (two tests with the same generated slug) get the row's short id suffixed
-- so the unique index below never fails on real data.
with generated as (
  select
    id,
    regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g') as base_slug
  from public.tests
),
deduped as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as rn
  from generated
)
update public.tests t
set slug = case when d.rn = 1 then d.base_slug else d.base_slug || '-' || left(t.id::text, 8) end
from deduped d
where t.id = d.id;

alter table public.tests alter column slug set not null;
create unique index tests_slug_key on public.tests (slug);
create index tests_content_status_idx on public.tests (content_status);
create index tests_featured_idx on public.tests (featured) where featured = true;

-- Public storage bucket for service marketing images. Distinct from the
-- private "lab-report-pdfs" bucket used for patient results — these are
-- not medical records, so a public-read bucket is the correct fit here,
-- not a weakening of the existing private-storage posture. Same write
-- posture as lab-report-pdfs though: no INSERT/UPDATE/DELETE policy for
-- anon/authenticated at all, so uploads/replacements/removals only ever
-- happen through the service-role client in lib/data/storage.ts, gated by
-- the catalogue.manage permission.
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

-- Advanced 2 audit actions, same pattern as the Advanced 1 migration.
alter type audit_action add value if not exists 'SERVICE_CREATED';
alter type audit_action add value if not exists 'SERVICE_UPDATED';
alter type audit_action add value if not exists 'SERVICE_PUBLISHED';
alter type audit_action add value if not exists 'SERVICE_UNPUBLISHED';
alter type audit_action add value if not exists 'SERVICE_ARCHIVED';
