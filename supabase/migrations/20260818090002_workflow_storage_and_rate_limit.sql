-- Phase 4 — Workflow columns, private PDF storage, verification rate limiting

alter table public.lab_reports
  add column submitted_for_review boolean not null default false;

comment on column public.lab_reports.submitted_for_review is
  'Set true when laboratory_staff finishes a draft and sends it to the pathologist review queue. Reset to false on return-for-correction. Independent of `status` so drafts can be "in progress" vs "awaiting review" without adding a new lifecycle status.';

alter table public.report_tests
  add column pdf_storage_path text;

comment on column public.report_tests.pdf_storage_path is
  'Path within the private "lab-report-pdfs" storage bucket for an uploaded/scanned result, when a test''s result is supplied as a PDF instead of (or alongside) structured field/table values. Never a public URL — always resolved to a short-lived signed URL server-side (lib/data/storage.ts).';

-- Private storage bucket for uploaded/generated report PDFs. No public
-- policies are created on storage.objects for this bucket at all — the
-- absence of a policy means anon/authenticated get zero access; every read
-- goes through a server-generated signed URL using the service role.
insert into storage.buckets (id, name, public)
values ('lab-report-pdfs', 'lab-report-pdfs', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Rate limiting for the public result verification endpoint. Written/read
-- only via the service-role client (see lib/data/verification.ts) — this is
-- an anti-abuse mechanism, not staff or patient data, so it gets no RLS
-- policies for any client role at all.
-- ---------------------------------------------------------------------------
create table public.result_access_attempts (
  id uuid primary key default gen_random_uuid(),
  result_reference text,
  ip_hash text not null,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index result_access_attempts_ip_hash_idx on public.result_access_attempts (ip_hash, created_at desc);
create index result_access_attempts_reference_idx on public.result_access_attempts (result_reference, created_at desc);

alter table public.result_access_attempts enable row level security;

create policy "admins can read result_access_attempts"
  on public.result_access_attempts for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));
