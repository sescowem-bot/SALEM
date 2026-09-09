-- Salem repair migration: service classification + customer location fields.
-- Deliberately avoids ON CONFLICT on non-unique columns. Safe to re-run.

alter table public.tests
  add column if not exists service_type text;

update public.tests
set service_type = 'laboratory'
where service_type is null or trim(service_type) = '';

alter table public.tests
  alter column service_type set default 'laboratory';

alter table public.tests
  alter column service_type set not null;

alter table public.tests drop constraint if exists tests_service_type_check;
alter table public.tests
  add constraint tests_service_type_check
  check (service_type in ('laboratory','ultrasound','cardiac','screening','other'));

create index if not exists tests_service_type_idx on public.tests(service_type);

-- Appointment booking: address is required by the application when location_type = home.
alter table public.appointment_requests
  add column if not exists address text,
  add column if not exists landmark text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists map_url text;

-- Ensure the home-collection table also has the location fields used by the public form.
alter table public.home_collection_requests
  add column if not exists landmark text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists map_url text;

create index if not exists appointment_requests_location_type_idx
  on public.appointment_requests(location_type);

create index if not exists home_collection_requests_location_idx
  on public.home_collection_requests(latitude, longitude);
