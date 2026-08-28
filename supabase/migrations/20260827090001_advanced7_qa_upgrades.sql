-- Advanced 7 QA / upgrade pass. This is an UPGRADE of existing systems —
-- appointment booking, home collection, the service/investigation
-- catalogue, and site settings all already exist (see the migrations this
-- one alters). Every change below is additive (new nullable columns or
-- columns with safe defaults) so it carries no risk to existing data and
-- needs no backfill beyond the defaults set inline.

-- ---------------------------------------------------------------------------
-- 1. Appointment requests — admin-facing fields the staff UI was missing:
--    an internal notes field distinct from the patient's own `notes`, and
--    the ability to reschedule (change date/time) with a record of what the
--    patient originally requested, so "reschedule" doesn't silently destroy
--    the original request.
-- ---------------------------------------------------------------------------
alter table public.appointment_requests
  add column if not exists admin_notes text,
  add column if not exists rescheduled_date date,
  add column if not exists rescheduled_time text;

comment on column public.appointment_requests.admin_notes is
  'Staff-only annotations (e.g. "confirmed by phone", "patient asked to move earlier"). Distinct from `notes`, which is patient-submitted at booking time.';
comment on column public.appointment_requests.rescheduled_date is
  'Set by staff when they reschedule a request to a different date/time than the patient originally selected. `preferred_date`/`preferred_time` always keep the patient''s original request untouched.';

-- ---------------------------------------------------------------------------
-- 2. Home collection payment tracking. Requirement: "Payment must be
--    admin-controlled ... without hardcoding one payment workflow" — so this
--    is a plain status + optional free-text fields staff set manually, not a
--    payment gateway integration or a fixed pay-online-only flow.
-- ---------------------------------------------------------------------------
create type home_collection_payment_status as enum (
  'unpaid', 'pending', 'paid', 'waived'
);

alter table public.home_collection_requests
  add column if not exists payment_status home_collection_payment_status not null default 'unpaid',
  add column if not exists payment_amount_ngn numeric,
  add column if not exists payment_notes text;

comment on column public.home_collection_requests.payment_status is
  'Admin-controlled only. No payment gateway is wired to this — staff set this manually to whatever reflects reality (paid at door, transfer confirmed, waived, etc.) so no single workflow is hardcoded.';

-- ---------------------------------------------------------------------------
-- 3. Investigation patient-facing detail fields. `public_description`
--    (tests) / `full_description` and `preparation_info` and `requirements`
--    (services CMS, migration 20260821090002) already cover description,
--    preparation, and "what to bring". Two are still missing: an explicit
--    "what to do/avoid" field and a distinct "important notes" callout.
-- ---------------------------------------------------------------------------
alter table public.tests
  add column if not exists what_to_avoid text,
  add column if not exists important_notes text;

comment on column public.tests.what_to_avoid is
  'Patient-facing "what to do / avoid" guidance (e.g. "avoid alcohol 24 hours before", "do not brush teeth before sample"). Shown on the service detail page and booking/test-details experience alongside preparation_info.';
comment on column public.tests.important_notes is
  'Patient-facing important notes/callout (e.g. "results may be delayed on public holidays"). Rendered as a distinct highlighted note, not folded into full_description.';

-- ---------------------------------------------------------------------------
-- 4. Site settings — booking window/rules. Nullable/sane-defaulted so
--    nothing breaks before an admin changes them.
--
--    Note: Google Maps location (§7 of the QA ticket) is deliberately NOT
--    added here — it already exists as `mapEmbedUrl` on the Contact page's
--    editable content (see ContactContent in websiteContentTypes.ts,
--    edited via /admin/website/contact). Adding a second location field on
--    site_settings would be exactly the kind of duplicate system this
--    ticket says not to create. The only genuinely missing piece there is
--    a "Get directions" link, added to that same existing content type
--    instead (no migration needed — website_pages content is JSON).
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists booking_window_days integer not null default 14,
  add column if not exists booking_min_notice_hours integer not null default 2;

comment on column public.site_settings.booking_window_days is
  'How many days ahead the public booking calendar allows selecting. Admin-controlled scheduling rule (Advanced 7 QA §2) — not hardcoded in the UI.';
comment on column public.site_settings.booking_min_notice_hours is
  'Minimum hours of notice required before the earliest bookable slot today. Admin-controlled.';
