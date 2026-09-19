-- Advanced 8 — Editable role -> permission matrix (Roles & Permissions admin
-- page, /admin/roles).
--
-- Previously the mapping of "which role holds which permission" was
-- hardcoded in src/lib/auth/permissions.ts (ROLE_PERMISSIONS). The set of
-- permission *keys* the app knows how to enforce still lives in code (each
-- one gates a specific check at a specific call site — see that file's
-- header comment), but which roles hold which permissions is now data in
-- this table, editable from /admin/roles, and read at request time by
-- src/lib/auth/rolePermissions.ts (service-role client, request-memoized).
--
-- IMPORTANT: the permission text values below must stay in sync with the
-- ALL_PERMISSIONS runtime array in src/lib/auth/permissions.ts. If a new
-- permission is ever added there, add it to the check constraint below in
-- its own migration (same pattern as audit_action additions).

create table public.role_permissions (
  role staff_role not null,
  permission text not null check (permission in (
    'staff.manage',
    'patients.register',
    'patients.view',
    'patients.update',
    'reports.view',
    'reports.create_draft',
    'reports.edit_draft',
    'reports.review',
    'reports.publish',
    'reports.archive',
    'appointments.manage',
    'home_collection.manage',
    'home_collection.view_assigned',
    'home_collection.update_status',
    'catalogue.manage',
    'analytics.view',
    'audit.view',
    'settings.manage',
    'enquiries.manage',
    'documents.manage'
  )),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id),
  primary key (role, permission)
);

comment on table public.role_permissions is
  'Editable role -> permission matrix; source of truth for lib/auth/rolePermissions.ts at request time. super_admin is intentionally NEVER given rows here — it is treated as "all permissions" unconditionally in application code, so the recovery role can never be locked out by a bad edit.';

alter table public.role_permissions enable row level security;

-- Read: any active staff member (nav rendering / the roles page itself
-- needs this for every role, not just their own).
create policy "staff can read role_permissions"
  on public.role_permissions for select
  to authenticated
  using (public.is_active_staff());

-- Write: super_admin only. Deliberately narrower than staff.manage (which
-- admin also holds) — editing the permission matrix is how a role could
-- grant itself staff.manage or any other permission, so only the one role
-- that already has unconditional access may change it. Enforced again in
-- the app layer (updateRolePermissions), this is defence in depth.
create policy "super admins manage role_permissions"
  on public.role_permissions for all
  to authenticated
  using (public.current_staff_role() = 'super_admin')
  with check (public.current_staff_role() = 'super_admin');

-- Seed with the exact matrix that was previously hardcoded in
-- permissions.ts, so behaviour is unchanged the moment this migration
-- runs. super_admin is deliberately NOT seeded here (see table comment).
insert into public.role_permissions (role, permission) values
  ('admin', 'patients.register'),
  ('admin', 'patients.view'),
  ('admin', 'patients.update'),
  ('admin', 'reports.view'),
  ('admin', 'reports.create_draft'),
  ('admin', 'reports.edit_draft'),
  ('admin', 'reports.review'),
  ('admin', 'reports.publish'),
  ('admin', 'reports.archive'),
  ('admin', 'appointments.manage'),
  ('admin', 'home_collection.manage'),
  ('admin', 'catalogue.manage'),
  ('admin', 'analytics.view'),
  ('admin', 'audit.view'),
  ('admin', 'settings.manage'),
  ('admin', 'enquiries.manage'),
  ('admin', 'documents.manage'),

  ('pathologist', 'patients.view'),
  ('pathologist', 'reports.view'),
  ('pathologist', 'reports.review'),
  ('pathologist', 'reports.publish'),

  ('laboratory_staff', 'patients.register'),
  ('laboratory_staff', 'patients.view'),
  ('laboratory_staff', 'reports.view'),
  ('laboratory_staff', 'reports.create_draft'),
  ('laboratory_staff', 'reports.edit_draft'),

  ('frontdesk', 'patients.register'),
  ('frontdesk', 'patients.view'),
  ('frontdesk', 'appointments.manage'),
  ('frontdesk', 'enquiries.manage'),

  ('phlebotomist', 'home_collection.view_assigned'),
  ('phlebotomist', 'home_collection.update_status')
on conflict do nothing;
