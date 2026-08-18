-- Phase 2B — Row Level Security
--
-- There is no Supabase Auth yet (explicitly out of scope for this phase), so
-- there is no authenticated "staff" role to grant policies to. Until Auth
-- exists, ALL reads and writes to every table below are performed
-- server-side using the service role key, which bypasses RLS entirely and is
-- never exposed to the browser (see .env.example and
-- src/lib/supabase/service-client.ts).
--
-- RLS is enabled on every table regardless, and NO anon/authenticated
-- policies are created for patient/report/result data — this is a deny-by-
-- default posture. When Phase 3 (Authentication) introduces a staff role,
-- scoped policies replace this blanket lockdown; nothing here needs to be
-- undone, only added to.

alter table public.test_categories        enable row level security;
alter table public.test_templates         enable row level security;
alter table public.template_fields        enable row level security;
alter table public.template_table_columns enable row level security;
alter table public.template_table_rows    enable row level security;
alter table public.tests                  enable row level security;
alter table public.signatories            enable row level security;
alter table public.patients               enable row level security;
alter table public.lab_reports            enable row level security;
alter table public.report_tests           enable row level security;
alter table public.result_field_values    enable row level security;
alter table public.result_table_cells     enable row level security;
alter table public.reference_ranges       enable row level security;
alter table public.report_versions        enable row level security;

-- Explicitly required by Phase 2B: no unrestricted public SELECT on these.
-- (No policy is created for them at all — RLS enabled + zero policies means
-- anon/authenticated get zero rows; only the service role can read them.)
--   patients, lab_reports, report_tests, result_field_values,
--   result_table_cells, report_versions
--
-- The remaining tables (test_categories, test_templates, template_fields,
-- template_table_columns, template_table_rows, tests, signatories,
-- reference_ranges) are catalog/config data, not patient data — but since no
-- public feature reads them yet either, they are left locked down the same
-- way for now rather than speculatively opened up. Revisit when a concrete
-- public use case (e.g. a "tests we offer" page) actually needs them.

-- ---------------------------------------------------------------------------
-- Public intake tables: anon may INSERT (submit a form) but never SELECT,
-- UPDATE, or DELETE. Only the service role (admin inbox, built later) reads
-- submissions back.
-- ---------------------------------------------------------------------------
alter table public.appointment_requests     enable row level security;
alter table public.home_collection_requests enable row level security;
alter table public.contact_submissions      enable row level security;

create policy "anon can submit appointment requests"
  on public.appointment_requests
  for insert
  to anon, authenticated
  with check (true);

create policy "anon can submit home collection requests"
  on public.home_collection_requests
  for insert
  to anon, authenticated
  with check (true);

create policy "anon can submit contact messages"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);
