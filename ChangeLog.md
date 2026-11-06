# ChangeLog — Tindahan Tracker

> Every change is recorded here, newest first. Format and rules: [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) S4. Plans: [`Roadmap.md`](Roadmap.md).
> Entries before `Docs — 2026-11-06` are reconstructed from git history (one line each).

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
