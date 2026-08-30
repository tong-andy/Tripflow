-- Phase 02B-2: create a trip and its inclusive date range atomically.

create or replace function public.create_trip_with_days(
  p_name text,
  p_destination text,
  p_departure_location text,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_end_date < p_start_date then
    raise exception 'Invalid trip date range' using errcode = '22007';
  end if;

  insert into public.trips (
    user_id,
    name,
    destination,
    departure_location,
    start_date,
    end_date
  )
  values (
    v_user_id,
    trim(p_name),
    trim(p_destination),
    trim(p_departure_location),
    p_start_date,
    p_end_date
  )
  returning id into v_trip_id;

  insert into public.trip_days (trip_id, user_id, day_number, date)
  select
    v_trip_id,
    v_user_id,
    generated_day.ordinality::integer,
    generated_day.day::date
  from generate_series(
    p_start_date::timestamp,
    p_end_date::timestamp,
    interval '1 day'
  ) with ordinality as generated_day(day, ordinality);

  return v_trip_id;
end;
$$;

revoke all on function public.create_trip_with_days(text, text, text, date, date)
from public, anon;

grant execute on function public.create_trip_with_days(text, text, text, date, date)
to authenticated;
