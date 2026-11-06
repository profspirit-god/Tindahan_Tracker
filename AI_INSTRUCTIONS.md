# AI Instructions — Tindahan Tracker (HEAD FILE)

> Head file of the project. Every other doc points back here. Written for any AI assistant (Claude or otherwise).
> **Do not read this whole file.** Read S0, then only the sections your task needs (routing table in S0).

## S0 · Start here (index, routing, file map, precedence)

**Section addressing.** Sections are `## S<n> ·` headings; grep `^## S6` to jump. Cross-references use the bare ID ("see S6"). **Each fact lives in exactly one section — never copy it elsewhere, point to it.**

**Task → sections to read** (S1 and S4 apply to every session; S0 is always read)

| Task | Read |
| --- | --- |
| Any session (start / end) | S1, S2, S4 |
| UI, markup, CSS, copy | S10, S6, S7 |
| Money, daily entry, pots, profit | S9, S8, S6 |
| Loans / receivables / consignment | S8, S9 |
| Inventory, CSV, suppliers | S8, S9, S12 |
| Login, PIN, roles, audit, privacy | S11, `Roadmap.md` Phase 1 |
| New feature or idea | S5, `Roadmap.md`, S6 |
| Testing / shipping | S3, S2 |
| Docs-only session | S13, S1, S4 |

**Section index**

| ID | Section | Holds |
| --- | --- | --- |
| S1 | Session protocol | start/during/end checklist, token-saving rules, output rules |
| S2 | Git delivery | branch model, copy-paste command template |
| S3 | Testing | test order, shared-database test rules |
| S4 | Versioning, commits, ChangeLog | version scheme, commit format, ChangeLog format |
| S5 | Project context & scope limits | what the app is, what not to add |
| S6 | Architecture & code patterns | state/render, modals, undo, sync, notifications |
| S7 | Pre-ship bug checklist | 9 recurring bug patterns |
| S8 | Data model & record shapes | state keys, payables/receivables/people/audit shapes |
| S9 | Business rules | money pots, daily-sales math, consignment, receivables |
| S10 | UI & design system | tokens, type, touch, dark mode, accessibility, copy |
| S11 | Security & access | PIN, roles, lock, passkeys, secrets handling |
| S12 | Feature reference | notifications, CSV import, settings/prefs, navigation |
| S13 | Doc maintenance | file ownership, drift rule |

**File map and ownership** (the file named owns that fact; others link to it)

| File | Role | Owns |
| --- | --- | --- |
| `AI_INSTRUCTIONS.md` | Head file, rules for AI and developers | every rule, data shape, workflow, version scheme |
| `index.html` | The app | actual behaviour and the current version (`APP_VERSION`) |
| `README.md` | Human overview for GitHub visitors and new developers | what/why, tech stack, setup, Supabase SQL, feature list, "Why so simple?" rationale |
| `Roadmap.md` | Where the app is going (secure first, then develop) | planned/proposed work and its status |
| `ChangeLog.md` | What changed and when | every change, newest first |

**Precedence when sources disagree:** developer's current explicit request > this file > `README.md` > `Roadmap.md` > `ChangeLog.md`. For facts about behaviour or the current version, `index.html` wins and the doc is corrected (S13).
**Conflict rule:** if two instructions conflict, or a request conflicts with a rule here, **stop, state the conflict in one short message with options, and wait.** Do not silently pick one. Unattended: take the safest reading, say which one at the top of the final message.

---

## S1 · Session protocol

**Start**
1. Read S0 plus the routed sections only. Never read a whole file to find one fact.
2. Reading `index.html` (about 6,400 lines): `grep -n "function <name>"` or `grep -n "<symbol>"`, then read about 40 lines around the hit. Never cat the whole file.
3. Verify, do not trust: current version = `grep -n "APP_VERSION =" index.html`. Last change = newest entry in `ChangeLog.md` (`grep -n "^## " ChangeLog.md | head -3`, read the top entry only). Current focus = "Now" in `Roadmap.md`.
4. Base commit: the developer's branch HEAD must match the base the work was built on (`git log -1 --format=%h`). If an uploaded `.git` is present, read it. If the hash differs from the developer's, **stop and rebuild** rather than overwrite anyone's work (S2).
5. Say in one sentence what you are about to do. Ask only what is needed, all questions in one message.

