-- Phase 3 — RBAC RLS policies for existing domain tables.
--
-- These grant table-level access per role, per the approved permission
-- matrix. Finer-grained rules that don't map cleanly onto row-level SQL
-- (e.g. "laboratory_staff can edit a draft report but not publish it") are
-- enforced in the application layer (src/lib/auth/permissions.ts) in
-- addition to this — see that file's header comment for the split.
--
-- All of these are ADDITIVE to the deny-by-default posture from Phase 2B:
-- roles not listed for a table still get nothing.

-- ---------------------------------------------------------------------------
-- Catalogue: test_categories, test_templates, template_fields,
-- template_table_columns, template_table_rows, tests, reference_ranges,
-- signatories.
-- SELECT: super_admin, admin, pathologist, laboratory_staff (need to see the
--   catalogue to work with results). INSERT/UPDATE/DELETE: super_admin, admin only.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'test_categories', 'test_templates', 'template_fields',
    'template_table_columns', 'template_table_rows', 'tests',
    'reference_ranges', 'signatories'
  ]
  loop
    execute format(
      'create policy "staff can read %1$s" on public.%1$s for select to authenticated using (public.current_staff_role() in (%2$L, %3$L, %4$L, %5$L));',
      t, 'super_admin', 'admin', 'pathologist', 'laboratory_staff'
    );
    execute format(
      'create policy "admins manage %1$s" on public.%1$s for all to authenticated using (public.current_staff_role() in (%2$L, %3$L)) with check (public.current_staff_role() in (%2$L, %3$L));',
      t, 'super_admin', 'admin'
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- patients
-- SELECT: super_admin, admin, pathologist, laboratory_staff, frontdesk
-- INSERT (register): super_admin, admin, laboratory_staff, frontdesk
-- UPDATE: super_admin, admin
-- ---------------------------------------------------------------------------
create policy "staff can read patients"
  on public.patients for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'pathologist', 'laboratory_staff', 'frontdesk'));

create policy "staff can register patients"
  on public.patients for insert
  to authenticated
  with check (public.current_staff_role() in ('super_admin', 'admin', 'laboratory_staff', 'frontdesk'));

create policy "admins can update patients"
  on public.patients for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'))
  with check (public.current_staff_role() in ('super_admin', 'admin'));

-- ---------------------------------------------------------------------------
-- lab_reports / report_tests / result_field_values / result_table_cells
-- SELECT: super_admin, admin, pathologist, laboratory_staff
-- INSERT/UPDATE: super_admin, admin, laboratory_staff (draft authoring)
--   Pathologist additionally needs UPDATE on lab_reports to action a
--   review/publish transition (see app-layer restriction for who may
--   actually move status to "published").
-- ---------------------------------------------------------------------------
create policy "lab staff can read lab_reports"
  on public.lab_reports for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'pathologist', 'laboratory_staff'));

create policy "lab staff can create lab_reports"
  on public.lab_reports for insert
  to authenticated
  with check (public.current_staff_role() in ('super_admin', 'admin', 'laboratory_staff'));

create policy "lab staff can update lab_reports"
  on public.lab_reports for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'laboratory_staff', 'pathologist'))
  with check (public.current_staff_role() in ('super_admin', 'admin', 'laboratory_staff', 'pathologist'));

do $$
declare
  t text;
begin
  foreach t in array array['report_tests', 'result_field_values', 'result_table_cells']
  loop
    execute format(
      'create policy "lab staff can read %1$s" on public.%1$s for select to authenticated using (public.current_staff_role() in (%2$L, %3$L, %4$L, %5$L));',
      t, 'super_admin', 'admin', 'pathologist', 'laboratory_staff'
    );
    execute format(
      'create policy "lab staff can write %1$s" on public.%1$s for insert to authenticated with check (public.current_staff_role() in (%2$L, %3$L, %4$L));',
      t, 'super_admin', 'admin', 'laboratory_staff'
    );
    execute format(
      'create policy "lab staff can update %1$s" on public.%1$s for update to authenticated using (public.current_staff_role() in (%2$L, %3$L, %4$L)) with check (public.current_staff_role() in (%2$L, %3$L, %4$L));',
      t, 'super_admin', 'admin', 'laboratory_staff'
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- report_versions (audit trail) — read-only for super_admin/admin.
-- Rows are still written via the server-only service-role client as part of
-- the atomic snapshot-on-transition logic (see lib/data/labReports.ts) —
-- that write path is treated as system/internal, not an ordinary staff CRUD
-- operation, so it is intentionally not opened up here.
-- ---------------------------------------------------------------------------
create policy "admins can read report_versions"
  on public.report_versions for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin'));

-- ---------------------------------------------------------------------------
-- Public intake tables — staff read/update access on top of the existing
-- Phase 2B anon-insert-only policies.
-- ---------------------------------------------------------------------------
create policy "frontdesk and admins can read appointment_requests"
  on public.appointment_requests for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'));

create policy "frontdesk and admins can update appointment_requests"
  on public.appointment_requests for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'))
  with check (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'));

create policy "phlebotomists and admins can read home_collection_requests"
  on public.home_collection_requests for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'phlebotomist'));

create policy "phlebotomists and admins can update home_collection_requests"
  on public.home_collection_requests for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'phlebotomist'))
  with check (public.current_staff_role() in ('super_admin', 'admin', 'phlebotomist'));

create policy "frontdesk and admins can read contact_submissions"
  on public.contact_submissions for select
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'));

create policy "frontdesk and admins can update contact_submissions"
  on public.contact_submissions for update
  to authenticated
  using (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'))
  with check (public.current_staff_role() in ('super_admin', 'admin', 'frontdesk'));
