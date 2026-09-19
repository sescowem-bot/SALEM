-- Adds the `departments.manage` permission key (Department & Function
-- Management) to the editable role -> permission matrix introduced in
-- 20260919090001_role_permissions.sql.
--
-- Keep in sync with ALL_PERMISSIONS in src/lib/auth/permissions.ts.
--
-- 1. Widen the check constraint on role_permissions.permission.
-- 2. Grant it to `admin` by default (super_admin is always "all
--    permissions" in application code and is never seeded here).
--
-- Idempotent: safe to re-run.

do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'role_permissions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%permission%in%'
  loop
    execute format('alter table public.role_permissions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.role_permissions
  add constraint role_permissions_permission_check check (permission in (
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
    'documents.manage',
    'departments.manage'
  ));

insert into public.role_permissions (role, permission) values
  ('admin', 'departments.manage')
on conflict do nothing;
