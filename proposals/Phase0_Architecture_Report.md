# Phase 0 report: local-first transactions

Date: 2026-11-07. Scope: inspection only, no application code changed.
Evidence: `investigation/evidence.txt`, `investigation/evidence_dataloss.txt` (scripts alongside).
Limits: no access to the live Supabase project, no real phone, no two-device test. Items marked **[verify]** need that.

## Answers to the 15 questions

| # | Answer |
|---|---|
| 1 | Uploaded copy: branch `Dev1-Proposals` at `2e59470` (docs on top of `development` `eadbe1c`). Working tree has CRLF line endings plus my uncommitted v31.0.1 and v31.0.2 changes. |
| 2 | One Supabase row: table `app_state`, `id = 1`, column `data` (a single JSON blob holding every list). |
| 3 | `localStorage` only: one key `tindahan-offline-queue` holding a copy of the **whole state**, written only when a save fails or the device is offline. No IndexedDB. |
| 4 | **Whole state.** `saveState()` runs `update({ data: state })` for every change (about 60 call sites). |
| 5 | Fire-and-forget. `addDaily()` calls `saveState()` without awaiting, then `render()` runs immediately. Nothing prevents overlapping saves. |
| 6 | Before saving, it re-reads the server row and compares `_meta.lastSavedAt` to the last value this device saw. A mismatch shows a `confirm()`. `lastKnownSavedAt` is advanced before the write finishes, so an overlapping save can flag the app's own write. Offline replay (`processOfflineQueue`) asks "Overwrite server?" when the server is newer. Both are last-write-wins behind a prompt. |
| 7 | **There are no realtime subscriptions.** Instead, every 20 s on Home or Summary, `loadState()` replaces in-memory lists with the server copy (`Object.assign`). It does not check for unsynced local entries. |
| 8 | **No.** No record in any list has an ID. Delete and undo use array index (`delItem(key, idx)`, `pushUndo` stores `idx`). |
| 9 | Not visible from the repo (no SQL, RLS or schema files). **[verify]** columns, policies, whether `updated_at` exists. |
| 10 | Not per record. A whole-blob overwrite is repeatable but not merge-safe. Per-record idempotency has to be done in client code (see D) or with new tables. |
| 11 | IndexedDB (asynchronous, larger quota, survives restarts). `localStorage` is synchronous, about 5 MB, and is already the whole-state copy. Call `navigator.storage.persist()`. iOS may evict site data for sites not installed to the Home Screen **[verify]**. |
| 12 | A durable outbox of pending operations in IndexedDB, replayed on startup, on the `online` event, and by Sync Now. Today only the startup path replays, and only if the queue still exists (see risk R1). |
| 13 | Same push, `saveState()`, `render()` pattern: Daily, GCash, Payables, Receivables, Suppliers, Inventory, Household, Household History, Expansion Log, Price Alerts, Stock History, Users. Reproduced only for Daily. |
| 14 | `dailyLogs` is read in 16 places: `getMonthSummary`, `renderSummary`, `getDailyIncomeExpense`, `todayLogged`, `renderUserPanel`, `buildMonthOptions`, `renderDaily`, `renderDataTools`, `resetData`, `ensureInventoryFields`. Month totals **sum every row** and the per-date chart groups rows by date, so several entries on one date are already safe, and a blank ₱0 row adds 0 to totals. A blank on a new date adds a ₱0 day to the per-date list. Adding fields to new rows (`id`, `storeClosed`) breaks none of these. |
| 15 | See section D. |

## A. Current architecture

`state` (in memory) is the working copy. Every action edits it, calls `saveState()` (which uploads all of it), and re-renders. The server row is shared by every device. A 20 s timer on Home and Summary re-downloads and replaces the lists. The only local backup is the offline-queue key.

## B. Affected files and functions

Single file `index.html` (+ `ChangeLog.md`, `Roadmap.md`, `AI_INSTRUCTIONS.md`). Phase 1: `renderDaily()`, `addDaily()`. Phase 2: `saveState()`, `loadState()`, `processOfflineQueue()`, `startAutoRefresh()`, `delItem()` and undo restore, plus a new outbox and sync section. Phase 3: `renderSettings()`, prefs helpers (`PREFS_KEY`), new toast and popup helpers. Phase 4: new Issues view and sidebar entry. No change to calculations, `canView`, PIN or person-code logic.

## C. Technical risks

