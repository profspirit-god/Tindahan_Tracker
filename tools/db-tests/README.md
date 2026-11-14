# Database test tools (Phase 2)

Open the `.html` files by double-clicking them in a normal browser tab (not an editor preview).
Enter your Supabase Project URL and the public anon/publishable key. Never a service-role key, password or token. Nothing is stored or sent anywhere except to your own Supabase project.

- `cas_test.html`: checks the "write only if unchanged" update. Touches **row id 999 only** of `app_state`, never row 1.
- `trigger_setup_TEST_table.sql`, `trigger_test.html`, `trigger_cleanup_TEST_table.sql`: test the revision trigger on a **separate test table**, never on `app_state`.

The trigger is NOT installed on `app_state`. That is a later, separately approved step.