**During**
- Edit in place with targeted replacements; never regenerate a whole file. Afterwards confirm only the intended lines changed (`git diff --stat` / `git diff`).
- **Scope lock:** if the developer says "don't change code", touch only non-code files and do not bump the version.
- Do not speculate (S5). Ideas go to the end-of-session "Suggestions" list and to `Roadmap.md` as *Proposed*, never into code unasked.
- Money, data-shape or security-adjacent change: read S9 / S8 / S11 first.
- Roadmap order is binding unless the developer overrides: bug fixes and Phase 1 (security) come before Phase 3 features.

**End (every session, in this order)**
1. **Verify.** Code changes: run the S7 checklist; if a shell is available, extract the inline `<script>` blocks and run `node --check`, and load the page in a headless browser to confirm no console errors; if you cannot run these, say so. Docs changes: every `S<n>` reference resolves, no fact duplicated across files, no secrets (S11).
2. **ChangeLog.md:** add the entry (format in S4). Every change is recorded, docs included.
3. **Roadmap.md:** move/tick finished items, add new ideas as *Proposed*.
4. **Doc drift check** for the areas touched (S13).
5. **Package** only the changed and new files into one zip (rules below).
6. **Final message**, in this order and nothing more: (a) what changed in at most 3 lines; (b) version: digit bumped and why, the new string, or "no bump (docs-only)"; (c) "touches data shape: yes/no" (S3); (d) conflicts or open questions; (e) suggestions; (f) the git commands from S2, filled in and ready to paste. Do not recap the steps taken.

**Output rules**
- Deliver **only the changed/new files**, zipped. Never re-send unchanged files, never rebuild the whole repo.
- Zip layout: paths relative to the repo root, **no wrapping folder**, so extracting at the repo root overwrites exactly the listed files. Name: `<BRANCH>.zip`.
- Say which files the zip holds and which files to delete (deletions go in the git commands as `git rm`).
- Snippets with "find this / replace with this" locations only if the developer asks for them.
- Never print or store secret values (S11).

---

## S2 · Git delivery

**Branch model.** `main` = the **live app**. `development` = the development side. **Every working branch is created from `development` and merged back into `development` by PR; only `development` is merged into `main` by PR.** Never commit directly to `main` or `development`.
Branch names (from history): `Dev1-<Feature>`, `dev2-<feature>`, `Dev1-Hotfix-<Name>`. Hotfixes follow the same path.
Repo: `https://github.com/profspirit-god/tindahan_Tracker`.

**Rules for the command block**
- Send it at the **end of every session**, as three copy-paste blocks separated by plain-text instructions for the developer. Fill every placeholder; leave nothing to type except the zip download.
- Default shell: **PowerShell** (VS Code terminal). If the prompt does not start with `PS`, swap step 4 for the Git Bash / macOS / Linux or CMD line in the alternatives below.
- Stage explicit file names, never `git add .` or `git add -A`.
- Commit message format is S4. Do not add attribution lines to commands the developer runs.
- If `git status` shows uncommitted work, the developer stops before extracting.

**Block 1 — branch, extract, commit, push**

```powershell
git status
git checkout development
git pull origin development
git log -1 --format=%h
git checkout -b <BRANCH>
Expand-Archive -Path "$env:USERPROFILE\Downloads\<BRANCH>.zip" -DestinationPath . -Force
git status
git add <FILE_1> <FILE_2>
git rm <DELETED_FILE>
git commit -m "<type(scope): summary (vX.Y.Z)>"
git push -u origin <BRANCH>
```

Notes the AI adds under the block: the base hash `git log -1 --format=%h` must print (`<BASE_HASH>`); omit the `git rm` line when nothing is deleted. Alternatives for step 4: Git Bash/macOS/Linux `unzip -o ~/Downloads/<BRANCH>.zip`; CMD `tar -xf "%USERPROFILE%\Downloads\<BRANCH>.zip"`.

**Between blocks — plain text for the developer** (adapt wording, keep the order):
1. Open the PR `<BRANCH>` into `development`: `https://github.com/profspirit-god/tindahan_Tracker/compare/development...<BRANCH>?expand=1` and merge it.
2. Run block 2 and test on `development` following S3.
3. If it passes, open a PR `development` into `main` and merge it.
4. Verify the live site as in S3 step 3. Then run block 3.

**Block 2 — test on development**

```powershell
git checkout development
git pull origin development
```
then open `index.html` with VS Code Live Server (never `file://`).

