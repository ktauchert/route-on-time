-- Run once in the Supabase SQL editor.
-- The alternative sits next to the check, for the same person.

alter table public.route_checks
  add column if not exists alternative jsonb,
  add column if not exists no_alternative boolean not null default false;
