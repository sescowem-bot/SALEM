-- Automatic, concurrency-safe Salem lab numbering.
-- Existing lab numbers are preserved. The sequence starts after the current
-- highest numeric SML-XXXXXX value, so deployment never rewrites history.
create sequence if not exists public.lab_number_seq;

do $$
declare
  v_max bigint;
begin
  select coalesce(max((substring(lab_number from '^SML-([0-9]+)$'))::bigint), 0)
    into v_max
  from public.lab_reports;
  if v_max > 0 then
    perform setval('public.lab_number_seq', v_max, true);
  end if;
end $$;

alter table public.lab_reports
  alter column lab_number set default ('SML-' || lpad(nextval('public.lab_number_seq')::text, 6, '0'));

create unique index if not exists lab_reports_lab_number_unique_idx
  on public.lab_reports (lab_number);