**Block 3 — tag (only after the merge into `main`)**

```powershell
git checkout main
git pull origin main
git tag -a <vX.Y.Z> -m "<vX.Y.Z> - <summary>"
git push origin <vX.Y.Z>
git checkout development
git pull origin development
git branch -d <BRANCH>
```

Docs-only session: replace block 3 with "No tag — docs-only, version unchanged (S4)".

---

## S3 · Testing

**Order for any change**
1. On the working branch: apply, run locally with Live Server, console clean.
2. Merge into `development`, pull it, **test on `development`** (shared-database rules below).
3. Merge `development` into `main`, hard-refresh the live GitHub Pages URL (`Ctrl+Shift+R`; browser cache causes false "it's not working" reports), check the browser console (F12), and confirm **existing real data** still works — use a device with real entries, not a fresh one.
4. Tag (S2).

**Shared-database rules.** Development and live use the same Supabase row (`app_state`, `id=1`), so a test run touches live data. Two copies of the app cannot corrupt the row (each save is one atomic update), but the **last save wins and replaces the whole `state`**, so recent entries can be lost, or a buggy build can save bad data. Therefore:
1. **Backup first:** Data Tools → full JSON export. Note the time.
2. **Dummy data only:** prefix test items, loans, suki and entries with `TEST-`. Never test on real inventory items or real loans (stock changes, consignment accruals and history rows look real).
3. **Quiet time:** test when nobody is entering real data.
4. **Conflict dialog on a test device:** choose the option that does **not** overwrite, then reload. Never "Save anyway" over a real entry.
5. **Look-only checks** (layout, views): turn on Read-only mode (Data Tools) so nothing is written.
6. **Afterwards:** delete the `TEST-` rows through the app, close the test tab (a stale open tab can save old data later), and know that history rows (stock/household/audit) from tests may remain; passkey-protected history rows can be deleted by the developer.
7. **Restore from the backup only if no real entry was made since the backup** (a restore overwrites everything). Otherwise fix by hand.
8. **Data-shape changes** (new field, migration, `runReversibleMigration`) must be additive and backward-compatible until they reach `main`, because a development build saves its shape to the live row while the live build still reads it. The AI states "touches data shape: yes/no" every session (S1). Unknown top-level keys survive an older build (S6 Sync).

A separate development database is proposed in `Roadmap.md` (Phase 1); until it exists these rules apply.

---

## S4 · Versioning, commits, ChangeLog

**Version = `vMAJOR.CLEAN.MINOR`**
- **MAJOR:** new tabs, structural changes, new data models (resets CLEAN and MINOR to 0).
- **CLEAN:** bug fixes, cleanup (resets MINOR to 0).
- **MINOR:** small tweaks, label changes, small field additions.

The scheme was a single integer through `v25.0.0` and has been in use since `v26.0.0`.
- **Source of truth:** the `APP_VERSION` constant in `index.html` (also shown at the bottom of the sidebar), bumped by hand. Docs never hardcode "the current version"; they point here. Always verify it with grep before citing it.
- When delivering code, always state which digit you bump and why, plus the exact new string and commit message together, without being asked.
- **Docs-only or non-code changes: no version bump and no tag.** They are logged in `ChangeLog.md` as `Docs`.

**Commit message:** `<type>(<scope>): <summary> (vX.Y.Z)`; types `feat`, `fix`, `docs`, `refactor`, `chore`. Docs-only: `docs: <summary>` with no version. Examples from history: `feat(accounts): people, roles, personal codes (v30.0.0)`, `fix(csv): tolerate Excel phantom rows (v28.8.0)`.
**Tag:** annotated `vX.Y.Z` on `main` after the merge (S2).

**ChangeLog.md format** — newest first, one entry per session or merge, at most about 8 lines:

```
## vX.Y.Z — YYYY-MM-DD — <branch>   (or: ## Docs — YYYY-MM-DD — <branch>)
- <what changed and why, one line each>
- Files: <list>
- Data shape touched: yes/no · Roadmap item: <ID or none>
```

`ChangeLog.md` ships in the zip whenever anything changes.

---

## S5 · Project context & scope limits

