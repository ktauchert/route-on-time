-- Run once in the Supabase SQL editor.
-- A check belongs only to the signed-in person. Today's connection is remembered on the route.

alter table public.routes
  add column if not exists today_refresh_token text,
  add column if not exists today_service_date date;

create table if not exists public.route_checks (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  service_date date not null,
  status text not null check (status in ('fits', 'doesnt-fit', 'unclear')),
  reason text,
  checked_at timestamptz not null default now(),
  connection jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  unique (route_id, service_date)
);

alter table public.route_checks enable row level security;

create policy "route_checks_select_own"
  on public.route_checks for select
  using (auth.uid() = user_id);

create policy "route_checks_insert_own"
  on public.route_checks for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.routes
      where routes.id = route_id and routes.user_id = auth.uid()
    )
  );

create policy "route_checks_update_own"
  on public.route_checks for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.routes
      where routes.id = route_id and routes.user_id = auth.uid()
    )
  );
