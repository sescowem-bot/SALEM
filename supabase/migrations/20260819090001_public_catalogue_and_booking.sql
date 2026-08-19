-- Phase 5 — Public catalogue fields, home-collection workflow, rate limiting,
-- audit actions, and a phlebotomist RLS scoping fix.

-- ---------------------------------------------------------------------------
-- 0. Booking reference identifiers (Phase 5 §2: "generate a booking/
--    reference identifier"). Opaque, generated server-side at submission —
--    see lib/data/security.ts generateBookingReference().
-- ---------------------------------------------------------------------------
alter table public.appointment_requests
  add column booking_reference text unique;

alter table public.home_collection_requests
  add column booking_reference text unique;

-- ---------------------------------------------------------------------------
-- 1. Public test catalogue fields (nullable — never invented, only shown
--    when a real value has been entered by staff).
-- ---------------------------------------------------------------------------
alter table public.tests
  add column public_description text,
  add column preparation_info text,
  add column price_ngn numeric,
  add column show_price boolean not null default false;

comment on column public.tests.show_price is
  'Explicit opt-in. Price is never shown publicly just because price_ngn is set — staff must also set this true.';

-- ---------------------------------------------------------------------------
-- 2. Home Sample Collection workflow: dedicated status vocabulary + assignment.
--    Kept separate from `intake_status` (still used by appointment_requests
--    and contact_submissions) since the requested values differ.
-- ---------------------------------------------------------------------------
create type home_collection_status as enum (
  'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'
);

alter table public.home_collection_requests
  alter column status drop default;

alter table public.home_collection_requests
  alter column status type home_collection_status using (
    case status::text
      when 'new' then 'pending'
      when 'contacted' then 'confirmed'
      when 'scheduled' then 'confirmed'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      else 'pending'
    end
  )::home_collection_status;

alter table public.home_collection_requests
  alter column status set default 'pending';

alter table public.home_collection_requests
  add column assigned_phlebotomist_id uuid references public.staff_profiles(id);

create index home_collection_requests_assigned_idx
  on public.home_collection_requests (assigned_phlebotomist_id);

-- ---------------------------------------------------------------------------
-- 3. Phlebotomist RLS scoping: previously any phlebotomist could read/update
--    every home-collection request. Phase 5 requires assignment scoping.
--    super_admin/admin keep full access via a separate policy.
-- ---------------------------------------------------------------------------
drop policy if exists "phlebotomists and admins can read home_collection_requests" on public.home_collection_requests;
drop policy if exists "phlebotomists and admins can update home_collection_requests" on public.home_collection_requests;

create policy "admins can read all home_collection_requests"
  on public.home_collection_requests for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));

create policy "phlebotomists can read assigned home_collection_requests"
  on public.home_collection_requests for select
  to authenticated
  using (public.current_staff_role() = 'phlebotomist' and assigned_phlebotomist_id = auth.uid());

create policy "admins can update all home_collection_requests"
  on public.home_collection_requests for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'))
  with check (public.current_staff_role() in ('super_admin', 'admin'));

create policy "phlebotomists can update assigned home_collection_requests"
  on public.home_collection_requests for update
  to authenticated
  using (public.current_staff_role() = 'phlebotomist' and assigned_phlebotomist_id = auth.uid())
  with check (public.current_staff_role() = 'phlebotomist' and assigned_phlebotomist_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Rate limiting for public form submissions (booking, home collection,
--    contact) — same pattern as Phase 4's result_access_attempts.
-- ---------------------------------------------------------------------------
create table public.public_form_attempts (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  ip_hash text not null,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index public_form_attempts_lookup_idx
  on public.public_form_attempts (form_type, ip_hash, created_at desc);

alter table public.public_form_attempts enable row level security;

create policy "admins can read public_form_attempts"
  on public.public_form_attempts for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));

-- ---------------------------------------------------------------------------
-- 5. New audit actions for booking / home-collection workflow.
-- ---------------------------------------------------------------------------
alter type audit_action add value if not exists 'BOOKING_CREATED';
alter type audit_action add value if not exists 'BOOKING_STATUS_UPDATED';
alter type audit_action add value if not exists 'HOME_COLLECTION_CREATED';
alter type audit_action add value if not exists 'HOME_COLLECTION_STATUS_UPDATED';
alter type audit_action add value if not exists 'HOME_COLLECTION_ASSIGNED';
