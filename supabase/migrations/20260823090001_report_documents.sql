-- Advanced 5 — Professional Reporting, Letterhead, Signature & Final PDF.
--
-- Nothing about the existing report lifecycle (draft -> reviewed ->
-- published -> archived), the approval workflow (approval_requests), or the
-- versioning architecture (report_versions) changes here. This migration
-- adds only what those systems don't already have:
--
--  1. site_settings.letterhead_path — a dedicated print-quality letterhead
--     image, distinct from the web header logo (logo_path). Advanced 4's
--     migration comment assumed the web logo could double as the
--     letterhead; in practice a lab's print letterhead is usually a wider
--     image with a full address/registration band that doesn't belong in a
--     website header, so this gets its own slot in the same site_settings
--     row and the same admin-managed upload mechanism (lib/data/storage.ts
--     uploadSiteMedia), not a new settings system. Falls back to logo_path
--     in the PDF/preview renderer when unset, so nothing breaks if a lab
--     hasn't uploaded one yet.
--
--  2. report_final_documents — one row per *finalized* report version's
--     generated PDF. Deliberately separate from report_versions (which
--     snapshots report content on every transition) and from
--     approval_requests (which records the decision, not the rendered
--     document): a report_versions snapshot is raw data, this table is the
--     specific rendered artifact (letterhead + results + resolved
--     signature) produced from that data at approval time. Keyed by
--     (lab_report_id, version_number) so the final PDF for an already-
--     approved version never silently changes if the draft is later
--     amended and re-approved — that produces a new version_number and a
--     new row here, never an overwrite.
--
--  3. signatories.signature_image_url — already exists (Phase 2B). This
--     migration does not touch that column, only documents that from this
--     phase on it holds a storage path (see new 'staff-signatures' bucket
--     below), resolved server-side the same way report_tests.pdf_storage_path
--     is — never a public URL.
--
--  4. 'staff-signatures' storage bucket — private, same posture as
--     'lab-report-pdfs': no anon/authenticated storage policies at all, so
--     the service-role client (lib/data/storage.ts) is the only read/write
--     path. Signature images are tied to a specific staff member's
--     identity and end up embedded in official documents, so they get the
--     same private-bucket treatment as patient report PDFs, not the
--     public 'site-media' treatment logo/favicon get.

alter table public.site_settings
  add column letterhead_path text;

comment on column public.site_settings.letterhead_path is
  'Print-quality letterhead image for generated report PDFs (lib/pdf/reportPdfDocument.tsx), managed by a Super Admin via the same upload mechanism as the web logo (lib/data/storage.ts uploadSiteMedia, slot "letterhead"). Falls back to logo_path when unset.';

create table public.report_final_documents (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references public.lab_reports(id),
  version_number integer not null,
  approval_request_id uuid references public.approval_requests(id),
  signatory_id uuid references public.signatories(id),
  storage_path text not null,
  generated_by uuid references public.staff_profiles(id),
  generated_at timestamptz not null default now(),
  unique (lab_report_id, version_number)
);

comment on table public.report_final_documents is
  'One row per finalized (approved) report version''s generated PDF. Written only by lib/data/reportDocuments.ts using the service-role client, right after an approval_requests decision transitions the report to "reviewed" (lib/data/approvals.ts approveApprovalRequest). Never overwritten in place — an amendment that produces a new lab_reports.current_version_number and a fresh approval gets its own row here, so a previously issued final PDF is never silently replaced.';

create index report_final_documents_lab_report_id_idx on public.report_final_documents (lab_report_id, version_number desc);

alter table public.report_final_documents enable row level security;

-- Read-only for staff at the table level, same posture as report_versions:
-- every write goes through the service-role client, gated in the app layer
-- by reports.review (generation, tied to the approval action) and
-- reports.view (reading which final documents exist).
create policy "staff can read report_final_documents"
  on public.report_final_documents for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'pathologist', 'laboratory_staff'));

insert into storage.buckets (id, name, public)
values ('staff-signatures', 'staff-signatures', false)
on conflict (id) do nothing;
