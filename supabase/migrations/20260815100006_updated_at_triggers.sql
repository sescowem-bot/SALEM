-- Phase 2B — updated_at maintenance

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.test_templates
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.tests
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
