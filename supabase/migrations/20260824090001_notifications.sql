-- Advanced 6 — Notifications & Patient Result Delivery.
--
-- Inspected first (per the ticket's "only create the minimum new tables"
-- instruction): patients.email already exists (Phase 2A), staff email
-- lives in Supabase Auth (auth.users, keyed by staff_profiles.id — see
-- lib/data/staff.ts createStaffAccount), the report status machine and
-- report_versions/report_final_documents already fully describe "is this
-- report actually ready to notify about", and result_access_attempts
-- (20260818090002) already gives a private-table + narrow-RLS-read
-- precedent to follow. None of that needs duplicating.
--
-- The one genuinely missing piece is an auditable record of each
-- notification attempt — separate from audit_logs (which records that an
-- action happened, not the delivery lifecycle of a message: pending -> sent
-- vs failed, with a reason). One table, no separate delivery/log table:
-- a notification here IS the delivery attempt, one row per event, and its
-- own status/sent_at/failure_reason columns are that trail. A busier system
-- might split "notification" (what/why) from "delivery" (provider attempts,
-- retries) into two tables, but this app sends at most one attempt per
-- event today, so that split would be speculative structure with nothing
-- to justify it yet.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in (
      'approval_requested',
      'report_approved',
      'report_rejected',
      'report_returned',
      'report_published',
      'patient_result_available'
    )
  ),
  recipient_type text not null check (recipient_type in ('staff', 'patient')),
  recipient_staff_id uuid references public.staff_profiles(id),
  recipient_patient_id uuid references public.patients(id),
  recipient_email text,
  lab_report_id uuid references public.lab_reports(id),
  subject text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

comment on table public.notifications is
  'One row per notification event + delivery attempt (lib/data/notifications.ts dispatchReportNotification). Written only by the service-role client, from inside the existing workflow functions in lib/data/labReports.ts and lib/data/approvals.ts — never a standalone user-facing "send notification" action. status starts "pending", then becomes "sent" (email provider confirmed) or "failed" (no recipient email on file, or the provider rejected/errored) — never marked "sent" without a real provider confirmation.';

create index notifications_lab_report_id_idx on public.notifications (lab_report_id, created_at desc);
create index notifications_created_at_idx on public.notifications (created_at desc);
create index notifications_status_idx on public.notifications (status);

alter table public.notifications enable row level security;

-- Same posture as result_access_attempts: read-only for staff, and only
-- the roles that already see audit_logs org-wide (super_admin, admin) — a
-- notification's subject/metadata can reference a specific patient/report,
-- so this is not opened to every reports.view role. Every write goes
-- through the service-role client; there is no authenticated insert/update
-- policy.
create policy "admins can read notifications"
  on public.notifications for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));
