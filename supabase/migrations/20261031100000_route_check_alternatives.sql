-- Run once in the Supabase SQL editor.
-- Up to three alternatives and the nearest connection sit next to the check.
-- The old single alternative moves over; its column stays unused.

alter table public.route_checks
  add column if not exists alternatives jsonb not null default '[]'::jsonb,
  add column if not exists nearest jsonb;

update public.route_checks
  set alternatives = jsonb_build_array(alternative)
  where alternative is not null and alternatives = '[]'::jsonb;
