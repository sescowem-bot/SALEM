-- Phase 2B — Extensions & shared enum types
-- Source of truth: Phase 2A Final Architecture (approved).

-- UUID generation
create extension if not exists pgcrypto;

-- Structure of a reusable test template.
create type test_structure_type as enum ('field_based', 'table_based');

-- Primitive input types a template_field can be. Genotype, Blood Group and
-- Blood Pressure are NOT separate input types — they are templates composed
-- of these primitives (e.g. Blood Pressure = two numeric fields; Blood Group
-- = two select fields; Genotype = one select field with genotype options).
create type field_input_type as enum ('numeric', 'text', 'select', 'positive_negative');

-- Lifecycle of a lab report.
create type report_status as enum ('draft', 'reviewed', 'published', 'archived');

-- Status of a single test within a report.
create type report_test_status as enum ('pending', 'completed', 'cancelled');

-- Optional lab-assigned interpretation flag on a single result value.
-- Never computed automatically in this phase (see Phase 2A §6) — always
-- entered by a laboratory scientist.
create type result_flag as enum ('normal', 'high', 'low', 'critical', 'abnormal');

-- What kind of change produced a report_versions snapshot.
create type report_version_change_type as enum (
  'created',
  'reviewed',
  'published',
  'amended',
  'archived'
);

-- Status of a public intake submission (appointments / home collection / contact).
create type intake_status as enum ('new', 'contacted', 'scheduled', 'completed', 'cancelled');
