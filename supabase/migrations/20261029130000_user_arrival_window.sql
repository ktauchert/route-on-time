alter table public.user_settings
  add column arrival_window_minutes integer not null default 60,
  add constraint user_settings_window_range check (arrival_window_minutes between 10 and 240);
