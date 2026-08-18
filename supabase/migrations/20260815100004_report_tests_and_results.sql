-- Phase 2B — Report Tests, Result Values, Reference Ranges, Version History

-- ---------------------------------------------------------------------------
-- report_tests — join between a report and a test added to it
-- ---------------------------------------------------------------------------
create table public.report_tests (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references public.lab_reports(id) on delete cascade,
  test_id uuid not null references public.tests(id),
  status report_test_status not null default 'completed',
  comment text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.report_tests is
  'One row per test added to a report. This is what lets one report contain FBS + BP + PCV, or Genotype + Blood Group, etc.';

create index report_tests_lab_report_id_idx on public.report_tests (lab_report_id);
create index report_tests_test_id_idx on public.report_tests (test_id);

-- ---------------------------------------------------------------------------
-- result_field_values — actual entered values for field_based tests
-- ---------------------------------------------------------------------------
create table public.result_field_values (
  id uuid primary key default gen_random_uuid(),
  report_test_id uuid not null references public.report_tests(id) on delete cascade,
  template_field_id uuid not null references public.template_fields(id),
  value_text text,
  value_numeric numeric,
  unit text,
  -- Snapshotted at entry time from reference_ranges — historical reports do
  -- not change if the reference_ranges configuration changes later
  -- (Phase 2A §11 / Phase 2B rule #6).
  reference_range_display text,
  flag result_flag,
  created_at timestamptz not null default now(),
  unique (report_test_id, template_field_id),
  constraint result_field_values_value_required
    check (value_text is not null or value_numeric is not null)
);

comment on table public.result_field_values is
  'One row per template_field per report_test. Covers Numeric, Text, Positive/Negative, Select, Genotype, Blood Group, Blood Pressure.';

create index result_field_values_report_test_id_idx on public.result_field_values (report_test_id);

-- ---------------------------------------------------------------------------
-- result_table_cells — actual entered values for table_based tests
-- ---------------------------------------------------------------------------
create table public.result_table_cells (
  id uuid primary key default gen_random_uuid(),
  report_test_id uuid not null references public.report_tests(id) on delete cascade,
  template_table_row_id uuid not null references public.template_table_rows(id),
  template_table_column_id uuid not null references public.template_table_columns(id),
  value text,
  created_at timestamptz not null default now(),
  unique (report_test_id, template_table_row_id, template_table_column_id)
);

comment on table public.result_table_cells is
  'One row per (row x column) per report_test. Covers Widal and any future table-based test.';

create index result_table_cells_report_test_id_idx on public.result_table_cells (report_test_id);

-- ---------------------------------------------------------------------------
-- reference_ranges — admin-managed lookup, scoped to test + field
-- ---------------------------------------------------------------------------
create table public.reference_ranges (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  template_field_id uuid references public.template_fields(id),
  sex text check (sex in ('Male', 'Female')),
  age_min_years integer,
  age_max_years integer,
  range_low numeric,
  range_high numeric,
  range_text text,
  unit text,
  created_at timestamptz not null default now()
);

comment on table public.reference_ranges is
  'Admin-configured expected ranges, optionally scoped by sex/age. Resolved value is copied onto result_field_values at entry time, never read live by historical reports.';

create index reference_ranges_test_id_idx on public.reference_ranges (test_id);
create index reference_ranges_template_field_id_idx on public.reference_ranges (template_field_id);

-- ---------------------------------------------------------------------------
-- report_versions — audit trail (Phase 2A §11 / Phase 2B rules #7-8)
-- ---------------------------------------------------------------------------
create table public.report_versions (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references public.lab_reports(id) on delete cascade,
  version_number integer not null,
  change_type report_version_change_type not null,
  -- Immutable full snapshot of the report + its tests + result values at
  -- this point in time, so a published report can never be silently
  -- overwritten without a retrievable prior version.
  snapshot jsonb not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  unique (lab_report_id, version_number)
);

comment on table public.report_versions is
  'Immutable snapshot taken on every status transition and on any edit to a published report. Published reports are never silently overwritten.';

create index report_versions_lab_report_id_idx on public.report_versions (lab_report_id);
