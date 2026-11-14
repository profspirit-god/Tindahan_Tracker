# ChangeLog — Tindahan Tracker

> Every change is recorded here, newest first. Format and rules: [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) S4. Plans: [`Roadmap.md`](Roadmap.md).
> Entries before `Docs — 2026-11-06` are reconstructed from git history (one line each).

## v31.0.7 — 2026-11-13 — Dev1-LocalFirst
- Phase 2 step 2c (approved plan, per-device switch, OFF by default): Data Tools > "Experimental (this device only)" > "Save entries on this device first". With the switch OFF the app behaves exactly as v31.0.6 (no IndexedDB database is even created). With it ON, a new Daily entry gets a UUID `id` and `createdAt`; the entry and its sync instruction are written to IndexedDB in ONE transaction before "saved on this device" is claimed and the form resets. If that commit fails, nothing is saved and the form is kept (red toast). If on-device storage does not exist in the browser, the standard save is used with one warning (D5). The upload itself still uses the existing save path (v31.0.3 protections); the on-device record is marked synced only after the server confirmed. At startup an entry saved on this device that is missing from the shared data is NEVER restored automatically: the owner is asked (OK restores with its original id, Cancel is remembered). Deleting an entry on purpose is recorded so it is never offered for restore. Sync-core logic from `sync-core/` is inlined (`SyncCore`, tested identical). `addDaily()` is now `async` (guard against overlapping saves).
- Files: `index.html` (`SyncCore`, `LocalStore`, `localFirstOn`, `setLocalFirst`, `showLocalStatus`, `markConfirmedOps`, `reconcileLocalStore`, `addDaily`/`addDailyInner`, `delItem`, `startApp`, `getPrefs`, `renderDataTools`, `APP_VERSION`), `ChangeLog.md` · Data shape touched: additive optional `id`/`createdAt` on new Daily entries made with the switch ON · Calculations unchanged · No revision number or database trigger yet · Requires v31.0.6

