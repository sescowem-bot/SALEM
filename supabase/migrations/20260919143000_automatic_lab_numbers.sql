create sequence if not exists public.lab_number_seq;
select setval('public.lab_number_seq', greatest(coalesce((select max(substring(lab_number from '^SML-([0-9]+)$')::bigint) from public.lab_reports where lab_number ~ '^SML-[0-9]+$'), 0), 1), false);
create or replace function public.generate_lab_number() returns text language sql volatile as $$ select 'SML-' || lpad(nextval('public.lab_number_seq')::text, 6, '0'); $$;
alter table public.lab_reports alter column lab_number set default public.generate_lab_number();
comment on function public.generate_lab_number() is 'Concurrency-safe Salem Medical Laboratory lab number generator.';
