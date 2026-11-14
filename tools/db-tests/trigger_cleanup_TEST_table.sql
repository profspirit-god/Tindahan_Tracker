-- Removes everything the trigger test created. Safe: only the test table and its function.
drop table if exists public.app_state_trigger_test cascade;
drop function if exists public.app_state_trigger_test_guard();
