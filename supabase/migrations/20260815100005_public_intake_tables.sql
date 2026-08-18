-- Phase 2B — Public intake tables
-- Prepares the backend for future appointments / home collection / contact
-- forms. Deliberately separate from the laboratory result architecture.
-- The existing public website forms are NOT wired to these tables yet —
-- this migration only creates the backend foundation.

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  preferred_date date,
  preferred_time text,
  location_type text check (location_type in ('lab', 'home')),
  test_or_package text,
  notes text,
  status intake_status not null default 'new',
  created_at timestamptz not null default now()
);

comment on table public.appointment_requests is
  'Backend foundation for the future Book an Appointment flow. Not wired to the public UI in Phase 2B.';

create table public.home_collection_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  address text,
  preferred_date date,
  preferred_time text,
  notes text,
  status intake_status not null default 'new',
  created_at timestamptz not null default now()
);

comment on table public.home_collection_requests is
  'Backend foundation for the future Home Collection request flow. Not wired to the public UI in Phase 2B.';

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  message text not null,
  status intake_status not null default 'new',
  created_at timestamptz not null default now()
);

comment on table public.contact_submissions is
  'Backend foundation for the future Contact form. Not wired to the public UI in Phase 2B.';

create index appointment_requests_status_idx on public.appointment_requests (status);
create index home_collection_requests_status_idx on public.home_collection_requests (status);
create index contact_submissions_status_idx on public.contact_submissions (status);
