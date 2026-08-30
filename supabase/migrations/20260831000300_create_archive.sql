-- Phase 03A: archive records and trip budgets.
alter table public.trips
  add column budget_amount numeric(14, 2) check (budget_amount >= 0),
  add column budget_currency text check (budget_currency is null or budget_currency ~ '^[A-Z]{3}$'),
  add constraint trips_budget_pair_check check (
    (budget_amount is null and budget_currency is null) or
    (budget_amount is not null and budget_currency is not null)
  );

alter table public.itinerary_items
  add constraint itinerary_items_id_trip_user_key unique (id, trip_id, user_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, title text not null check (length(trim(title)) > 0),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  category text not null check (category in ('flight','accommodation','transport','food','shopping','ticket','other')),
  notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint expenses_trip_owner_fkey foreign key (trip_id,user_id) references public.trips(id,user_id) on delete cascade
);
create table public.purchases (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, title text not null check (length(trim(title)) > 0),
  amount numeric(14,2) not null check (amount >= 0), currency text not null check (currency ~ '^[A-Z]{3}$'),
  location text not null default '', recipient text not null default '', notes text not null default '', organized boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint purchases_trip_owner_fkey foreign key (trip_id,user_id) references public.trips(id,user_id) on delete cascade
);
create table public.media_notes (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  trip_day_id uuid, itinerary_item_id uuid,
  media_type text not null check (media_type in ('video','photo','audio','other')),
  filename text not null check (length(trim(filename)) > 0), notes text not null default '', favorite boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint media_notes_trip_owner_fkey foreign key (trip_id,user_id) references public.trips(id,user_id) on delete cascade,
  constraint media_notes_day_owner_fkey foreign key (trip_day_id,trip_id,user_id) references public.trip_days(id,trip_id,user_id) on delete cascade,
  constraint media_notes_item_owner_fkey foreign key (itinerary_item_id,trip_id,user_id) references public.itinerary_items(id,trip_id,user_id) on delete cascade
);
create table public.journals (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  trip_day_id uuid not null, content text not null check (length(trim(content)) > 0), rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint journals_trip_owner_fkey foreign key (trip_id,user_id) references public.trips(id,user_id) on delete cascade,
  constraint journals_day_owner_fkey foreign key (trip_day_id,trip_id,user_id) references public.trip_days(id,trip_id,user_id) on delete cascade,
  constraint journals_user_day_key unique(user_id,trip_day_id)
);

create index expenses_user_trip_date_idx on public.expenses(user_id,trip_id,date desc);
create index purchases_user_trip_date_idx on public.purchases(user_id,trip_id,date desc);
create index media_notes_user_trip_idx on public.media_notes(user_id,trip_id);
create index journals_user_trip_idx on public.journals(user_id,trip_id);

create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger purchases_set_updated_at before update on public.purchases for each row execute function public.set_updated_at();
create trigger media_notes_set_updated_at before update on public.media_notes for each row execute function public.set_updated_at();
create trigger journals_set_updated_at before update on public.journals for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;
alter table public.purchases enable row level security;
alter table public.media_notes enable row level security;
alter table public.journals enable row level security;
revoke all on public.expenses, public.purchases, public.media_notes, public.journals from anon;
grant select,insert,update,delete on public.expenses, public.purchases, public.media_notes, public.journals to authenticated;

do $$ declare t text; begin
  foreach t in array array['expenses','purchases','media_notes','journals'] loop
    execute format('create policy "Users can read own %1$s" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create policy "Users can create own %1$s" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "Users can update own %1$s" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "Users can delete own %1$s" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)',t);
  end loop;
end $$;
