# Salem Medical Laboratories — Phase 3 + Phase 4

## Scope

This release completes the **Report Template / Test Catalogue** management work (Phase 3) and the **Services / Website CMS homepage featured-service controls** (Phase 4).

It is built on the existing Salem Next.js + Supabase architecture and keeps the Phase 1 + 2 report workflow intact.

## Phase 3 — Templates, Tests & Investigations

### Report Templates

The admin template area now provides:

- Full template list
- Field-based and table-based structure labels
- Parameter / row / column counts
- Number of tests using each template
- Active/inactive state
- Create template
- Edit template
- Add/remove/reorder-by-position through the saved structure
- Change structure type
- Internal template description
- Activate/deactivate
- Delete when the template is not used by any test
- Safe deletion guard when the template is still assigned to tests

A template that is already used by a test is deliberately not shown with a destructive Delete action. Deactivate it or reassign its tests first.

### Tests / Investigations

The existing Services catalogue remains the single source of truth for diagnostic tests. The navigation label is now **Services & Tests** instead of the confusing **Investigations & Services**.

Existing service/test capabilities remain available:

- Category
- Test name/code
- Result template
- Public service content
- Active/inactive state
- Publish/unpublish/archive
- Preview
- Featured on homepage
- Catalogue ordering

This avoids creating a second, duplicate test database.

## Phase 4 — Services & Website CMS

### Homepage featured services

The previous homepage component had a hard limit of three CMS-featured services. That limit has been removed.

Every active + published service with `featured = true` can now appear on the homepage.

A new database column controls homepage order:

`tests.featured_home_order`

Admins can:

1. Mark a service as Featured.
2. Move a featured service earlier/later on the homepage.
3. Remove it from the homepage by toggling Featured off.

The normal service catalogue `sort_order` remains separate, so homepage ordering does not unintentionally change the /services directory order.

## Required Supabase migration

Run this migration **once** before deploying the updated application:

`supabase/migrations/20260918222000_phase3_4_catalog_homepage.sql`

It adds `tests.featured_home_order`, an index for featured services, and initializes the new order from the existing service order.

If you use Supabase CLI, run the normal migration workflow. If you apply migrations manually in the Supabase SQL editor, paste/run the contents of the migration file once.

Do not run `supabase/seed.sql` against production just to apply this change.

## Deployment checklist

1. Back up production database/schema according to your normal procedure.
2. Run the Phase 3 + 4 migration.
3. Verify the migration completed without an error.
4. Deploy the complete project ZIP/repository.
5. Ensure production environment variables are unchanged and present.
6. Run the production build on the deployment platform.
7. Sign in as an authorized admin.
8. Test Report Templates:
   - create a template
   - confirm it appears in the template list
   - edit it
   - deactivate/activate it
   - confirm an in-use template cannot be deleted
   - confirm an unused template can be deleted
9. Test Services & Tests:
   - create/edit a service
   - publish it
   - mark it Featured
   - confirm it appears on the homepage
   - feature four or more services and confirm all appear
   - reorder featured services and refresh the homepage
   - unfeature one service and confirm it disappears from the homepage
10. Re-test the Phase 1 + 2 report workflow before declaring the release complete.

## Build verification note

The supplied source has been checked and the changed files are packaged in the full project archive. A local production build could not be completed in this environment because the uploaded project's installed dependency tree is incomplete and the environment could not finish restoring npm dependencies. The final deployment platform must therefore perform the authoritative `npm ci`/`npm run build` step.
