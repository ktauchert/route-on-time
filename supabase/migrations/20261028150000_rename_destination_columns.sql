-- Rename German column names if this table was created from the first draft.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routes'
      and column_name = 'ziel_id'
  ) then
    alter table public.routes rename column ziel_id to destination_id;
    alter table public.routes rename column ziel_name to destination_name;
  end if;
end $$;
