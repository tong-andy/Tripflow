-- Phase 03B.4: user-authored trip-level note.
alter table public.trips
  add column travel_note text
  check (travel_note is null or length(travel_note) <= 10000);

-- Existing trip ownership policies cover this column; no RLS changes.