- A single-file (`index.html`) web app for a real family-owned sari-sari store in the Philippines. End users are largely non-technical (shopkeeper father, co-owner mother, an aunt at the counter). Developers are technical, but every UI decision assumes the **user** is not: simple, forgiving, bilingual (English + Filipino) where the app already is.
- **Not a generic SaaS product.** Do not suggest build tooling, test frameworks, CI/CD, staging environments, or team/scale architecture unless explicitly asked. Rationale: `README.md` "Why so simple?" (already discussed and decided). Exception already agreed: in-file safety nets (read-only mode, undo stack, `runReversibleMigration()`) and the `development` branch workflow (S2); a separate development database is a Roadmap proposal.
- **Do not speculate.** Development pattern here: real friction or bug reported, then fixed. Do not gold-plate or add defensive code for problems that have not happened. If something might be worth fixing, mention it (Suggestions) and let the developer decide. This is about not adding more beyond what exists, not about removing what shipped.
- Scheduled `Roadmap.md` items are not permission to build; each needs the developer's go-ahead.

---

## S6 · Architecture & code patterns

- **One `state` object**, mutated directly, then `saveState()` (writes to Supabase), then `render()` (rebuilds the visible DOM via `innerHTML`), **in that order, every time.**
- **No virtual DOM.** `render()` rebuilds from the `view` string via an if/else dispatcher. Views: `home` (Store Health, default), `daily`, `gcash`, `payables`, `receivables`, `household`, `householdHistory`, `inventory`, `stockHistory`, `suppliers`, `expansion`, `summary`, `insights`, `help`, `settings`, `datatools`, `people`, `audit`.
- **Two shared modal shells only:** `#chart-modal` (fullscreen chart) and `#item-modal-overlay` / `#item-modal-sheet` (bottom sheet: Add/Edit Item, Restock/Sold/Spoiled quantity entry, Supplier Price updates, Notification panel, loan payment). **Reuse them** for any new popup. `#info-pop` must exist in the static HTML (used by `showInfo()`).
- **Navigation:** the sidebar (`#sidebar`) is the only navigation; there is no back button (deliberately removed). Reach screens with `go(viewName)`. Sidebar sections are `NAV_GROUPS` (S12).
- **History/audit logs share one shape:** append-only arrays of `{..., by: currentUser, time: new Date().toISOString()}`, user-deletable with confirm plus, for Household History and Stock History, a passkey gate via `goHistoryProtected()` / `goStockHistoryProtected()`. New loggable actions follow this shape.
- **Read-only mode:** `isReadOnly` (`toggleReadOnly()`, in Data Tools) makes `saveState()` a no-op and blocks `importAllDataFromFile()`. Functions that call `saveState()` need no own check; any function that bypasses `saveState()` (there should be none) must check `isReadOnly` itself.
- **Destructive actions are undoable, not just confirmed.** 30-second undo stack (`undoStack`, `pushUndo()`, `undoLast()`) covers row deletes, household-category deletes, history-entry deletes, full resets. **A new delete/reset calls `pushUndo()` with the right `type` before mutating state, and also goes through `confirm()`.** Confirm-only is not enough (added after accidental data loss).
- **Migrations touching existing records** go through `runReversibleMigration(name, forwardFn, backwardFn)` (snapshot, apply, save, register undo, auto-rollback if forward throws). Backfilling a default for a new field goes in `ensureInventoryFields()` (never assume a field exists on old records).
- **Payables:** every entry has a `type`; never read `.amt`/`.status` directly for what is owed; use `getPayableBalance(p)`, and `getInstallmentNextDue(p)` / `getConsignmentNextDue(p)` for due dates (only One-time has `.due`). Shapes: S8.
- **Consignment inventory:** `item.consignmentStock` is a subset of `item.stock`, never a separate total. `getConsignmentPayableForItem(item.code)` finds the linked agreement. Depletion order and why: S9.
- **Sync:**
  - `state._meta = {lastSavedAt, lastSavedBy}` rides inside the same jsonb blob. `saveState()` compares the server's `_meta.lastSavedAt` with this device's `lastKnownSavedAt` and warns via `confirm()` before overwriting. This is optimistic concurrency, not merging; "Save Anyway" still overwrites. The millisecond-scale race between check and write is an accepted gap; do not fix it with a sync rework unless it has caused a real problem.
  - **Offline queue:** offline (or `isOfflineMode`) saves go to localStorage `OFFLINE_QUEUE_KEY`; `processOfflineQueue()` runs a conflict check (`confirm`) and pushes; `loadState()` reads the queue when offline.
  - `loadState()` merges server data over defaults with `Object.assign`.
