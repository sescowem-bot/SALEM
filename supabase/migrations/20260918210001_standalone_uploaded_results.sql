-- Phase 1/2 — Standalone uploaded laboratory results.
--
-- An externally completed report is still a first-class lab_report, but it
-- does not need a report_tests row or a result template. The finished PDF is
-- stored as a versioned source document and then follows the same draft ->
-- approval -> publish -> archive lifecycle as a system-entered report.

create table public.report_uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references public.lab_reports(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  file_name text not null,
  content_type text not null default 'application/pdf',
  size_bytes bigint not null,
  uploaded_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  unique (lab_report_id, version_number)
);

comment on table public.report_uploaded_documents is
  'Versioned, private source PDFs supplied by staff for externally completed reports. These documents follow the same report approval/publication lifecycle as generated reports and are never public URLs.';

create index report_uploaded_documents_report_version_idx
  on public.report_uploaded_documents (lab_report_id, version_number desc);

alter table public.report_uploaded_documents enable row level security;

create policy "staff can read uploaded report documents"
  on public.report_uploaded_documents for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'pathologist', 'laboratory_staff'));

-- All writes go through the server-only service-role data layer, where the
-- application permission check is enforced.

alter table public.lab_reports
  add column source_investigation_name text;

comment on column public.lab_reports.source_investigation_name is
  'Display name of the investigation represented by an externally supplied result document. Used only for standalone uploaded reports; it does not replace the normal tests catalogue relationship.';
