-- Phase 02B-1: core TripFlow schema and ownership policies.
-- Browser clients use the publishable key; authorization is enforced by RLS.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  destination text not null check (length(trim(destination)) > 0),
  departure_location text not null check (length(trim(departure_location)) > 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_valid_date_range check (end_date >= start_date),
  constraint trips_id_user_id_key unique (id, user_id)
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number integer not null check (day_number > 0),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_days_trip_owner_fkey
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,
  constraint trip_days_trip_day_number_key unique (trip_id, day_number),
  constraint trip_days_trip_date_key unique (trip_id, date),
  constraint trip_days_id_trip_user_key unique (id, trip_id, user_id)
);

create table public.preparation_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  category text not null
    check (category in ('documents', 'booking', 'packing', 'other')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preparation_items_trip_owner_fkey
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  trip_day_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  time time not null,
  place_name text not null check (length(trim(place_name)) > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  notes text not null default '',
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_items_trip_owner_fkey
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,
  constraint itinerary_items_day_trip_owner_fkey
    foreign key (trip_day_id, trip_id, user_id)
    references public.trip_days (id, trip_id, user_id)
    on delete cascade
);

create index trips_user_id_idx on public.trips (user_id);
create index trip_days_user_trip_idx on public.trip_days (user_id, trip_id);
create index preparation_items_user_trip_idx
  on public.preparation_items (user_id, trip_id);
create index itinerary_items_user_trip_day_idx
  on public.itinerary_items (user_id, trip_id, trip_day_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger trip_days_set_updated_at
before update on public.trip_days
for each row execute function public.set_updated_at();

create trigger preparation_items_set_updated_at
before update on public.preparation_items
for each row execute function public.set_updated_at();

create trigger itinerary_items_set_updated_at
before update on public.itinerary_items
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.preparation_items enable row level security;
alter table public.itinerary_items enable row level security;

revoke all on public.trips from anon;
revoke all on public.trip_days from anon;
revoke all on public.preparation_items from anon;
revoke all on public.itinerary_items from anon;

grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_days to authenticated;
grant select, insert, update, delete on public.preparation_items to authenticated;
grant select, insert, update, delete on public.itinerary_items to authenticated;

create policy "Users can read own trips"
on public.trips for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own trips"
on public.trips for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own trips"
on public.trips for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own trips"
on public.trips for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own trip days"
on public.trip_days for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own trip days"
on public.trip_days for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own trip days"
on public.trip_days for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own trip days"
on public.trip_days for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own preparation items"
on public.preparation_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own preparation items"
on public.preparation_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own preparation items"
on public.preparation_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own preparation items"
on public.preparation_items for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own itinerary items"
on public.itinerary_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own itinerary items"
on public.itinerary_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own itinerary items"
on public.itinerary_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own itinerary items"
on public.itinerary_items for delete to authenticated
using ((select auth.uid()) = user_id);
