-- Run once in the Supabase SQL editor.
-- A route prefers a kind of transport instead of one named line, and may ask for relaxed travel.
-- line_id and line_name stay in the table, unused, so the previous version of the app keeps working until the new one is live.

alter table public.routes
  add column if not exists preferred_mode text,
  add column if not exists relaxed boolean not null default false,
  add constraint routes_preferred_mode_known
    check (preferred_mode is null or preferred_mode in ('suburban', 'regional', 'subway', 'tram', 'bus'));
