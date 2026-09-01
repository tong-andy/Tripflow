-- Phase 03B.5: structured trip destinations and the six-section preparation center.

create table public.trip_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null,
  city_name text not null check (length(trim(city_name)) > 0),
  country_name text not null check (length(trim(country_name)) > 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_destinations_trip_owner_fkey
    foreign key (trip_id, user_id)
    references public.trips(id, user_id)
    on delete cascade,
  constraint trip_destinations_trip_sort_key unique (trip_id, sort_order)
);

create index trip_destinations_user_trip_idx
  on public.trip_destinations(user_id, trip_id, sort_order);

create trigger trip_destinations_set_updated_at
  before update on public.trip_destinations
  for each row execute function public.set_updated_at();

alter table public.trip_destinations enable row level security;
revoke all on public.trip_destinations from anon;
grant select, insert, update, delete on public.trip_destinations to authenticated;

create policy "Users can read own trip destinations"
  on public.trip_destinations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create own trip destinations"
  on public.trip_destinations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own trip destinations"
  on public.trip_destinations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own trip destinations"
  on public.trip_destinations for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.preparation_items
  add column notes text not null default '';

alter table public.preparation_items
  drop constraint preparation_items_category_check;

-- Preserve every historical item while moving legacy buckets to the nearest
-- new section. Users can refine the category later through the existing editor.
update public.preparation_items
set category = case category
  when 'documents' then 'documents'
  when 'booking' then 'activities'
  when 'packing' then 'essentials'
  else 'essentials'
end;

alter table public.preparation_items
  add constraint preparation_items_category_check check (
    category in (
      'transit',
      'accommodation',
      'documents',
      'activities',
      'connectivity',
      'essentials'
    )
  );

create or replace function public.create_trip_with_days_v3(
  p_name text,
  p_destination text,
  p_departure_location text,
  p_start_date date,
  p_end_date date,
  p_timezone text,
  p_destinations jsonb
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
  if p_timezone <> 'UTC' and p_timezone !~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+)+$' then
    raise exception 'Invalid IANA timezone' using errcode = '22023';
  end if;
  if p_destinations is null or jsonb_typeof(p_destinations) <> 'array' then
    raise exception 'Destinations must be a JSON array' using errcode = '22023';
  end if;

  insert into public.trips (
    user_id, name, destination, departure_location, start_date, end_date, timezone
  ) values (
    v_user_id, trim(p_name), trim(p_destination), trim(p_departure_location),
    p_start_date, p_end_date, p_timezone
  ) returning id into v_trip_id;

  insert into public.trip_days (trip_id, user_id, day_number, date)
  select v_trip_id, v_user_id, generated_day.ordinality::integer, generated_day.day::date
  from generate_series(
    p_start_date::timestamp,
    p_end_date::timestamp,
    interval '1 day'
  ) with ordinality as generated_day(day, ordinality);

  insert into public.trip_destinations (
    user_id, trip_id, city_name, country_name, latitude, longitude, sort_order
  )
  select
    v_user_id,
    v_trip_id,
    trim(city.item->>'city_name'),
    trim(city.item->>'country_name'),
    (city.item->>'latitude')::double precision,
    (city.item->>'longitude')::double precision,
    (city.ordinality - 1)::integer
  from jsonb_array_elements(p_destinations) with ordinality as city(item, ordinality);

  return v_trip_id;
end;
$$;

revoke all on function public.create_trip_with_days_v3(
  text, text, text, date, date, text, jsonb
) from public, anon;
grant execute on function public.create_trip_with_days_v3(
  text, text, text, date, date, text, jsonb
) to authenticated;

create or replace function public.replace_trip_destinations(
  p_trip_id uuid,
  p_destinations jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_destinations is null or jsonb_typeof(p_destinations) <> 'array' then
    raise exception 'Destinations must be a JSON array' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.trips
    where id = p_trip_id and user_id = v_user_id
  ) then
    raise exception 'Trip not found' using errcode = '42501';
  end if;

  delete from public.trip_destinations
  where trip_id = p_trip_id and user_id = v_user_id;

  insert into public.trip_destinations (
    user_id, trip_id, city_name, country_name, latitude, longitude, sort_order
  )
  select
    v_user_id,
    p_trip_id,
    trim(city.item->>'city_name'),
    trim(city.item->>'country_name'),
    (city.item->>'latitude')::double precision,
    (city.item->>'longitude')::double precision,
    (city.ordinality - 1)::integer
  from jsonb_array_elements(p_destinations) with ordinality as city(item, ordinality);
end;
$$;

revoke all on function public.replace_trip_destinations(uuid, jsonb)
  from public, anon;
grant execute on function public.replace_trip_destinations(uuid, jsonb)
  to authenticated;
