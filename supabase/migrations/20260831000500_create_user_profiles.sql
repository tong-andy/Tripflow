-- Phase 03B.2: user-level profile and navigation preferences.
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  home_location text not null default '',
  default_currency text not null default 'CNY'
    check (default_currency ~ '^[A-Z]{3}$'),
  default_timezone text not null default 'Asia/Shanghai'
    check (public.is_valid_timezone(default_timezone)),
  default_map_provider text not null default 'system'
    check (default_map_provider in ('system', 'apple', 'amap', 'baidu', 'google')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon;
grant select, insert, update, delete on public.user_profiles to authenticated;

create policy "Users can read own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own profile"
  on public.user_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);
