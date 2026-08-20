-- Production hardening — appointment slot capacity had a check-then-insert
-- race: submitAppointmentRequest() read the current slot count, then did a
-- separate insert, so two concurrent requests for the same date+time could
-- both pass the check before either row existed and over-book the slot.
--
-- Fix: move the count-check and insert into a single Postgres function,
-- serialized per (date, time) with a transaction-scoped advisory lock so
-- only one concurrent caller can be mid-check for the same slot at a time.
-- The lock is released automatically when the function's transaction ends
-- (pg_advisory_xact_lock), so there's nothing to explicitly unlock and no
-- risk of a stuck lock on error. Everything else about the booking flow —
-- booking reference generation, audit logging, rate limiting, validation —
-- stays exactly as it already was in lib/data/publicIntake.ts; only the
-- capacity check + insert became atomic.
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
  p_max_per_slot int
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_count int;
  v_new_id uuid;
begin
  -- Scoped to this transaction only; serializes concurrent callers for the
  -- same date+time slot without locking any table or affecting other slots.
  perform pg_advisory_xact_lock(hashtext(p_preferred_date::text || '|' || p_preferred_time));

  select count(*) into v_current_count
  from public.appointment_requests
  where preferred_date = p_preferred_date
    and preferred_time = p_preferred_time
    and status <> 'cancelled';

  if v_current_count >= p_max_per_slot then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  insert into public.appointment_requests (
    full_name, phone, email, test_or_package,
    preferred_date, preferred_time, location_type, notes,
    booking_reference
  ) values (
    p_full_name, p_phone, p_email, p_test_or_package,
    p_preferred_date, p_preferred_time, p_location_type, p_notes,
    p_booking_reference
  )
  returning appointment_requests.id into v_new_id;

  return query select v_new_id;
end;
$$;

-- Called from the service-role client only (see lib/data/publicIntake.ts),
-- same trust boundary as every other insert in that file — no new grant to
-- anon/authenticated needed.
revoke all on function public.book_appointment_slot from public;
grant execute on function public.book_appointment_slot to service_role;
