# Salem Production Repair — SQL + Vercel Build Fix

## What was repaired

### Vercel TypeScript errors from commit d317c8d
1. `ServiceEditableFields` now includes `serviceType` and `toTestRow()` persists it as `service_type`.
2. The service admin form includes a service-type selector.
3. Booking validation/actions now include home-collection `address`, `landmark`, `latitude`, `longitude`, and `mapUrl`.
4. Appointment database types include those fields.
5. Contact map now falls back to Salem's supplied verified Google Maps embed and listing/directions links.
6. Contact CMS validation now accepts `mapDirectionsUrl`.
7. Home-collection assignment refuses dispatch/assignment until payment is `paid` or `waived`.

## SQL failure: 42P10

The PostgreSQL error `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification` means an `INSERT ... ON CONFLICT (...)` statement named columns that are not covered by a unique/exclusion constraint in the live database.

Do not keep retrying the failed migration unchanged.

Use:

`supabase/migrations/20260909093000_services_booking_map_repair.sql`

This repair migration deliberately uses `ADD COLUMN IF NOT EXISTS`, normal updates, constraint recreation, and `CREATE INDEX IF NOT EXISTS`. It does not use an `ON CONFLICT` target on non-unique application columns.

### How to apply

1. Open Supabase → SQL Editor for the Salem project.
2. Paste the contents of `20260909093000_services_booking_map_repair.sql`.
3. Run it once.
4. If the SQL Editor reports an error, stop there and use the exact error; do not create random constraints to satisfy an `ON CONFLICT` statement.

The migration is designed to be safe to run after a failed earlier attempt because it uses `IF NOT EXISTS` where appropriate and backfills missing service types to `laboratory`.

## Deployment order

1. Apply the repair SQL in Supabase.
2. Commit/push the repaired source to GitHub.
3. Deploy the same commit to Vercel.
4. Test `npm run build` in Vercel.
5. Test `/contact`, `/services`, `/book`, `/home-collection`, and the admin service editor.

## Google Maps / billing

No Google Maps API key or Google Cloud billing configuration is required for the Contact-map fallback in this repair. The supplied Google-generated `https://www.google.com/maps/embed?pb=...` URL is rendered in an iframe.

## Build verification

The changed TypeScript/TSX files pass syntax transpilation. A full local type-check/build could not be reproduced in this isolated environment because package installation/network access was unavailable. Vercel has a complete dependency installation environment and should be the final production build check.
