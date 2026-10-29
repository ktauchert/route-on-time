-- Run once in the Supabase SQL editor.
-- A route may leave single lines out of the search, for example the S7.
-- The names are line names as the timetable writes them, without spaces.

alter table public.routes
  add column if not exists avoid_lines text[] not null default '{}';
