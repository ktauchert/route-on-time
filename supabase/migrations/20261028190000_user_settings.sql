-- Run once in the Supabase SQL editor.
-- Each person chooses how many minutes pass between clock checks. One minute is the floor.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  check_interval_minutes integer not null default 5,
  constraint user_settings_interval_range check (check_interval_minutes between 1 and 180)
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id);
