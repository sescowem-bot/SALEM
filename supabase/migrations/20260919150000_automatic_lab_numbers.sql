-- Automatic, concurrency-safe Salem Medical Laboratory numbers.
-- Existing lab numbers are preserved. New reports receive SML-000001, SML-000002, ...
create sequence if not exists public.lab_number_seq;

do $$
declare
  v_max bigint;
begin
  select coalesce(max(substring(lab_number from '^SML-([0-9]+)$')::bigint), 0)
    into v_max
  from public.lab_reports
  where lab_number ~ '^SML-[0-9]+$';

  perform setval('public.lab_number_seq', greatest(v_max, 1), v_max > 0);
end;
$$;

create or replace function public.generate_lab_number()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select 'SML-' || lpad(nextval('public.lab_number_seq')::text, 6, '0');
$$;

revoke all on function public.generate_lab_number() from public;
grant execute on function public.generate_lab_number() to service_role;

alter table public.lab_reports
  alter column lab_number set default public.generate_lab_number();

-- lab_number was already declared UNIQUE in the base schema; keep that
-- constraint as the final database-level collision guard.
