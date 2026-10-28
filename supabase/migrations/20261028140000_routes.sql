-- Run once in the Supabase SQL editor.
-- A route belongs only to the signed-in person.

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  start_id text not null,
  start_name text not null,
  ziel_id text not null,
  ziel_name text not null,
  arrival time not null,
  weekdays text[] not null,
  transfer_minutes integer,
  max_transfers integer,
  line_id text,
  line_name text,
  created_at timestamptz not null default now(),
  constraint routes_different_stops check (start_id <> ziel_id),
  constraint routes_has_a_weekday check (cardinality(weekdays) > 0)
);

alter table public.routes enable row level security;

create policy "routes_select_own"
  on public.routes for select
  using (auth.uid() = user_id);

create policy "routes_insert_own"
  on public.routes for insert
  with check (auth.uid() = user_id);

create policy "routes_update_own"
  on public.routes for update
  using (auth.uid() = user_id);

create policy "routes_delete_own"
  on public.routes for delete
  using (auth.uid() = user_id);
