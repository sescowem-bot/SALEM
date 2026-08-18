-- Phase 3 — Staff auth foundation: roles, staff_profiles, RLS helper functions.
-- Passwords are never stored here — Supabase Auth (auth.users) owns credentials.

create type staff_role as enum (
  'super_admin',
  'admin',
  'laboratory_staff',
  'pathologist',
  'phlebotomist',
  'frontdesk'
);

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role staff_role not null,
  qualification text,
  designation text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.staff_profiles is
  'One row per staff auth.users account. role drives RBAC everywhere (app layer + RLS). No passwords stored here.';

create trigger set_updated_at before update on public.staff_profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER: lets RLS policies on OTHER tables check the caller's
-- role without recursively evaluating staff_profiles' own RLS.
create or replace function public.current_staff_role()
returns staff_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.staff_profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.staff_profiles where id = auth.uid() and is_active = true);
$$;

alter table public.staff_profiles enable row level security;

-- A staff member can always read their own profile.
create policy "staff read own profile"
  on public.staff_profiles for select
  to authenticated
  using (id = auth.uid());

-- super_admin and admin can read every staff profile (staff directory).
create policy "admins read all staff profiles"
  on public.staff_profiles for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));

-- Only super_admin can create/update/delete staff profiles (staff management
-- is exclusively a super_admin permission — admin explicitly does not get it).
create policy "super_admin manages staff profiles"
  on public.staff_profiles for all
  to authenticated
  using (public.current_staff_role() = 'super_admin')
  with check (public.current_staff_role() = 'super_admin');
