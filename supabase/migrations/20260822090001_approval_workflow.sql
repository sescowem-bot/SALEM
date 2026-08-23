-- Advanced 4 — Operations & Approval Workflow.
--
-- The report lifecycle itself (draft -> reviewed -> published -> archived,
-- lib/data/labReports.ts) already exists and is NOT touched here. What is
-- missing is the *routing* layer on top of it: staff must name a specific
-- authorized approver when they submit, that approver needs a personal
-- Approval Queue (not just "anyone with reports.review"), and every
-- submit/approve/reject/return decision needs its own durable record
-- (separate from report_versions, which snapshots report content, not
-- approval decisions).
--
-- approval_requests is that record. One row per submission cycle for a
-- lab_reports row — a rejected or returned report that gets resubmitted
-- creates a new row rather than mutating the old one, so the full approval
-- history for a report is just "every approval_requests row for this
-- lab_report_id, oldest first". Approve/reject/return still call straight
-- into the existing lab_reports transition functions for the underlying
-- status change; this table only tracks the routing + decision metadata
-- layered on top.

create type approval_status as enum ('pending', 'approved', 'rejected', 'returned');

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references public.lab_reports(id),
  requested_by uuid references public.staff_profiles(id),
  assigned_approver_id uuid not null references public.staff_profiles(id),
  status approval_status not null default 'pending',
  decision_comment text,
  decided_by uuid references public.staff_profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.approval_requests is
  'One row per submit-for-approval cycle. Immutable once decided (approved/rejected/returned) — a resubmission after rejection/return creates a new row, giving a full audit-friendly approval history per lab_report_id.';

comment on column public.approval_requests.assigned_approver_id is
  'The specific authorized approver the submitting staff member chose at submission time (Advanced 4 "approver selection"). Must be an active staff_profiles row whose role carries reports.review at submission time — enforced in lib/data/approvals.ts, not by a DB constraint, since permissions are role-derived rather than stored per-row.';

create index approval_requests_lab_report_id_idx on public.approval_requests (lab_report_id);
create index approval_requests_approver_status_idx on public.approval_requests (assigned_approver_id, status);
create index approval_requests_status_idx on public.approval_requests (status);

alter table public.approval_requests enable row level security;

-- Read-only for staff at the table level (same posture as report_versions /
-- audit_logs): every write goes through lib/data/approvals.ts using the
-- service-role client, so app-layer permission checks (hasPermission +
-- "is this actually the assigned approver") are the real gate. RLS here is
-- the defense-in-depth backstop if a request ever reaches Postgres
-- directly, matching the split documented in lib/auth/permissions.ts.
create policy "staff can read approval_requests"
  on public.approval_requests for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'pathologist', 'laboratory_staff'));

-- ---------------------------------------------------------------------------
-- lab_reports.assigned_approver_id — denormalized pointer to the approver
-- of the *current/latest* approval_requests row, kept in sync by
-- lib/data/approvals.ts. Exists purely so the report detail page, the
-- Approval Queue, and the Staff Workspace can filter/join without a
-- correlated subquery against approval_requests every time; the
-- authoritative history still lives in approval_requests.
-- ---------------------------------------------------------------------------
alter table public.lab_reports
  add column assigned_approver_id uuid references public.staff_profiles(id);

create index lab_reports_assigned_approver_id_idx on public.lab_reports (assigned_approver_id);

-- ---------------------------------------------------------------------------
-- signatories.staff_profile_id — links an admin-managed signatory record
-- (full_name, qualification, designation, signature_image_url — see
-- 20260815100003) to the staff_profiles login that acts as approver in
-- this workflow. Nullable and optional: not every signatory necessarily
-- has (or needs) a staff login, and not every approving staff member is
-- necessarily a named signatory. Where both exist and are linked, the
-- future document/PDF stage (Advanced 5+) can resolve
-- approval_requests.assigned_approver_id -> signatories row to pull the
-- stored signature image + qualification/designation, combine it with
-- site_settings' brand logo (the letterhead, already in place from
-- Advanced 3) and approval_requests.decided_at (the approval timestamp),
-- without any schema change at that point. No PDF/signature engine is
-- built in this migration or this phase — this column only makes that
-- later stage possible.
-- ---------------------------------------------------------------------------
alter table public.signatories
  add column staff_profile_id uuid references public.staff_profiles(id);

create unique index signatories_staff_profile_id_key on public.signatories (staff_profile_id) where staff_profile_id is not null;

comment on column public.signatories.staff_profile_id is
  'Optional link to the staff_profiles login of this signatory, so a later document stage can resolve an approver (staff_profiles.id) to their stored signature_image_url. Not set by this phase — reserved for admin-managed linking, e.g. from /admin/staff or /admin/settings, in a later phase.';
