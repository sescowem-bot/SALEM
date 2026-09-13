-- Salem: appointment home-service address + manual payment instructions.
-- No payment gateway and no Google Maps API are introduced.
-- Safe to run once; all additions use IF NOT EXISTS.

alter table public.appointment_requests
  add column if not exists address text,
  add column if not exists landmark text;

comment on column public.appointment_requests.address is
  'Customer address for home-service appointment requests. Required by the application when location_type is home.';
comment on column public.appointment_requests.landmark is
  'Optional landmark supplied by the customer for home-service appointment requests.';

create index if not exists appointment_requests_home_address_idx
  on public.appointment_requests(location_type, preferred_date)
  where location_type = 'home';

alter table public.site_settings
  add column if not exists home_collection_payment_required boolean not null default true,
  add column if not exists home_collection_payment_message text,
  add column if not exists home_collection_bank_name text,
  add column if not exists home_collection_account_name text,
  add column if not exists home_collection_account_number text,
  add column if not exists home_collection_payment_phone text;

update public.site_settings
set home_collection_payment_message = coalesce(
  home_collection_payment_message,
  'Payment is required before a home visit can be confirmed. After payment, Salem Medical Laboratories will verify the payment and confirm your appointment using the phone number you provided.'
)
where id = true;

comment on column public.site_settings.home_collection_payment_required is
  'Controls whether customers are shown the manual payment instruction after a home-service appointment/request. No payment gateway is implied.';
comment on column public.site_settings.home_collection_payment_message is
  'Customer-facing manual payment instruction for home-service requests.';
comment on column public.site_settings.home_collection_bank_name is
  'Bank used for manual home-service payment.';
comment on column public.site_settings.home_collection_account_name is
  'Account name used for manual home-service payment.';
comment on column public.site_settings.home_collection_account_number is
  'Account number used for manual home-service payment.';
comment on column public.site_settings.home_collection_payment_phone is
  'Phone/WhatsApp number customers should use to send payment proof or confirm payment.';
