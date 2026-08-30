-- Phase 03B.3: configurable record modules and purchase spending semantics.
alter table public.user_profiles
  add column show_expenses boolean not null default true,
  add column show_purchases boolean not null default true,
  add column show_journals boolean not null default true,
  add column show_media_notes boolean not null default false,
  add column record_preferences_configured boolean not null default false,
  add constraint user_profiles_at_least_one_record_module_check check (
    show_expenses or show_purchases or show_journals or show_media_notes
  );

-- Preserve the material entry for users who already recorded media.
update public.user_profiles as profile
set show_media_notes = true
where exists (
  select 1 from public.media_notes as note where note.user_id = profile.user_id
);

alter table public.purchases
  add column purchased boolean not null default false,
  add column include_in_expenses boolean not null default true;

-- Purchases created before this migration represented completed purchases.
update public.purchases set purchased = true;

create index purchases_user_date_spending_idx
  on public.purchases(user_id, date desc)
  where purchased and include_in_expenses;

-- Existing ownership policies continue to cover the new columns; no RLS changes.
