-- Phase 2B — Test Catalog layer
-- test_categories, test_templates, template_fields, template_table_columns,
-- template_table_rows, tests. Admin-managed; no test structure is hard-coded
-- into the application.

-- ---------------------------------------------------------------------------
-- test_categories
-- ---------------------------------------------------------------------------
create table public.test_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.test_categories is
  'Fixed classification list for the test catalog (Hematology, Clinical Chemistry, etc). Admin-extensible.';

-- ---------------------------------------------------------------------------
-- test_templates
-- ---------------------------------------------------------------------------
create table public.test_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  structure_type test_structure_type not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.test_templates is
  'Reusable result structure (field-based or table-based). Multiple tests can share one template.';

-- ---------------------------------------------------------------------------
-- template_fields — only meaningful for structure_type = field_based
-- ---------------------------------------------------------------------------
create table public.template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.test_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  input_type field_input_type not null,
  unit text,
  options jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, field_key),
  constraint template_fields_select_requires_options
    check (input_type <> 'select' or options is not null)
);

comment on table public.template_fields is
  'The discrete input(s) that make up a field_based template''s result, e.g. Blood Pressure -> systolic + diastolic.';

-- ---------------------------------------------------------------------------
-- template_table_columns — only meaningful for structure_type = table_based
-- ---------------------------------------------------------------------------
create table public.template_table_columns (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.test_templates(id) on delete cascade,
  column_key text not null,
  column_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, column_key)
);

comment on table public.template_table_columns is
  'Columns for a table_based template, e.g. Widal -> O, H.';

-- ---------------------------------------------------------------------------
-- template_table_rows — only meaningful for structure_type = table_based
-- An admin can add more rows later (e.g. a new antigen) without code changes.
-- ---------------------------------------------------------------------------
create table public.template_table_rows (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.test_templates(id) on delete cascade,
  row_key text not null,
  row_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, row_key)
);

comment on table public.template_table_rows is
  'Default rows for a table_based template, e.g. Widal -> S. Typhi, S. Paratyphi A/B/C.';

-- ---------------------------------------------------------------------------
-- tests — the catalog entries a scientist actually selects
-- ---------------------------------------------------------------------------
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.test_categories(id),
  template_id uuid not null references public.test_templates(id),
  name text not null unique,
  code text unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tests is
  'Test catalog. Adding a new test = pick a category + an existing or new template, no code change required.';

create index tests_category_id_idx on public.tests (category_id);
create index tests_template_id_idx on public.tests (template_id);
create index template_fields_template_id_idx on public.template_fields (template_id);
create index template_table_columns_template_id_idx on public.template_table_columns (template_id);
create index template_table_rows_template_id_idx on public.template_table_rows (template_id);
