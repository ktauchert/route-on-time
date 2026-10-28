-- Run once in the Supabase SQL editor.
-- Remembers where the rest of a trip was searched from. The route start stays as stored.

alter table public.route_checks
  add column if not exists search_from_name text;
