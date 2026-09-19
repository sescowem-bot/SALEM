-- Department & Function Management — extends the Phase 5/6 RBAC/departments
-- foundation (supabase/migrations/20260918230000_phase5_6_rbac_departments.sql)
-- with:
--   1. A `department_functions` table: a function (job function / duty, e.g.
--      "Phlebotomy", "Billing") belongs to exactly one department; a
--      department can have many functions.
--   2. Widening department management from super_admin-only to
--      super_admin + admin, matching the app-layer permission requested
--      ("Allow Super Admin/Admin to create, edit, and deactivate
--      departments") and the existing `admin: [...]` near-parity pattern
--      already used for every other administration permission in
--      src/lib/auth/permissions.ts (documents.manage, settings.manage,
--      etc. — staff.manage/account creation remains the one
--      super_admin-exclusive carve-out).
--
-- This is additive only: no existing table, column, policy the app still
-- relies on, or role/permission is removed. `staff_role_assignments` and
-- the rest of the RBAC system are untouched.

create table if not exists public.department_functions (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, name)
);

create index if not exists department_functions_department_id_idx
  on public.department_functions(department_id);

create trigger department_functions_updated_at before update on public.department_functions
  for each row execute function public.set_updated_at();

alter table public.department_functions enable row level security;

-- SELECT: any active staff member can read active functions (needed to see
-- "what functions exist" e.g. when assigning one to their own work), plus
-- super_admin/admin can also see inactive ones for the management screen.
create policy "active staff can read active department_functions"
  on public.department_functions for select to authenticated
  using (is_active = true or public.current_staff_role() in ('super_admin', 'admin'));

create policy "super admins and admins manage department_functions"
  on public.department_functions for all to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'))
  with check (public.current_staff_role() in ('super_admin', 'admin'));

-- ---------------------------------------------------------------------------
-- Widen department management to super_admin + admin (was super_admin-only).
-- The existing "active staff can read active departments" select policy is
-- untouched — it already lets super_admin see inactive rows and everyone
-- else see active ones, which still holds now that admin can deactivate one.
-- ---------------------------------------------------------------------------
drop policy if exists "super admins manage departments" on public.departments;

create policy "super admins and admins manage departments"
  on public.departments for all to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'))
  with check (public.current_staff_role() in ('super_admin', 'admin'));

-- The existing read policy only special-cased super_admin for seeing
-- inactive departments; admin needs the same now that admin manages them.
drop policy if exists "active staff can read active departments" on public.departments;

create policy "active staff can read active departments"
  on public.departments for select to authenticated
  using (is_active = true or public.current_staff_role() in ('super_admin', 'admin'));
