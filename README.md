# Tindahan Tracker

A shared, single-file web app for tracking a family sari-sari store's cash flow, inventory, suppliers, and household budget, built to solve one problem: **the family could not tell if the store was profitable or not.**

Built collaboratively with Claude (Anthropic), feature by feature, from real problems the store's owners hit while using it. No build step, no framework, no local dependencies: intentionally simple so non-professional developers can maintain it.

Version: shown at the bottom of the sidebar (the `APP_VERSION` constant in `index.html`). History: [`ChangeLog.md`](ChangeLog.md). Plans: [`Roadmap.md`](Roadmap.md).

> **Working on this repo with an AI assistant?** Start with [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) (head file): all rules, workflow, data shapes, Git steps and versioning live there. This README does not repeat them.

## Who this is for

- **End users:** the store owner (Father), co-owner (Mother), an aunt who works the counter (Tita), and the developer/son. Apart from the developers none are technical, so UI favours large touch targets, few steps, and bilingual (English + Filipino) labels over cleverness.
- **Developers:** currently two, both working with Claude as a coding assistant.

## Tech stack

- **Frontend:** one `index.html`, vanilla HTML/CSS/JS.
- **Charts:** [Chart.js](https://www.chartjs.org/) v4 via CDN (`cdn.jsdelivr.net`).
- **Backend/storage:** [Supabase](https://supabase.com/) (Postgres + REST via `@supabase/supabase-js` v2, CDN). One table, one row, the entire app state as a single `jsonb` blob.
- **Hosting:** GitHub Pages from `main` (the live app). `development` is the development side. Branch flow: AI_INSTRUCTIONS S2.

## Getting started

1. Clone the repo.
2. Open `index.html` through a local server (e.g. VS Code "Live Server"). **Do not open via `file://`**; it causes CORS/security quirks with Supabase.
3. Fresh Supabase instance:

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

   Then set `SUPABASE_URL` and `SUPABASE_KEY` (the anon/publishable key, **never** the service_role key) near the top of `index.html`. Note: that policy lets anyone with the key read and write everything; tightening it is the first item on the [Roadmap](Roadmap.md) (Phase 1).
4. Changes reach the live app through the branch flow in AI_INSTRUCTIONS S2 (branch from `development`, PR to `development`, test, PR to `main`, tag). Test steps: S3.

## Features

Everything is gated by a store PIN plus a personal code, with Owner and Staff roles. Details and rules for each: AI_INSTRUCTIONS S6, S8, S9, S12.

- **Store Health** (home): monthly Revenue/Expenses/Profit/Net with a plain-language verdict.
- **Today's Entry** and **GCash**: daily sales log and a separate GCash float.
- **Household Budget**: editable categories, `+ Add` / `− Fix`, passkey-protected history.
- **Utang / Loans**: One-time, Installment and Consignment loans, with partial payments and schedule-aware due dates.
- **Suki Utang** (receivables): money customers owe the store, display-only (never counted as profit).
- **Expansion (Stall)**: spending log for the family's second business, kept fully separate.
- **Inventory**: categories, storage types, units, expiry, stock value, composite products (Rim → Pack → Stick), mixed owned and consignment stock, bulk CSV export/import.
- **Suppliers**: visit schedules and per-item price history with change alerts.
- **Insights**: profit and spending charts, rankings, Inventory Health Matrix.
- **Notification bell**: one place for all alerts (stock, expiry, loans, prices, suppliers, missed entries, margins, dead stock, uncollected).
- **Settings**: bigger text, dark mode, reduced motion, hints, auto-lock time.
- **Data Tools / safety**: Word and text export, full and per-table JSON export, import, reset, read-only mode, 30-second undo, save-conflict warning, offline write queue, owner-only audit log.
- **Help & Tips**: in-app, bilingual guide.

## The four money pots

Store Cash, GCash Float, Household and Expansion are kept strictly separate; mixing them was why the family could not see their real position. The rules are in AI_INSTRUCTIONS S9.

## Why so simple? (no build step, no framework, no CI)

A deliberate choice, not a limitation to "graduate" from later:

- The end users are non-technical family members: every dependency added can break for them.
- There is no dedicated ops capacity: no staging environment, automated tests or deployment pipeline is warranted for a single-store internal tool.
- A single HTML file is something both developers can fully hold in their head, `git diff` cleanly, and hand to an AI assistant with full context.

Do not add a build step, a framework, or a testing framework unless a real, hit problem specifically requires it. In-file safety nets (read-only mode, undo stack, reversible migrations) are welcome since they add no dependencies or tooling. Scope rules for AI: AI_INSTRUCTIONS S5.
