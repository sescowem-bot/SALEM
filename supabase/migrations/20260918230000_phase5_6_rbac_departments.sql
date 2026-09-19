-- Phase 5 + 6: professional admin foundation + department/multi-role RBAC.
-- Run after all existing migrations, including Phase 3-4 and Phase 1-2.

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();

alter table public.staff_profiles add column if not exists department_id uuid references public.departments(id) on delete set null;

create table if not exists public.staff_role_assignments (
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  role staff_role not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (staff_id, role)
);

create unique index if not exists staff_role_assignments_one_primary
  on public.staff_role_assignments(staff_id) where is_primary = true;

insert into public.departments (name, description)
values
  ('Laboratory', 'Laboratory testing, results and reporting'),
  ('Front Desk', 'Patient registration, enquiries and appointments'),
  ('Administration', 'Administrative and system operations'),
  ('Home Collection', 'Home sample collection operations')
on conflict (name) do nothing;

insert into public.staff_role_assignments (staff_id, role, is_primary)
select id, role, true from public.staff_profiles
on conflict (staff_id, role) do update set is_primary = excluded.is_primary;

-- Multi-role-aware helper. Existing current_staff_role() remains available for
-- older policies; new application permission checks use this role set.
create or replace function public.current_staff_has_role(target_role staff_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_role_assignments a
    join public.staff_profiles s on s.id = a.staff_id
    where a.staff_id = auth.uid() and s.is_active = true and a.role = target_role
  );
$$;

alter table public.departments enable row level security;
alter table public.staff_role_assignments enable row level security;

create policy "active staff can read active departments"
  on public.departments for select to authenticated
  using (is_active = true or public.current_staff_role() = 'super_admin');

create policy "super admins manage departments"
  on public.departments for all to authenticated
  using (public.current_staff_role() = 'super_admin')
  with check (public.current_staff_role() = 'super_admin');

create policy "staff can read own role assignments"
  on public.staff_role_assignments for select to authenticated
  using (staff_id = auth.uid() or public.current_staff_role() in ('super_admin', 'admin'));

create policy "super admins manage role assignments"
  on public.staff_role_assignments for all to authenticated
  using (public.current_staff_role() = 'super_admin')
  with check (public.current_staff_role() = 'super_admin');

-- Keep the legacy primary role column synchronized for backwards compatibility.
create or replace function public.sync_primary_staff_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_primary then
    update public.staff_role_assignments
      set is_primary = false
      where staff_id = new.staff_id and role <> new.role;
    update public.staff_profiles set role = new.role where id = new.staff_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_primary_staff_role_trigger on public.staff_role_assignments;
create trigger sync_primary_staff_role_trigger
  after insert or update on public.staff_role_assignments
  for each row execute function public.sync_primary_staff_role();
