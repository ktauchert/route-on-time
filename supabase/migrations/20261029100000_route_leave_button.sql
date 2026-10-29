-- Run once in the Supabase SQL editor.
-- A route may start with a leave button instead of an arrival time.
-- No arrival means the person taps when they leave, and left_at remembers when.

alter table public.routes
  alter column arrival drop not null,
  add column if not exists left_at timestamptz;
