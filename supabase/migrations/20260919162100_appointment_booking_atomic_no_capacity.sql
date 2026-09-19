-- Atomic appointment insertion without an artificial slot-capacity gate.
-- Multiple patient requests for the same preferred slot are allowed; staff
-- coordinate actual capacity. The transaction lock prevents race conditions
-- while preserving the existing booking flow and fields.
create or replace function public.book_appointment_slot(
  p_full_name text,
  p_phone text,
  p_email text,
  p_test_or_package text,
  p_preferred_date date,
  p_preferred_time text,
  p_location_type text,
  p_address text,
  p_landmark text,
  p_notes text,
  p_booking_reference text
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare v_new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_preferred_date::text || '|' || p_preferred_time));
  insert into public.appointment_requests
    (full_name, phone, email, test_or_package, preferred_date, preferred_time,
     location_type, address, landmark, notes, booking_reference)
  values
    (p_full_name, p_phone, nullif(p_email,''), nullif(p_test_or_package,''),
     p_preferred_date, p_preferred_time, nullif(p_location_type,''),
     nullif(p_address,''), nullif(p_landmark,''), nullif(p_notes,''), p_booking_reference)
  returning appointment_requests.id into v_new_id;
  return query select v_new_id;
end;
$$;
revoke all on function public.book_appointment_slot(text,text,text,text,date,text,text,text,text,text,text) from public;
grant execute on function public.book_appointment_slot(text,text,text,text,date,text,text,text,text,text,text) to service_role;
