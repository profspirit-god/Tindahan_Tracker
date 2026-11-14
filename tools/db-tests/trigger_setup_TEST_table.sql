-- TEST TABLE ONLY. Does not touch app_state. Run in Supabase > SQL Editor.
-- Written without a database to validate it on: the test page below is its first real run.

create table if not exists public.app_state_trigger_test (id integer primary key, data jsonb);
alter table public.app_state_trigger_test enable row level security;
drop policy if exists "public read/write" on public.app_state_trigger_test;
create policy "public read/write" on public.app_state_trigger_test
  for all to public using (true) with check (true);

create or replace function public.app_state_trigger_test_guard()
returns trigger
language plpgsql
as $$
declare
  old_rev bigint;
  new_rev bigint;
begin
  -- SQL editor and service role are exempt so the owner can always repair data by hand.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  old_rev := coalesce((old.data -> '_meta' ->> 'revision')::bigint, 0);
  new_rev := (new.data -> '_meta' ->> 'revision')::bigint;
  if new_rev is null or new_rev <> old_rev + 1 then
    raise exception 'app_state revision conflict: expected %, got %',
      old_rev + 1, coalesce(new_rev::text, 'none')
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists app_state_trigger_test_guard on public.app_state_trigger_test;
create trigger app_state_trigger_test_guard
  before update on public.app_state_trigger_test
  for each row execute function public.app_state_trigger_test_guard();

notify pgrst, 'reload schema';