- **The notification bell (`getNotifications()`) is the only place for new alert types.** No standalone banners for alert-shaped things. Follow the `{type, text}` shape, push into `notifs`, add the icon to `NOTIF_ICONS`. Current types: S12.
- **Dropdown/search state** is tracked in `let` variables, not read from the DOM (S7 #7, #8).
- **Downloads** use `downloadFile()` (reference implementation); reuse it as `exportAllData()` and `exportRows()` do.

---

## S7 · Pre-ship bug checklist

Real mistakes that recurred; check each before telling a developer to push.
1. **`<script src="...">` with inline code inside.** The browser ignores inline content when `src` is present (caused a total app failure). Always two separate `<script>` tags: CDN libraries, then app code.
2. **Case-sensitive method typos** (`a.Click()` instead of `a.click()`).
3. **`removeChild` on an element never `appendChild`'d.** Download triggers need `href`, `download`, `appendChild`, `click()`, then `removeChild`. Reuse `downloadFile()`.
4. **HTML entity typos** (`%nbsp;` for `&nbsp;`) print garbage silently. Visually double-check generated documents/exports.
5. **A function called but never defined**, especially after a merge/edit (`getMonthSummary` and `syncStatus` once went missing). On `ReferenceError: X is not defined`, grep the whole file for `X` first; usually a deletion elsewhere, not a typo in the current change. Merge pastes have also corrupted code (v28.5.1): after any merge, re-run this checklist.
6. **Special characters in generated files** (once an Excel cross-sheet apostrophe bug): escape them in any generated file, not only HTML.
7. **Dropdowns losing their value on re-render.** `render()` rebuilds from `state`, so a `<select>` not tracked in a `let` variable resets. Track it and reflect with `selected`. Reference: `rankMetric`/`rankOrder`/`hhRankOrder` (Insights), `invCategoryFilter`/`invStorageFilter`/`invPageSize`/`invLowStockOnly`/`invSort`/`stockHistPageSize` (Inventory, Stock History).
8. **Search inputs losing focus mid-typing** (same root cause). Debounce the re-render (~250 ms), then re-`.focus()` and restore the cursor with `setSelectionRange()`. Reference: `setInvSearch()`.
9. **All quantity/amount entry goes through the bottom-sheet modal:** `restockItem()`/`sellItem()`/`spoilItem()` use `openQtyModal()`/`submitQtyModal()` (simple and composite items); Household `+ Add` / `− Fix` use `openHouseholdAdjustModal()`. Native `prompt()` must not be used for numeric entry; a `prompt()` for a number is legacy, route it through the sheet. Known remaining `prompt()`: the two History-passkey asks (S11, Roadmap R-1.4).
10. **Initialisation order:** an early call to a function that uses a not-yet-declared `let`/`const` crashes (TDZ; `applyPrefs()` caused v29.0.1). Keep boot calls after the declarations they use.

---

## S8 · Data model & record shapes

**`state` keys:** `dailyLogs, gcashLogs, payables, receivables, people, auditLog, household, inventory, householdHistory, stockHistory, expansionLog, suppliers, priceAlerts`, plus `_meta` (S6 Sync). Saved as one jsonb blob to Supabase on every change. Defaults: `DEFAULT_HOUSEHOLD`.

**Payables (`state.payables[]`)** — `type` is `"One-time"` (default for old entries via `ensureInventoryFields()`), `"Installment"` or `"Consignment"`.

| | One-time | Installment | Consignment |
| --- | --- | --- | --- |
| Fields | `amt`, `due`, `status` (`Unpaid`/`Paid`), `history[]` | `totalAmt`, `frequency` (`daily`/`weekly`/`monthly`/`annual`), `startDate`, `periods` (optional), `history[]` | `linkedItemIds[]` (Inventory `.code`), `chargeForSpoilage` (bool), `history[]` |
| Balance | `getPayableBalance(p)`: `status==="Paid" ? 0 : max(0, amt − getInstallmentPaid(p))` | `totalAmt − getInstallmentPaid(p)` | `getConsignmentBalance(p)` (accruals − remittances) |
| `history[]` | `{date, amount, by, kind:'payment'}`; auto `status:"Paid"` at balance 0 | `{date, amount, by, kind:'remittance'}`, manual | `{date, amount, by, kind}`: `'sale-accrual'` / `'spoilage-accrual'` (auto from `applyStockDelta()`) or `'remittance'` (manual) |
| Next due | `p.due` | `getInstallmentNextDue(p)`: calendar math from `startDate + frequency`, independent of payments | `getConsignmentNextDue(p)`: linked supplier (`state.suppliers.find(s=>s.name===p.name)`), only for `scheduleType==="Fixed Day"`; `null` for Irregular/Canvass Only (always-on notification instead) |
| Logging payment | `openLoanPaymentModal(idx)` then `submitLoanPayment(idx)`; `markPaid(idx)` settles in full | same shared modal | same modal, labelled "Log Remittance" |

Known limitations (ask before building): an existing loan's fields cannot be edited (delete and recreate); if two Consignment payables link the same Inventory item, `getConsignmentPayableForItem()` returns the first match.

**Receivables (`state.receivables[]`, v28.7.0)** — money suki owe the store; mirror of One-time payables with partial payments. `getReceivableBalance(r)`, `getReceivablesTotal()`. Rules: S9.

**People (`state.people[]`, v30.0.0)** — `{name, role: "Owner"|"Staff", codeHash (SHA-256), active}`; seeded from `registeredUsers` as Owner; new names default to Staff. Behaviour: S11.

**Audit (`state.auditLog[]`, v30.0.0)** — `{time, by, action, target, old, new}`, capped at 400 (oldest dropped), written at every mutation chokepoint (`ACTION_MAP` labels actions). Stock and household changes are not double-logged (they live in `stockHistory` / `householdHistory`). Owner-only view `renderAudit()` with person/action filters and CSV export.

**Inventory:** each item has `consignmentStock` (S6); composite products nest arbitrary depth (Rim → Pack → Stick) with independent pricing and per-level sale eligibility.

**Device-local storage (not in `state`):** `tindahanPrefs` (S12), `navOpenGroups`, `storeUsername`, `pinFails`/`pinLockUntil`/`pinLockStage` (S11), `OFFLINE_QUEUE_KEY` (S6), `sessionStorage.personOk` (S11).

---

## S9 · Business rules

- **Four money pots, never mixed in a calculation:** Store Cash (buying/selling stock; Today's Entry) · GCash Float (customer cash-in/out service only, never supplier payments; GCash) · Household (family living costs drawn from the store; Household Budget) · Expansion (a **separate business**, the ihaw-ihaw stall; never a store expense; Expansion screen). A new feature that touches money must name its pot. If unsure which pot a transaction belongs to, **ask before writing it to `dailyLogs`.** Store Health Revenue/Expenses never include Expansion or GCash float movements; `getMonthSummary()` is the reference implementation of correct isolation.
- **Loan accruals are not pot money.** Consignment accruals (debt that builds as linked items sell) live entirely in `payables` and never touch `dailyLogs` or a pot total. Only an actual cash movement (a remittance, a manual "Stock Purchases Out") touches a pot.
- **Daily sales reconstruction is pot-aware (v28.4.0).** Expenses are paid in a fixed order: yesterday's reserve, then today's pile, then GCash. `addDaily()` computes `salesIn = enteredEndingCash + expFromTodayCash + movedDraw`. `enteredEndingCash` is the **literal count** of today's cash pile at closing (subtracting expenses on paper double-counted them when the reserve ran out). `expFromTodayCash` is the part of the day's expenses paid from today's pile (0 on most days); reserve- and GCash-paid expenses never touched the count and must **not** be added back. `purchOut` is the day's TOTAL expenses across all pots and is what profit subtracts. Entries store `salesIn` at entry time; pre-v28.4.0 history is never recomputed. Do not "fix" old rows without asking.
- **Consignment depletion order is a business rule, not an implementation detail:** Sold/Spoiled depletes consignment stock **before** owned stock (`applyStockDelta()`). Changing it changes how much money the store owes; check with the developer first.
- **Receivables are not pot money.** Never let them enter Revenue/profit; they appear only as display-only reference lines (Store Health, Summary, Word export). They survive `resetData()` by design. Notification `Uncollected` fires only when a promised date is ≤3 days away or overdue.
- **Money formatting:** always the shared `peso()` helper, never a hand-rolled `₱` string for a dynamic value (static labels like `Amount (₱)` are fine).
- **Reset (`resetData()`, owner-only, undoable, audited)** clears `dailyLogs`, `gcashLogs`, `payables` and zeroes household `actual`. Everything else (inventory, suppliers, receivables, people, histories, expansion) survives by design. A new state key defaults to surviving; decide and state it explicitly if it should not.

---

## S10 · UI & design system (v31)

Black on white, one typeface, no decoration. The old navy/cream/brass look and the purple accent are gone.
- **No emoji, ever** (labels, buttons, headings, toasts, `confirm()` text, help copy, exports). Icons via `uiIcon("name")` (inline SVG; add one by adding path data to `ICON_PATHS`, defined next to `APP_VERSION`). Icon-only controls (menu, bell, undo, delete/close/confirm) are drawn by CSS masks (`--i-menu`, `--i-x`, `--i-check`, `--i-chevron`, `.del`, `.del.ok`, `.modal-x`, `.chevron`); their markup stays empty and **must carry an `aria-label`**. Never reintroduce glyph characters (✕ ✓ ☰ ▶ ▲ ▼) as icons.
- **Colour = tokens only:** `--page`, `--card`, `--ink`, `--ink-soft`, `--page-line`, `--field-line`, `--accent-soft`, `--good`, `--bad`, `--bad-solid`, `--input-bg`. `--brass` and `--teal` are kept on purpose and now mean "black ink / primary action" (they flip to light in dark mode). No hardcoded hex in markup or JS except via `chartColors()`. The only two colours in the app are the money pair: green = money in, red = money out/alert.
- **Status is never colour alone:** money figures use `.amt.pos` / `.amt.neg` (drawn triangle plus colour); verdicts are words (`verdictHtml()`, e.g. "Short by ₱X", not a stamp or badge).
- **Type:** Work Sans only (400/500/600/700), tabular numerals on, sentence case, no ALL-CAPS tracked labels; section titles small and quiet, figures carry the weight.
- **Surfaces:** flat; hairline borders (`--page-line`), no shadows, gradients, rotation or decoration. Radius by role: controls 8px, cards 10px, sheets 16px, pills fully round.
- **Touch:** every tappable control at least 44×44px (`min-height:44px`; enlarge hit area with `::after`, not the visual). Fields use `--field-line` (3:1 contrast) and 16px text.
- **Dark mode** = `body.dark-mode` overriding CSS custom properties. New UI must use vars, never hex. Solid-fill buttons/pills with inline `background:var(--teal|brass|ink)` are corrected by `body.dark-mode [style*="background:var(--…)"]` rules, so **keep inline fills in the exact spelling `background:var(--…)`** (no space after the colon). Sidebar and lock screens have explicit light-text overrides in the dark block.
- **Accessibility:** layout heights use `min-height:100dvh` with a `100vh` fallback line directly above; the viewport meta must **never** regain `maximum-scale=1.0` (pinch-zoom is required for older users).
- **Confirm before destructive actions** and register an undo (S6).
- **Copy:** bilingual where the app already is (English primary, Filipino as subtitle or alongside); do not translate everything, focus on phrases a non-technical Filipino parent needs at a glance. `renderHelp()` is the reference for tone. Avoid "WORD — fragment" labels and decorative punctuation. Long input explanations are `hint-opt` paragraphs (hidden unless `body.show-hints`) plus tap-to-reveal "i" icons via `showInfo(text)`.

---

## S11 · Security & access

Current model is **deterrent-grade** (accepted until Supabase Auth lands). Securing the app is `Roadmap.md` Phase 1.
- **Store PIN** (`STORE_PIN`) gates the app; **History passkey** (`HISTORY_PASSKEY`) gates Household/Stock History. Both are constants in the client source; they are not real security.
- **PIN rate limit:** 3 failures, 60 s cooldown, doubling per repeat lockout (cap 30 min); persisted in `pinFails`/`pinLockUntil`/`pinLockStage`.
- **Auto-lock:** after 15 minutes of no tap/click/keypress/scroll the app returns to the PIN screen (`INACTIVITY_LOCK_MS`, `lockAppForInactivity()`, `resetInactivityTimer()`), because shared family phones are left unlocked in the store. Settings can override per device (`lockMins`). Do not remove or lengthen the lock without asking. An open sheet's unsaved input is lost on lock by design.
- **Accounts and roles (v30.0.0):** personal 4-digit codes verified per tab (`sessionStorage.personOk`) and at render time (`ensurePersonCode()`); codes stored only as SHA-256 hashes. `canView(v)` gates the sidebar. `requireOwner()` guards: reset, import, read-only toggle, item add/edit, supplier prices, payables mutations, household mutations, history passkeys, and deletes of payables/receivables/inventory/suppliers. New sensitive functions call `requireOwner()`.
- **Username** (`storeUsername`, per device) attributes entries.
- **Secrets handling for AI and docs:** never print, log, commit or write into any doc, ChangeLog entry, commit message or zip the values of `STORE_PIN`, `HISTORY_PASSKEY`, or any key. Refer to them by constant name. Never use a `service_role` key; only the anon/publishable key belongs in `index.html`.
- **While Roadmap Phase 1 is open, new work must not widen exposure:** no new hardcoded secrets, no new client-trusted permission checks presented as security, no new unescaped insertion of user text into `innerHTML` (use `escapeHtml()`).

---

## S12 · Feature reference

- **Notifications (S6 rule):** types `Low Stock`, `Expiring Soon`, `Unpaid Loan` (type-aware: Installment/Consignment only when due soon or overdue), `Dead Stock` (stock > 0, no sales 45+ days), `Price Alert`, `Supplier Today`, `No Entry` (missed/pending daily log via `getLastDailyLogDate()`; silent if today is logged, nudges after 6 PM if only today is missing, always flags if a full day was skipped), `Uncollected` (S9), `Low Margin` (margin < 10%). Groups collapsible with type icons.
- **Settings & prefs (v29.0.0):** device-local `tindahanPrefs` = `{bigText, dark, noMotion, showHints, lockMins}`, applied by `applyPrefs()` at boot and on each `setPref()`; legacy `storeBigText`/`storeNoMotion` keys migrate on first read. Comfort classes `body.big-text`, `body.no-motion` (also honours `prefers-reduced-motion`); `toggleBigText()`/`toggleMotion()` exist.
- **Navigation (v29.0.0):** `NAV_GROUPS` collapsible sections (open/closed in `navOpenGroups`): Inventory & Supply (inventory, suppliers), Credit Book (payables, receivables), Family & Growth (household, expansion), Reports (insights, summary); badges via `groupBadge()`; user panel sheet `renderUserPanel()`; Data Tools is its own view (`renderDataTools()`, view `datatools`: Word/text export, full-state JSON export with SHA-256 integrity hash, per-table JSON export, JSON import with automatic pre-import backup, Reset, Read-only toggle).
- **Bulk inventory CSV (v28.7.2, hardened v28.8.0):** `exportInventoryCsv()` emits the canonical template `INV_CSV_COLS` = code, name, category, storageType, unit, cost, price, stock, reorder, supplier, expiryDate; `startCsvImport()` round-trips it. Semantics: header-name matching (column order irrelevant), blank = keep, `CLEAR` = empty/zero, stock = absolute with consignment clamp, composites accept base-level fields only. Matching order: code, normalized name, fuzzy (Levenshtein ≤2, ≤1 for names under 6 chars); fuzzy **always asks** via the review sheet; duplicate clusters inside the CSV (e.g. chesterfield/Chesterfield) become conflicts: Keep last / Keep first / Create both. Tolerates Excel phantom rows, locale delimiters, header not on row 1. Nothing saves until Confirm; one `pushUndo` snapshot covers the import. Inventory list default sort is Name A–Z (`invSort`, 8 sorts).
- **Insights:** Revenue/Expenses/Profit line chart, household pie, expansion cumulative chart, rankings, Inventory Health Matrix (ABC × Fast/Slow/Dead, GMROI, `ACTION_MAP` suggestions).
- **Suppliers:** schedules (Fixed Day / Irregular / Canvass Only), per-item price history with change alerts.

---

## S13 · Doc maintenance

- **`index.html` is the source of truth** for behaviour and version. If this file or any doc mismatches the code, fix the doc; never trust a doc blindly.
- This codebase has drifted ahead of its docs three times (loans before v26, then v27.1, then v28.7 through v31). Re-check the docs against the code **every few features** and at the end of any session that touched a documented area, not only when someone notices.
- **No duplication:** before adding a fact, find its owner in the S0 file map and put it there; elsewhere write a pointer ("see S9"). If you find the same fact in two places, keep the owner's copy and replace the other with a pointer.
- Adding a section: next free `S<n>`, add it to the S0 index and routing table, keep IDs stable (other docs reference them).
- `README.md` is for humans: keep it short and stable; it must never restate rules from this file.
