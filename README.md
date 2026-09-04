# Tindahan Tracker

A shared, single-file web app for tracking a family sari-sari store's cash flow, inventory, suppliers, and household budget — built to solve one problem: **the family could not tell if the store was profitable or not.**

Built collaboratively with Claude (Anthropic), iteratively, feature-by-feature, based on real problems the store's owners hit while using it. There is no build step, no framework, and no local dependencies — it is intentionally simple to keep it maintainable by non-professional developers.

**Current version: `v27.1.0`** (shown at the bottom of the sidebar, from the `APP_VERSION` constant near the top of the script).

## Who this is for

- **End users:** the store owner (Father), co-owner (Mother), an aunt who works the counter (Tita), and the developer/son (you). None of them beyond the developers are technical — UI decisions prioritize large touch targets, minimal steps, and bilingual (English + Filipino) labels over cleverness.
- **Developers:** currently two, both working with Claude as a coding assistant. See `AI_INSTRUCTIONS.md` for how to brief Claude (or any AI assistant) on this codebase.

## Tech stack

- **Frontend:** a single `index.html` file — vanilla HTML/CSS/JS, no framework, no build step, no bundler.
- **Charts:** [Chart.js](https://www.chartjs.org/) v4, loaded via CDN (`cdn.jsdelivr.net`).
- **Backend/storage:** [Supabase](https://supabase.com/) (Postgres + REST via `@supabase/supabase-js` v2, loaded via CDN). One shared table, one row, storing the entire app state as a single `jsonb` blob.
- **Hosting:** GitHub Pages, deployed straight from the repo — no CI, no staging environment. This is a deliberate choice for a project this size (see "Why so simple?" below).

## Getting started

1. Clone the repo.
2. Open `index.html` directly in a browser, or use a local dev server (e.g. VS Code's "Live Server" extension) — **do not open via `file://`**, it causes CORS/security quirks with Supabase. Live Server or the deployed GitHub Pages URL both work fine.
3. Supabase setup (if setting up a fresh instance):
   ```sql
   create table app_state (
     id int primary key,
     data jsonb
   );
   insert into app_state (id, data) values (1, '{}');

   alter table app_state enable row level security;
   create policy "public read/write" on app_state
     for all using (true) with check (true);
   ```
   Then set `SUPABASE_URL` and `SUPABASE_KEY` (the anon/publishable key — never the service_role key) near the top of `index.html`.
4. Deploy: standard `git add . && git commit -m "..." && git push`. GitHub Pages picks it up automatically.

## Core concept: the "money pots"

The entire app is built around keeping four types of money **strictly separate**, since mixing them was the root cause of the family not knowing their real financial position:

| Pot | Purpose | Tracked in |
|---|---|---|
| **Store Cash** | Buying/selling stock | Today's Entry |
| **GCash Float** | Customer cash-in/cash-out service only — never supplier payments | GCash |
| **Household** | Family living expenses, drawn from the store | Household Budget |
| **Expansion** | A *separate business* (an ihaw-ihaw stall) being built by the family — must never be counted as a store expense | Expansion (Stall) |

**Any new feature must respect this separation.** If you're not sure which pot a transaction belongs to, ask before writing it to `dailyLogs`.

Note: Consignment loan accruals (debt that builds up automatically as linked Inventory items sell) live entirely in `payables` and never touch `dailyLogs` or any pot total on their own — same as how a One-time or Installment loan's balance was already independent of the pots. Only an actual cash movement (e.g. logging a remittance, or a manual "Stock Purchases Out" entry) should ever touch a pot.

## Features

- **Store Health** (default view) — monthly Revenue/Expenses/Profit/Net, a PROFITABLE/NEEDS ATTENTION verdict stamp, and the "Data Tools" panel (Word/text export, full-state JSON export, per-table JSON export, JSON import, Reset, Read-only toggle).
- **Today's Entry** — daily Sales/Purchases/GCash Fee/Household Draw log.
- **GCash** — float tracking, separate from store purchases.
- **Household Budget** — editable categories with `+ Add` / `− Fix` (avoids retyping totals), full audit history behind a separate passkey.
- **Utang / Loans (Payables)** — three loan types under one screen:
  - **One-time** — a lump amount with a due date, marked Paid when settled.
  - **Installment** — a total amount paid off over a daily/weekly/monthly/annual schedule, with partial payments logged against a running balance and a schedule-aware next-due date.
  - **Consignment** — auto-linked to specific Inventory products; the store owes nothing for goods on the shelf, only for units actually sold (debt accrues automatically when a linked item is marked Sold), with an optional per-agreement setting to also charge for spoilage. Remittances are logged manually against the running balance. Tied to the linked supplier's existing visit schedule rather than its own due date.
- **Expansion (Stall)** — fully separate spending log for the family's second business.
- **Inventory** — full product records: category, storage type, counting unit, product code (auto-generated), expiry tracking, stock value, days-of-stock-remaining estimate, and **composite products** (e.g. Rim → Pack → Stick, arbitrary nesting depth, independent pricing per level, per-level sale eligibility). A product can also hold **mixed owned + consignment stock** at once when linked to a Consignment loan — Restock lets you tag a batch as Owned or Consignment, and Sold/Spoiled draws down consignment stock first, automatically.
- **Suppliers** — directory with visit schedules (Fixed Day / Irregular / Canvass Only) and per-item price history with change alerts.
- **Insights** — Revenue/Expenses/Profit line chart, household spending pie chart, expansion cumulative spend chart, daily/category rankings, and an Inventory Health Matrix (ABC value tier × Fast/Slow/Dead movement, with GMROI).
- **Help & Tips** — an in-app, bilingual explainer of the PIN/name flow, the three money pots, and how to use each tool — the reference for tone when writing new user-facing copy.
- **Notification bell** — unified alerts: low stock, expiring soon, price changes, suppliers scheduled today, and a *missed or pending daily entry* reminder (silent if today's already logged; nudges after 6 PM if only today is missing; always flags if a full day or more was skipped). Loan alerts are schedule-aware per type — Installment and Consignment only surface when actually due soon or overdue, rather than showing "unpaid" for the entire life of the loan. Replaces scattered per-tile badges.
- **Access:** a shared family PIN (remembered per device) plus a per-device username system (for attribution on entries, not real security).

### Data safety tools

Beyond the original export/reset tools, the app now includes:

- **Read-only mode** — a one-tap toggle (Store Health screen) that disables all writes to Supabase (and blocks import) without needing to close the app. Useful when someone wants to poke around or demo the app without risking real data.
- **Full-state export with integrity hash** — `Export full app state (JSON)` downloads the entire `state` object and shows its SHA-256 hash, so a backup can be verified later.
- **Per-table export** — export just one table (Daily Entries, Inventory, etc.) as JSON.
- **Import from file** — overwrite the live state from a previously exported JSON file. Always takes an automatic backup export first and requires confirmation; disabled while read-only mode is on.
- **Undo** — destructive actions (deleting a row, a household category, a history entry, or doing a full Reset) push a 30-second-expiring undo entry, surfaced as an undo button, so an accidental tap isn't unrecoverable.
- **Save-conflict warning** — since all data lives in one shared Supabase row, two devices saving at nearly the same time could otherwise silently overwrite each other. Each save now checks whether another device has saved since this device last loaded, and asks for confirmation before overwriting if so. It's a warn-and-let-you-decide safeguard, not automatic merging — genuinely simultaneous edits still need a human to reconcile.

## Data model

Everything lives in one `state` object, saved as JSON to Supabase on every change:

```
state = {
  dailyLogs, gcashLogs, payables, household, householdHistory,
  inventory, stockHistory, expansionLog,
  suppliers, priceAlerts
}
```

When adding a new field to an existing record type, always update the migration function (`ensureInventoryFields()`) to backfill defaults for existing data — never assume a field exists on old records. For a migration that transforms or removes data on existing records (not just backfilling a default), use `runReversibleMigration()` instead so the change is snapshotted and undoable.

Two additions worth knowing about:
- **`payables` records carry a `type`** (`One-time` / `Installment` / `Consignment`), with different fields per type and a shared `history[]` ledger for anything beyond a single-payment loan. See `AI_INSTRUCTIONS.md`'s "Loan Management" section for the exact shape of each.
- **`inventory` records carry a `consignmentStock`** — the portion of that item's current stock that's on consignment (owed, not yet paid for) rather than store-owned. A small `_meta` object (`lastSavedAt`, `lastSavedBy`) also rides inside the top-level `state` blob itself, used only for the save-conflict check above — it's not tied to any one table.

## Versioning policy

Documented format: **`vMAJOR.CLEAN.MINOR`**
- **MAJOR** — new tabs, structural changes, new data models (resets CLEAN and MINOR to 0)
- **CLEAN** — bug fixes, cleanup (resets MINOR to 0)
- **MINOR** — small tweaks, label changes, small field additions

**Note:** the three-part scheme fell out of use for a while (`APP_VERSION` sat at a single incrementing number, `v25.0.0`, for several releases) but has been back in active use since the Loan Management work: `v26.0.0` → `v26.1.0` → `v27.0.0` → `v27.1.0`, each bump matching the MAJOR/CLEAN/MINOR definitions above. Keep following it going forward — new data model or new tab = MAJOR, bug fix = CLEAN, small additive tweak = MINOR.

The current version lives in the `APP_VERSION` constant near the top of the script, and is shown at the bottom of the sidebar.

## Why so simple? (no build step, no framework, no CI)

This is a deliberate choice, not a limitation to "graduate" from later:
- The end users are non-technical family members — every dependency added is a dependency that can break for them.
- There is no dedicated ops capacity — no staging environment, automated tests, or deployment pipeline is warranted for a single-store internal tool.
- A single HTML file is something both developers can fully hold in their head, `git diff` cleanly, and hand to an AI assistant with full context in one paste.

Don't add a build step, a framework, or a testing framework unless a real, hit problem specifically requires it — not because "best practice" says so in general. (The read-only mode, undo stack, and reversible-migration helper described above are the kind of *in-file* safety net this philosophy does welcome — they add no dependencies, no build step, and no external tooling.)

## Before pushing any change

1. Test the change locally (Live Server) before pushing.
2. After pushing, hard-refresh (`Ctrl+Shift+R`) the live GitHub Pages URL — browser caching regularly makes a working fix look broken.
3. Check the browser console (F12 → Console) for errors — most bugs in this project's history have shown up there immediately (see `AI_INSTRUCTIONS.md` for common patterns).
4. For any change touching `state`, confirm existing data isn't silently dropped — test with an account/device that already has real entries, not just a fresh one. If your change deletes or transforms existing records, prefer wrapping it in `runReversibleMigration()` so it's recoverable if something goes wrong.
