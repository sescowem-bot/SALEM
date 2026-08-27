-- Advanced 7 — Dynamic Lab Result & Report Builder.
--
-- This is an UPGRADE of the existing Phase 2B test-catalog / report-builder
-- system (supabase/migrations/20260815100002_test_catalog.sql and
-- 20260815100004_report_tests_and_results.sql), not a rebuild. Every table
-- the admin report editor needs already exists (test_categories,
-- test_templates, template_fields, template_table_columns,
-- template_table_rows, tests, report_tests, result_field_values,
-- result_table_cells, report_versions) — the gap was in the application
-- layer: the editor never exposed "add/remove/reorder investigation" or
-- "create a custom investigation" controls.
--
-- This migration is 100% additive (no dropped/renamed constraints) so it
-- carries no risk to existing data. See lib/data/labReports.ts
-- createCustomInvestigation() for how the one new column is used.

-- ---------------------------------------------------------------------------
-- tests.is_custom — distinguishes a one-off investigation created inline by
-- a lab scientist while building a report ("Create custom investigation")
-- from one created through the admin catalogue/services editor. Both are
-- ordinary rows in the same `tests` table, reusing the exact same
-- test_templates/template_fields/template_table_* structures a normal
-- catalogue test uses — a custom investigation becomes a first-class,
-- active, reusable catalogue entry (staff picks its category the same way
-- they would for any other test), not a second, parallel, hidden system.
-- `is_custom` exists purely so admin screens can label/filter it if wanted;
-- nothing about how it's stored, resulted, versioned, or rendered differs
-- from a catalogue test created any other way.
--
-- tests.name keeps its existing global UNIQUE constraint unchanged — a
-- duplicate name is treated as "you probably want the existing catalogue
-- entry", not worked around with a partial index (see
-- lib/data/labReports.ts createCustomInvestigation() for the friendly error
-- message on that conflict).
-- ---------------------------------------------------------------------------
-- Idempotent: safe to run even if a prior attempt already got partway
-- through (e.g. the column landed but the index didn't, or vice versa).
alter table public.tests
  add column if not exists is_custom boolean not null default false;

comment on column public.tests.is_custom is
  'true for an investigation created inline while building a report ("Create custom investigation", Advanced 7) rather than through the admin catalogue/services editor. Same table, same structure, same lifecycle as any other test — this is metadata only.';

create index if not exists tests_is_custom_idx on public.tests (is_custom) where is_custom;
