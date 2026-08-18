-- Phase 2B — Test Catalog seed data
--
-- This file seeds the ADMIN-MANAGED TEST CATALOG (categories, templates,
-- fields, columns, rows, tests, reference ranges) for the six report
-- structures identified in Phase 2A: FBS, PCV, Blood Pressure, Genotype,
-- Blood Group, Widal.
--
-- This is catalog/reference configuration, not patient data — it is the
-- real list of tests the lab offers, appropriate for both development and
-- production. NO patients, lab_reports, report_tests, or result rows are
-- created here. No real (or fake) patient information is inserted anywhere
-- by this file, per Phase 2B rule: "Do not insert real patient information
-- from the supplied reports into production data."
--
-- Run via `supabase db reset` (local) or applied manually after migrations.

-- ---------------------------------------------------------------------------
-- Test categories
-- ---------------------------------------------------------------------------
insert into public.test_categories (name, sort_order) values
  ('Hematology', 1),
  ('Clinical Chemistry', 2),
  ('Microbiology', 3),
  ('Serology', 4),
  ('Immunology', 5),
  ('Parasitology', 6),
  ('Urinalysis', 7),
  ('Blood Grouping', 8),
  ('Other', 9);

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
insert into public.test_templates (id, name, structure_type, description) values
  ('00000000-0000-4000-a000-000000000001', 'Numeric (mg/dl)', 'field_based', 'Single numeric value reported in mg/dl.'),
  ('00000000-0000-4000-a000-000000000002', 'Numeric (%)', 'field_based', 'Single numeric value reported as a percentage.'),
  ('00000000-0000-4000-a000-000000000003', 'Blood Pressure', 'field_based', 'Systolic and diastolic numeric pair, displayed as systolic/diastolic mmHg.'),
  ('00000000-0000-4000-a000-000000000004', 'Genotype', 'field_based', 'Single select value from the standard genotype set.'),
  ('00000000-0000-4000-a000-000000000005', 'Blood Group', 'field_based', 'ABO group and Rhesus factor as two linked select fields.'),
  ('00000000-0000-4000-a000-000000000006', 'Widal Panel', 'table_based', 'Multi-row/multi-column agglutination titre panel (S. Typhi / S. Paratyphi A/B/C x O/H).');

-- Template fields (field_based templates)
insert into public.template_fields (template_id, field_key, label, input_type, unit, options, sort_order) values
  ('00000000-0000-4000-a000-000000000001', 'value', 'Result', 'numeric', 'mg/dl', null, 1),
  ('00000000-0000-4000-a000-000000000002', 'value', 'Result', 'numeric', '%', null, 1),
  ('00000000-0000-4000-a000-000000000003', 'systolic', 'Systolic', 'numeric', 'mmHg', null, 1),
  ('00000000-0000-4000-a000-000000000003', 'diastolic', 'Diastolic', 'numeric', 'mmHg', null, 2),
  ('00000000-0000-4000-a000-000000000004', 'value', 'Genotype', 'select', null, '["AA","AS","SS","AC","SC","CC"]', 1),
  ('00000000-0000-4000-a000-000000000005', 'abo_group', 'ABO Group', 'select', null, '["A","B","AB","O"]', 1),
  ('00000000-0000-4000-a000-000000000005', 'rhesus', 'Rhesus', 'select', null, '["Positive","Negative"]', 2);

-- Template table columns / rows (table_based template: Widal)
insert into public.template_table_columns (template_id, column_key, column_label, sort_order) values
  ('00000000-0000-4000-a000-000000000006', 'o', 'O', 1),
  ('00000000-0000-4000-a000-000000000006', 'h', 'H', 2);

insert into public.template_table_rows (template_id, row_key, row_label, sort_order) values
  ('00000000-0000-4000-a000-000000000006', 's_typhi', 'S. Typhi', 1),
  ('00000000-0000-4000-a000-000000000006', 's_paratyphi_a', 'S. Paratyphi A', 2),
  ('00000000-0000-4000-a000-000000000006', 's_paratyphi_b', 'S. Paratyphi B', 3),
  ('00000000-0000-4000-a000-000000000006', 's_paratyphi_c', 'S. Paratyphi C', 4);

-- ---------------------------------------------------------------------------
-- Tests (catalog entries)
-- ---------------------------------------------------------------------------
insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000001',
  (select id from public.test_categories where name = 'Clinical Chemistry'),
  '00000000-0000-4000-a000-000000000001',
  'Fasting Blood Sugar', 'FBS', 1;

insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000002',
  (select id from public.test_categories where name = 'Hematology'),
  '00000000-0000-4000-a000-000000000002',
  'Packed Cell Volume', 'PCV', 1;

insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000003',
  (select id from public.test_categories where name = 'Other'),
  '00000000-0000-4000-a000-000000000003',
  'Blood Pressure', 'BP', 1;

insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000004',
  (select id from public.test_categories where name = 'Hematology'),
  '00000000-0000-4000-a000-000000000004',
  'Genotype', 'GENOTYPE', 2;

insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000005',
  (select id from public.test_categories where name = 'Blood Grouping'),
  '00000000-0000-4000-a000-000000000005',
  'Blood Group & Rhesus', 'BLOOD_GROUP', 1;

insert into public.tests (id, category_id, template_id, name, code, sort_order)
select
  '00000000-0000-4000-b000-000000000006',
  (select id from public.test_categories where name = 'Serology'),
  '00000000-0000-4000-a000-000000000006',
  'Widal Test', 'WIDAL', 1;

-- ---------------------------------------------------------------------------
-- Reference ranges
-- ---------------------------------------------------------------------------

-- FBS: applies to all sexes/ages
insert into public.reference_ranges (test_id, template_field_id, range_low, range_high, unit)
select
  '00000000-0000-4000-b000-000000000001',
  (select id from public.template_fields where template_id = '00000000-0000-4000-a000-000000000001' and field_key = 'value'),
  75, 115, 'mg/dl';

-- PCV: sex-specific, per the supplied reports
insert into public.reference_ranges (test_id, template_field_id, sex, range_low, range_high, unit)
select
  '00000000-0000-4000-b000-000000000002',
  (select id from public.template_fields where template_id = '00000000-0000-4000-a000-000000000002' and field_key = 'value'),
  'Male', 45, 55, '%';

insert into public.reference_ranges (test_id, template_field_id, sex, range_low, range_high, unit)
select
  '00000000-0000-4000-b000-000000000002',
  (select id from public.template_fields where template_id = '00000000-0000-4000-a000-000000000002' and field_key = 'value'),
  'Female', 35, 45, '%';

-- Blood Pressure: illustrative resting adult ranges, admin-editable
insert into public.reference_ranges (test_id, template_field_id, range_low, range_high, unit)
select
  '00000000-0000-4000-b000-000000000003',
  (select id from public.template_fields where template_id = '00000000-0000-4000-a000-000000000003' and field_key = 'systolic'),
  90, 120, 'mmHg';

insert into public.reference_ranges (test_id, template_field_id, range_low, range_high, unit)
select
  '00000000-0000-4000-b000-000000000003',
  (select id from public.template_fields where template_id = '00000000-0000-4000-a000-000000000003' and field_key = 'diastolic'),
  60, 80, 'mmHg';

-- Widal: no fixed numeric cutoff (titre interpretation varies by lab/locale)
-- — stored as descriptive guidance text rather than an asserted cutoff value.
insert into public.reference_ranges (test_id, template_field_id, range_text)
select
  '00000000-0000-4000-b000-000000000006',
  null,
  'Titre significance is locale- and lab-baseline-dependent; interpret alongside clinical presentation.';
