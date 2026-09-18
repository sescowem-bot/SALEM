-- Phase 3 + 4: Report templates, test catalogue management, and homepage
-- featured-service ordering.
--
-- Additive migration. No existing data is dropped or renamed.

alter table public.tests
  add column if not exists featured_home_order integer not null default 0;

comment on column public.tests.featured_home_order is
  'Explicit display order for services marked featured on the public homepage. Lower numbers appear first.';

create index if not exists tests_featured_home_order_idx
  on public.tests (featured, featured_home_order, sort_order)
  where featured = true;

-- Keep existing featured services deterministic. Their current catalogue
-- order is used as the initial homepage order; admins can change it later.
with ranked as (
  select id, row_number() over (order by sort_order asc, name asc) - 1 as new_order
  from public.tests
  where featured = true
)
update public.tests t
set featured_home_order = ranked.new_order
from ranked
where t.id = ranked.id;
