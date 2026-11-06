# Roadmap — Tindahan Tracker

> Owned fact: planned and proposed work. Rules, workflow and data shapes live in [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) (head file, start at S0). Finished work is recorded in [`ChangeLog.md`](ChangeLog.md).

**Direction: secure the app first, then continue developing it.** Order is binding (Phase 0, then 1, 2, 3) unless the developer overrides it. Every item is a **proposal** until its status is *Approved* (AI_INSTRUCTIONS S5): the AI does not build from this file unasked.
Status values: `Proposed` · `Approved` · `In progress` · `Done` (when Done: add the version to ChangeLog and drop the row to the Done list).
Findings come from reading the code at v31.0.0. Items marked **(verify)** depend on Supabase/GitHub settings that are not visible in the repo.

## Now
Focus: **Phase 1, secure the app.** Quick wins first, in this order: R-1.1 → R-1.6 → R-1.8 → R-1.4 → R-1.7, then the Auth chain R-1.2 → R-1.3 → R-1.5 → R-1.10 → R-1.9.

## Phase 0 — Housekeeping

| ID | Item | Why | Size | Status |
| --- | --- | --- | --- | --- |
| R-0.1 | Remove the empty stray file `try` at the repo root | Empty, untracked purpose | S | Approved (ships with `Dev1-AIDocs`) |
| R-0.2 | Delete merged/stale branches (about 18 local `Dev1-*`, several remote) | Noise; hides the real branch model | S | Proposed |
| R-0.3 | Add `// ==== SECTION: <name> ====` comment markers in `index.html` (comments only, no behaviour change) | File is about 6,400 lines with no map; markers let the AI jump by grep and save tokens | S | Proposed |
| R-0.4 | **(verify)** Confirm GitHub Pages deploys from `main` only | Guarantees `development` is never live | S | Proposed |

## Phase 1 — Secure the app

Constraints for every item: easy for non-technical users (login as easy as today's PIN, remembered per device), no build step, Supabase client stays on a CDN, app stays one file (AI_INSTRUCTIONS S5).

| ID | Item | Why (evidence) | Size | Depends | Status |
| --- | --- | --- | --- | --- | --- |
| R-1.1 | **(verify)** Check the real Supabase exposure: table policy, whether the repo/site is public | README setup creates policy `for all using (true)`: anyone holding the anon key (visible in page source) can read, overwrite or delete **all** store data over REST, bypassing the PIN and roles. Write the finding into ChangeLog | S | — | Proposed |
| R-1.6 | Pin CDN versions and add Subresource Integrity (`integrity` + `crossorigin`) | `@supabase/supabase-js` has no version and `chart.js@4` only a major; a compromised or changed CDN file runs with full access to the data | S | — | Proposed |
| R-1.8 | Audit every place user text reaches `innerHTML` (names, notes, suppliers, histories, CSV-imported fields); use `escapeHtml()` | `escapeHtml()` is used about 60 times and v28.1.0 fixed XSS surfaces, but with open DB writes (R-1.1) injected markup would run on every family device; notification text interpolates raw names | S-M | — | Proposed |
| R-1.4 | Replace the two native `prompt()` History-passkey asks with a masked bottom-sheet input | `prompt()` shows the passkey in plain text; also the last native prompts (S7 #9) | S | — | Proposed |
| R-1.7 | Separate development database: second Supabase project, URL/key chosen by hostname (localhost → dev, Pages host → live) | Removes the shared-database test risk (S3) with no per-branch edits and no merge conflicts | M | — | Proposed |
| R-1.2 | Supabase Auth + Row Level Security: one login per person, only an allowlist reads/writes `app_state`, Owner/Staff enforced on the server | Roles are deterrent-grade today (S11); everything is client-side | L | R-1.1 | Proposed |
| R-1.3 | Remove `STORE_PIN` and `HISTORY_PASSKEY` from client source: PIN becomes a local screen lock only; history gate becomes a server check or an Owner-role check | Both are constants readable via view-source | M | R-1.2 | Proposed |
| R-1.5 | Drop `codeHash` from `state.people`; personal codes move to Auth | A 4-digit code's SHA-256 inside a readable blob can be brute-forced instantly | M | R-1.2 | Proposed |
| R-1.10 | Move `auditLog` into an append-only table (insert-only policy) | The audit log lives inside the blob that any writer can rewrite; also capped at 400 | M | R-1.2 | Proposed |
| R-1.9 | Content-Security-Policy meta limiting scripts/connections to the pinned CDNs and the Supabase host | Defence in depth; limited value because the single-file design needs inline scripts | S | R-1.6 | Proposed |

## Phase 2 — Data safety & reliability

| ID | Item | Why | Size | Status |
| --- | --- | --- | --- | --- |
| R-2.1 | Automatic snapshots: a history table (daily, plus before a save when the last snapshot is older than 1 hour), 30-day retention, Owner restore screen | One row, last save wins; built-in Supabase backups may be paid-only **(verify)** | M | Proposed |
| R-2.2 | `Backup` notification when the last full export is older than 7 days (follows the S6 notification rule) | Manual export is the only backup today | S | Proposed |
| R-2.3 | Compare-and-set save (reject the update if `_meta.lastSavedAt` changed) or per-record updates | Closes the accepted race in S6. **Only if a real loss has occurred** (S5/S6) | M-L | Proposed |

## Phase 3 — Continue development

| ID | Item | Why | Size | Status |
| --- | --- | --- | --- | --- |
| R-3.1 | Edit an existing loan's fields (today: delete and recreate) | Documented gap, AI_INSTRUCTIONS S8 | M | Proposed |
| R-3.2 | Guard against two Consignment payables linking the same Inventory item | Documented gap, S8 | S | Proposed |
| R-3.3 | _Developer ideas: add rows here._ | | | |

## Done
_Nothing moved here yet. Past releases are in [`ChangeLog.md`](ChangeLog.md)._
