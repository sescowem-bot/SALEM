-- Automatic, concurrency-safe Salem Medical Laboratory lab numbers.
-- Existing values are never modified.

create sequence if not exists public.lab_number_seq;

do $$
declare
  v_max bigint;
begin
  select max(substring(lab_number from '^SML-([0-9]+)$')::bigint) into v_max
  from public.lab_reports
  where lab_number ~ '^SML-[0-9]+$';

  if v_max is null then
    perform setval('public.lab_number_seq', 1, false);
  else
    perform setval('public.lab_number_seq', v_max, true);
  end if;
end $$;

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

comment on function public.generate_lab_number() is
  'Concurrency-safe automatic Salem lab number generator.';
