-- Phase 2B — Signatories, Patients, Lab Reports
-- patients -> lab_reports is a fixed one-to-many relationship (Phase 2A rule #1).

-- ---------------------------------------------------------------------------
-- signatories — kept separate and admin-managed (Phase 2A rule #9 / 2B rule #9)
-- ---------------------------------------------------------------------------
create table public.signatories (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  qualification text,
  designation text,
  signature_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.signatories is
  'Real, admin-managed laboratory professionals authorized to sign off a report. No placeholder staff.';

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  sex text check (sex in ('Male', 'Female')),
  date_of_birth date,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.patients is
  'Minimal patient identity. Kept strictly separate from lab_reports so one patient can have many reports over time.';

create index patients_full_name_idx on public.patients using gin (to_tsvector('simple', full_name));

-- ---------------------------------------------------------------------------
-- lab_reports
-- ---------------------------------------------------------------------------
create table public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),

  -- Three distinct identifiers — never conflated (Phase 2A §5 / Phase 2B rule #2).
  lab_number text not null unique,
  result_reference text unique,
  access_code_hash text,

  -- Patient snapshot at time of report, independent of later edits to the
  -- master patients record.
  patient_name_snapshot text not null,
  patient_sex_snapshot text check (patient_sex_snapshot in ('Male', 'Female')),
  patient_dob_snapshot date,

  request text,
  specimen text,
  date_collected date,
  date_reported date,

  status report_status not null default 'draft',
  report_comment text,
  signatory_id uuid references public.signatories(id),
  current_version_number integer not null default 0,

  -- Audit trail (Phase 2A §11 / Phase 2B rule #7-8). auth.users FK will be
  -- added when Supabase Auth is implemented in a later phase — left as plain
  -- uuid for now so this schema does not depend on auth existing yet.
  created_by uuid,
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  archived_by uuid,
  archived_at timestamptz,
  last_modified_by uuid,
  last_modified_at timestamptz not null default now(),

  constraint lab_reports_reference_required_once_published
    check (status not in ('published', 'archived') or result_reference is not null)
);

comment on table public.lab_reports is
  'One row per lab visit/order. lab_number is internal; result_reference is the opaque public identifier generated only at publish time; access_code_hash is reserved for the future public portal and is never stored in plaintext.';

comment on column public.lab_reports.result_reference is
  'Opaque, randomly generated public identifier. NOT the lab_number, NOT the database id. Only ever exposed value in future public result URLs.';

comment on column public.lab_reports.access_code_hash is
  'Hash only (Phase 2B rule #4). Reserved for the future public patient-result portal, not implemented this phase.';

create index lab_reports_patient_id_idx on public.lab_reports (patient_id);
create index lab_reports_status_idx on public.lab_reports (status);
create index lab_reports_signatory_id_idx on public.lab_reports (signatory_id);
