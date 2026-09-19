-- Phase 2 completion: atomic appointment booking function.
--
-- The public booking workflow intentionally allows multiple requests for the
-- same date/time; front-desk staff coordinate actual capacity. This function
-- therefore performs the booking insert as one database operation without
-- introducing a hard slot-capacity rejection that would conflict with the
-- current workflow.
--
-- The booking reference is still generated server-side by the application and
-- supplied to this function. No client/browser role receives execute access.

create or replace function public.book_appointment_slot(
  p_full_name text,
  p_phone text,
  p_email text,
  p_test_or_package text,
  p_preferred_date date,
  p_preferred_time text,
  p_location_type text,
  p_notes text,
  p_booking_reference text,
  p_max_per_slot int default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id uuid;
begin
  insert into public.appointment_requests (
    full_name,
    phone,
    email,
    test_or_package,
    preferred_date,
    preferred_time,
    location_type,
    notes,
    booking_reference
  )
  values (
    p_full_name,
    p_phone,
    p_email,
    p_test_or_package,
    p_preferred_date,
    p_preferred_time,
    p_location_type,
    p_notes,
    p_booking_reference
  )
  returning appointment_requests.id into v_new_id;

  return query select v_new_id;
end;
$$;

revoke all on function public.book_appointment_slot(text, text, text, text, date, text, text, text, text, int) from public;
grant execute on function public.book_appointment_slot(text, text, text, text, date, text, text, text, text, int) to service_role;

comment on function public.book_appointment_slot(text, text, text, text, date, text, text, text, text, int)
is 'Atomic appointment-request creation for the public booking workflow. Multiple requests may share a date/time; operational capacity is coordinated by staff.';
