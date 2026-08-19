-- Phase 4 — Audit logging
create type audit_action as enum (
  'PATIENT_REGISTERED',
  'VISIT_CREATED',
  'LAB_CODE_GENERATED',
  'RESULT_CREATED',
  'RESULT_UPDATED',
  'RESULT_UPLOADED',
  'RESULT_SUBMITTED_FOR_REVIEW',
  'RESULT_RETURNED',
  'RESULT_APPROVED',
  'RESULT_PUBLISHED',
  'RESULT_VERIFIED_ACCESS'
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action audit_action not null,
  entity_type text not null,
  entity_id text,
  actor_id uuid,
  actor_role staff_role,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only. Written exclusively via the server-only service-role client (see lib/data/audit.ts) — never via ordinary staff RLS-scoped writes.';

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_action_idx on public.audit_logs (action);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

-- Read-only, super_admin/admin only. No insert/update/delete policy for any
-- role — writes only ever happen via the service role (bypasses RLS by
-- design, same reasoning as report_versions in Phase 2B).
create policy "admins can read audit_logs"
  on public.audit_logs for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));