## v31.0.6 — 2026-11-12 — Dev1-BackupButton
- One-tap backup (owner, Home): new "Download backup / I-download ang backup" button at the end of Quick Actions, with a "last backup from this device" line. It downloads the FRESH shared data (not this phone's possibly stale copy); if this phone has unsynced changes or is offline it uses this phone's copy and says so. Filename `tindahan_backup_YYYY-MM-DD_HHMM_vX.json`; toast shows counts (daily entries, GCash logs, items, payables, suki utang) to compare with paper records. READ-ONLY: never writes to the server. Same file shape as "Export full app state", so Data Tools > "Import state from file" restores it (round trip tested). Existing Data Tools exports unchanged. `notify()` accepts an optional duration.
- Files: `index.html` (`downloadBackup`, `lastBackupText`, Home Quick Actions, `notify`, `APP_VERSION`), `ChangeLog.md` · Data shape touched: no · Requires v31.0.5

## v31.0.5 — 2026-11-11 — Dev1-DailySafeguards
- Daily Entry feedback after owner testing: the save toast now reads "Entry saved on this device. Waiting to sync." and changes to "Entry saved and synced." only after the server confirms (stays at "Waiting to sync" offline). Cancelling the all-zero or same-date confirmation now shows "Not saved. Your entry is still in the form." so a cancelled (or browser-blocked) popup is never silent. Toast keeps a second line for the ₱0 fields.
- Files: `index.html` (`notify`, `addDaily`, toast CSS, `APP_VERSION`), `ChangeLog.md` · Data shape touched: no · Requires v31.0.4

## v31.0.4 — 2026-11-11 — Dev1-DailySafeguards
- Phase 1 (approved): Daily Entry safeguards. Empty fields count as ₱0. All-zero entry asks "All monetary fields are ₱0. Are you sure you want to save this entry?" (skipped when Store Closed is ticked). New **Store closed today** checkbox sets the five amounts to 0 (still editable) and stores `storeClosed: true` on the entry; history rows show "Store closed". Any existing entry on the chosen date triggers "An entry already exists for [date]. Proceed anyway? …" (pref `warnDuplicate`, default on). Tap guard: taps within 0.8 s after a save are ignored, so a reset form can no longer log a blank entry. Small reusable `notify()` toast: "Entry saved on this device." plus the list of ₱0 fields; red error toast if the on-device copy could not be written. Read-only mode now refuses Daily saves honestly and keeps the form. New per-device prefs `warnDuplicate` (true) and `zeroDetailPopup` (false); no Settings screen yet (Phase 3).
- Files: `index.html` (`renderDaily`, `addDaily`, new `notify`/`setDailyClosed`, `getPrefs`, toast CSS, `APP_VERSION`), `ChangeLog.md` · Data shape touched: additive optional `storeClosed` on new entries only · Calculations unchanged · Requires v31.0.3

## v31.0.3 — 2026-11-08 — Dev1-PendingSaveFix
- Phase 1-pre (R1 data-loss fix, approved): a save now writes a full copy to the existing offline-queue key BEFORE uploading and removes it only after the server confirms that same snapshot. While that copy exists, `loadState()` (20 s poll, going to Home/Summary, Refresh button) never replaces in-memory data, and on startup the copy becomes the working state. Background retries are silent (no dialogs, never discard); `online` event now also replays after a failed save. Discarding a queued copy in the conflict prompt first keeps a recovery copy (`tindahan-recovery-*`, newest 5). `lastKnownSavedAt` now advances only after a confirmed save (removes false 'Someone else updated' prompts after failures/double-taps). `saveState()` split into `saveState()` + `pushStateToServer()`; uploads a snapshot, not the live `state` object.
- Files: `index.html` (`saveState`, new `pushStateToServer`, `loadState`, `processOfflineQueue`, `online` listener, 5 small helpers, `APP_VERSION`), `ChangeLog.md` · Data shape touched: no · Requires v31.0.2

## v31.0.2 — 2026-11-07 — Dev1-MobileHome
- Phase B (R-3.3, approved): Home on phones now shows Quick Actions first (Today's Entry, GCash Float, Household Budget, Inventory, Insights), then the figures. Data Tools removed from Home Quick Actions only; it stays in the sidebar. Owner Home only. Desktop two-column layout unchanged (reorder applies below 900px).
- Files: `index.html` (`renderHome()` markup: `home-split` / `home-actions` classes and buttons; one CSS media block after `.split`; `APP_VERSION`), `ChangeLog.md` · Data shape touched: no · Roadmap item: R-3.3 · Requires v31.0.1 (Phase A)

## v31.0.1 — 2026-11-06 — Dev1-MobileHeader
- Phase A (R-3.3, approved): narrow-phone header. Right padding was always 124px (room for the undo button even when hidden); it is now 68px and returns to 124px only while undo is visible (`body.has-undo`, toggled in `showUndoIndicator()`). At 320-430px the title is 20px and the subtitle 13px with balanced wrapping. Desktop (900px and up) untouched.
- Files: `index.html` (`header.top` CSS, two small media blocks, one line in `showUndoIndicator()`, `APP_VERSION`), `ChangeLog.md` · Data shape touched: no · Roadmap item: R-3.3

## Docs — 2026-11-06 — Dev1-Proposals
- Added two owner proposals under `proposals/` so every device can read them: mobile-first UI/UX refinement and family access & security architecture. Both are proposals only: not approved, nothing built.
- `Roadmap.md`: added R-1.11 (security proposal on file) and R-3.3 (UI/UX proposal, assessed) as Proposed. `AI_INSTRUCTIONS.md` S0 file map: added the `proposals/` row.
- Files: `proposals/Tindahan_Tracker_Mobile_First_UI_UX_Improvement_Proposal.md`, `proposals/Tindahan_Tracker_Family_Access_Security_Proposal.md`, `AI_INSTRUCTIONS.md`, `Roadmap.md`, `ChangeLog.md` · No version bump, no tag (docs-only) · Data shape touched: no · Roadmap item: R-1.11, R-3.3

## Docs — 2026-11-06 — Dev1-AIDocs
- `AI_INSTRUCTIONS.md` restructured into indexed sections S0–S13 with a task-to-section routing table; every fact now lives in one section (others point to it); all previous rules retained.
- New rules: session protocol, token-saving read rules, changed-files-only zip layout, copy-paste Git command template (branch from `development`, PR to `development`, test, PR to `main`, tag), shared-database test rules, version/commit/ChangeLog formats, secrets handling.
- Branch model recorded: `main` = live app, `development` = development side, all working branches start from `development`.
- Fixed doc drift: stale `v28.7.1` references removed (code and tag are `v31.0.0`); docs now point to `APP_VERSION`. Documented previously unwritten behaviour: offline queue, `people`/`auditLog` shapes, `receivables`, all 18 views, 9 notification types, two remaining `prompt()` calls, `resetData()` scope.
- `README.md` slimmed to a human overview that points to the head file (pots, data model, versioning, test steps moved out of it, not duplicated).
- Added `Roadmap.md` (secure first, then develop) and this file. Removed the empty stray file `try`.
- Files: `AI_INSTRUCTIONS.md`, `README.md`, `Roadmap.md`, `ChangeLog.md`, deleted `try` · No version bump, no tag (docs-only) · Data shape touched: no · Roadmap item: R-0.1

## v31.0.0 — 2026-11-06 — Dev1-UIRedesign
- Monochrome redesign, SVG icon set, plain-language verdict, 44px touch targets. MAJOR: new design system, no data-model change.

## v30.0.0 — 2026-09-14
- People, Owner/Staff roles, personal codes, staff home, owner-only audit log.

## v29.0.1 — 2026-09-14
- Fix: TDZ crash from early `applyPrefs()`, auto-open nav group on navigate, restore daily icon.

## v29.0.0 — 2026-09-14
- Grouped navigation, Data Tools tab, user panel, Settings, dark mode, PIN lockout.

## v28.8.0 — 2026-09-14
- Fix: CSV import tolerates Excel phantom rows, locale delimiters, off-row-1 headers.

## v28.7.2 — 2026-09-14
- Bulk inventory CSV round-trip with duplicate guards, 8-way sorting.

## v28.7.1 — 2026-09-13
- Low-margin warnings, docs sync.

## v28.7.0 — 2026-09-13
- Receivables: Suki Utang tab (money owed to the store).

## v28.6.0 — 2026-09-13
- Comfort pack: text size and motion toggles, dead-stock alerts, reorder suggestions.

## v28.5.1 — 2026-09-13
- Fix: repaired 3 corrupted pastes from the v28.5.0 merge.

## v28.5.0 — 2026-09-13
- Catch-up release: restored lost v28.3.0 clarity, completed sales-compare, fixed banner.

## v28.4.0 — 2026-09-12
- Fix: pot-aware sales reconstruction for mixed cash pots.

## v28.2.3 — 2026-09-12
- Accessibility: pinch-zoom unlocked, `dvh` heights, aria-labels, inactivity auto-lock.

## v28.2.2 — 2026-09-12
- Partial payments for one-time loans, list pagination, CSV export.

## v28.2.1 — 2026-09-12
- All quantity entry through bottom-sheet modals; debounced search.

## v28.2.0 — 2026-09-12
- Offline write queue and resilient state loading.

## v28.1.0 — 2026-09-12
- Fix: UTC date bug, broken UI elements, XSS surfaces.

## v28.0.0 — 2026-09-12
- Black-and-white minimalist redesign, arrow-based pos/neg, new typography (Amethyst theme later applied; superseded by v31.0.0).

## v27.4.0 — 2026-09-12
- Collapsible notification groups with type icons.

## v27.3.0 — 2026-09-12
- Fix: Sales double-counting; Today's Entry uses Ending Cash.

## v27.1.0 — 2026-09-04
- Reminder notification for missed or pending daily entries.

## v27.0.0 — 2026-09-04
- Consignment loan type linked to inventory sales; mixed owned/consignment stock.

## v26.1.0 — 2026-09-04
- Save-conflict detection between devices.

## v26.0.0 — 2026-09-04
- Installment loan type with partial payments and schedule-aware due notifications.

## v25.0.0 — 2026-08-19
- Undo stack and reversible-migration helper; deletions undoable.

## v24.0.0 — 2026-08-19
- Safe export/import, row backups, read-only mode (Data Tools).

## v23.0.0 — 2026-08-15
- Suppliers tab with scheduling, price tracking and alerts; unified notification bell.

## v22.0.0 to v22.1.0 — 2026-08-15
- Inventory Health Matrix (ABC × Fast/Slow/Dead, GMROI); fix search focus loss.

## v1 to v21.6.7 — 2026-08-01 to 2026-08-15
- Initial app, PIN lock, Word export, usernames and audit trail, Household budget and history, Insights charts, full Inventory system (categories, expiry, composite products), Store Health dashboard, Expansion (Stall) pot, Stock History. Not itemised; see `git log`.