| ID | Risk | Evidence |
|---|---|---|
| **R1 (data loss, exists today)** | After one failed save, the 20 s refresh replaces memory with the server copy, and the next successful save deletes the offline queue. The entry is gone. The `online` listener only replays when `isOfflineMode` is set, which a failed save does not set. | Reproduced: entry saved with one 503, refresh tick, later save. Memory 1 → 0, server ended with only the later entry (`evidence_dataloss.txt`). A page reload before the later save would have recovered it. |
| R2 | Whole-blob writes: two devices saving close together overwrite each other (prompt only). | Code reading. |
| R3 | Index-based delete and undo become wrong once the list is merged or reordered by sync. | Code reading. |
| R4 | `Read-only` mode skips saves but `addDaily()` still adds to memory. Local-first must not say "saved" in that mode. | Code reading. |
| R5 | Backfilling IDs onto old rows rewrites live data. | Additive, but needs a prior export and approval. |
| R6 | Offline replay compares timestamps as strings and then asks "Overwrite server?" (last-write-wins). | Code reading. |
| R7 | The real Supabase client's behaviour (serialisation timing, JSON-path filters) is untested here. | **[verify]** |

## D. Proposed architecture (smallest safe)

Keep the single-blob backend. Add no table.

1. **Identity:** new records get `id` (UUID), `createdAt`, `status`. Old rows are untouched until the owner approves a backfill.
2. **Outbox (IndexedDB):** each save writes the entry plus an operation `{opId, type: "add", category, record}` as an immutable copy, then resets the form and shows "Saved on this device".
3. **Sync worker (one at a time):** read the server blob, apply the operation **by `id`** (skip if that `id` already exists, which makes retries and lost responses safe), write back with a compare-and-swap on `_meta.lastSavedAt` (PostgREST JSON-path filter on the update, **[verify]**; fallback is a small Postgres function, which would be a migration). On a swap failure, refetch and retry with backoff. Mark the operation synced only after the server confirms.
4. **Polling made outbox-aware:** the 20 s refresh and `loadState()` merge pending outbox records over the server copy instead of replacing. This closes R1 independently of the rest.
5. **Notifications:** one `notify(category, severity, text)` helper. Toasts always on; popups per category in Settings, stored per device with the existing prefs; sound and particles last, obeying the existing "No motion" setting.
6. **Issues:** with add-only operations merged by ID, true conflicts are rare (the app has no edit for daily entries, only delete). The Issue Center then mainly holds failed or rejected operations and delete-versus-add disagreements. Phase 4 should be re-scoped after Phase 2 rather than built to the full keep-local, keep-server, merge, edit, discard spec up front.

## E. Implementation plan

| Phase | Content | Needs |
|---|---|---|
| **1-pre (recommended now)** | Close R1 only: polling skips replacing when an offline queue exists, and the queue is cleared only after its entries are confirmed on the server. | Approval to touch save and load code. |
| 1 | Daily safeguards: zero rules, all-zero confirm, Store Closed (`storeClosed` field), same-date warning, submit guard, reset after commit. Uses `confirm()` and a small toast until Phase 3. | Decisions 3 and 4 below. |
| 2 | IndexedDB outbox, stable IDs, sync worker, statuses, retry, offline, Sync Now. | Decisions 1 and 2. |
| 3 | Notification service and Settings → Notifications. | Decisions 5 and 6. |
| 4 | Issue Center, re-scoped after Phase 2. | Decision 7. |
| 5 | Regression plus real-phone and two-device testing. | Owner's phone. |

## F. Testing plan

Playwright with a stateful mock that supports latency, one-shot failure, lost response, stale reads and two browser contexts, plus a test against a **Supabase test project** for R7. Automated: single, double, triple and rapid taps, empty, partial, all-zero, Store Closed, same-date warning, refresh and restart with pending items, offline then reconnect, retry without duplicates, outbox immutability, polling during pending, read-only. Calculations compared before and after on a copy of real exported data. Owner-only: real phone touch input and real mobile network.

## G. Approval required

1. Add `id` (UUID) to **new** records only, with backfill of old rows later after an export?
2. Proceed with the no-migration compare-and-swap design, tested first on a Supabase test project? Fallback is a Postgres function or per-category tables (a migration).
3. Zero-field notice: the spec asks for a notice whenever some field is zero. That fires on most normal entries (fee and moved-to-household are often 0). Proposal: quiet toast only, popup off by default. OK?
4. Same-date warning wording and the all-zero wording as written in the spec?
5. "Important popups on by default" conflicts with "avoid excessive popups". Confirm which wins for the duplicate, all-zero and conflict popups.
6. Notification settings stored per device (not shared through the database)?
7. Re-scope Phase 4 as described in D6?
8. Approve the **Phase 1-pre** fix for R1 before everything else?
9. Please provide: Supabase `app_state` columns and policies (or a screenshot), and the size of an exported JSON of the live data, so sizes and migration risk can be checked.
