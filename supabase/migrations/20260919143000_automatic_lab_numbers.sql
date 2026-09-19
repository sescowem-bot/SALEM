-- Salem Medical Laboratory — automatic lab number generation.
-- Keeps all existing lab numbers unchanged and allocates new numbers
-- atomically through a PostgreSQL sequence.

create sequence if not exists public.lab_number_seq;

-- Initialize the sequence to the highest existing numeric SML lab number.
-- setval(..., false) means the next nextval() returns exactly max + 1.
select setval(
  'public.lab_number_seq',
  greatest(
    coalesce(
      (
        select max(substring(lab_number from '^SML-([0-9]+)$')::bigint)
        from public.lab_reports
        where lab_number ~ '^SML-[0-9]+$'
      ),
      0
    ),
    1
  ),
  false
);

create or replace function public.generate_lab_number()
returns text
language sql
volatile
as $$
  select 'SML-' || lpad(nextval('public.lab_number_seq')::text, 6, '0');
$$;

comment on function public.generate_lab_number() is
  'Concurrency-safe internal Salem lab number generator. Existing lab numbers are never changed.';

alter table public.lab_reports
  alter column lab_number set default public.generate_lab_number();

-- The existing UNIQUE constraint remains the final database-level guard.
