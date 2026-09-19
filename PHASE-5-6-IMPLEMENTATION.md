# Salem — Phase 5 + 6 implementation

## Phase 5 — Professional admin UX
- Tightened admin page spacing and responsive layout.
- Reduced hover movement on dense cards.
- Added consistent keyboard focus-visible treatment.
- Hardened mobile form controls and touch targets.
- Kept the existing Salem visual language rather than introducing a new brand.

## Phase 6 — Departments, multiple roles and staff permissions
- Added `departments` table.
- Added `staff_profiles.department_id`.
- Added `staff_role_assignments` so a staff member can hold multiple existing roles.
- A primary role is retained for backward compatibility.
- Staff sessions resolve all assigned roles and the application permission check is the union of those roles.
- Super Admin can create departments and assign departments/roles.
- Super Admin can edit a staff member, choose a primary role, add/remove additional roles and change department.
- Staff directory can filter by department, role and status.
- Role assignment changes are audit logged.
- Existing password handling remains in Supabase Auth; passwords are never stored in the application tables.

## Required migration
Run:

`supabase/migrations/20260918230000_phase5_6_rbac_departments.sql`

Run this **after** the existing migrations and after the Phase 3–4 migration.

The migration safely backfills every existing `staff_profiles.role` into `staff_role_assignments` as that user's primary role.

## Deployment
1. Run the migration.
2. Confirm it succeeds in Supabase.
3. Deploy the full project ZIP.
4. Run `npm ci` and `npm run build` in the deployment environment.
5. Sign in as Super Admin and open **Administration → Staff**.
6. Confirm departments load, edit one staff member, assign a second role, save, sign out/in, and confirm the additional permissions are available.

## Security note
The application permission resolver is now multi-role aware. Existing database RLS policies from earlier migrations still use the legacy primary `current_staff_role()` helper for compatibility. Domain operations that use the server-side service client continue to enforce the application permission layer. If direct client-side Supabase access is later introduced for secondary-role-only operations, those RLS policies should be migrated to the multi-role helper before exposing that operation directly to the browser.

## AI assistant
No AI/chatbot provider or paid API was changed in this phase. The existing assistant remains untouched so the free-first strategy can be reviewed separately after the core system is stable.
