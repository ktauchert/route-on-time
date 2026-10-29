-- Run once in the Supabase SQL editor.
-- A failed check leaves the last good stand of the day and only notes when it failed.

alter table public.route_checks
  add column if not exists failed_at timestamptz;
