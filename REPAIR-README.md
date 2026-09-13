# Salem Production Repair — SQL 42P10 + Vercel TypeScript

## Why the previous SQL failed

The previous script used `ON CONFLICT (name)` for tables where the production database does not have a matching UNIQUE/EXCLUSION constraint. PostgreSQL correctly returned error `42P10`.

It also tried to add `tests.service_type` without `IF NOT EXISTS`, but that column already exists in the production database. PostgreSQL therefore returned `42701 column already exists`.

## What this version does differently

- Uses `ADD COLUMN IF NOT EXISTS` for fields that may already exist.
- Does **not** use `ON CONFLICT` at all.
- Inserts categories/templates only when a matching row is absent.
- Updates existing catalogue rows by name and inserts only missing rows.
- Reuses an existing `General Diagnostic Result` template when present.
- Adds home-collection location/payment-instruction fields safely.
- Keeps payment as **manual/offline instructions only**. No payment gateway, Google Maps API key, or billing is introduced.
- Keeps the existing `service_type` database representation as text so it matches the application types.

## Run this SQL

Run only:

`supabase/migrations/20260909093000_services_booking_map_repair.sql`

in Supabase SQL Editor.

Do not run the old `services` SQL that produced `42P10`.

## Then deploy

Commit/push the corrected source files to the Salem GitHub repository and redeploy on Vercel.

The source tree includes the TypeScript fixes for:

- `ServiceEditableFields.serviceType`
- appointment `address`, `landmark`, `latitude`, `longitude`, `map_url`
- Supabase database type definitions for those fields and home-collection payment settings

## Important

The SQL migration is designed to be safe when some parts have already been run. If a row already exists, it is preserved rather than duplicated.

The map uses Salem's existing Google-generated iframe embed and does not require a Google Maps Platform billing account for this implementation.
