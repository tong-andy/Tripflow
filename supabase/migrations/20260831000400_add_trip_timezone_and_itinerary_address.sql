-- Phase 03B: timezone-aware travel mode and optional itinerary timing/address.
create or replace function public.is_valid_timezone(value text)
returns boolean language sql stable set search_path = ''
as $$ select exists(select 1 from pg_catalog.pg_timezone_names where name = value) $$;
revoke all on function public.is_valid_timezone(text) from public, anon;
grant execute on function public.is_valid_timezone(text) to authenticated;

alter table public.trips
  add column timezone text not null default 'Asia/Shanghai'
  check (public.is_valid_timezone(timezone));

alter table public.itinerary_items
  alter column time drop not null,
  add column address text not null default '';

create or replace function public.create_trip_with_days_v2(
  p_name text, p_destination text, p_departure_location text,
  p_start_date date, p_end_date date, p_timezone text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_trip_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_end_date < p_start_date then raise exception 'Invalid trip date range' using errcode = '22007'; end if;
  if p_timezone <> 'UTC' and p_timezone !~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+)+$' then raise exception 'Invalid IANA timezone' using errcode = '22023'; end if;
  insert into public.trips (user_id,name,destination,departure_location,start_date,end_date,timezone)
  values (v_user_id,trim(p_name),trim(p_destination),trim(p_departure_location),p_start_date,p_end_date,p_timezone)
  returning id into v_trip_id;
  insert into public.trip_days (trip_id,user_id,day_number,date)
  select v_trip_id,v_user_id,generated_day.ordinality::integer,generated_day.day::date
  from generate_series(p_start_date::timestamp,p_end_date::timestamp,interval '1 day')
  with ordinality as generated_day(day,ordinality);
  return v_trip_id;
end; $$;
revoke all on function public.create_trip_with_days_v2(text,text,text,date,date,text) from public, anon;
grant execute on function public.create_trip_with_days_v2(text,text,text,date,date,text) to authenticated;
