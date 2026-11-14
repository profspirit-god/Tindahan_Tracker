# sync-core (Phase 2, step 2b)

Pure logic for the future local-first sync: ids, fingerprints for legacy rows, operations, applying them safely and repeatably, revision helpers, retry timing.

**Not loaded by `index.html`.** It changes nothing in the running app. It will be pasted into `index.html` in a later step, behind a per-device switch that is off by default.

Run the tests (needs only Node, no packages): `node sync_core_tests.js`
