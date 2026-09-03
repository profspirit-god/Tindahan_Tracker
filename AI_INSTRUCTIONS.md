# AI Assistant Instructions — Tindahan Tracker

Read this before making changes if you're an AI assistant (Claude or otherwise) working on this codebase. It captures conventions and hard-won lessons from this project's actual development history — following them will save both developers real debugging time.

## Project context

This is a single-file (`index.html`) web app for a real family-owned sari-sari store in the Philippines. End users are largely non-technical (a shopkeeper father, a co-owner mother, an aunt who works the counter) — the developer(s) are technical, but every UI decision should still assume the *user* is not. Keep interactions simple, forgiving, and bilingual (English + Filipino) where the app already does this.

**This is not a generic SaaS product.** Do not suggest build tooling, test frameworks, CI/CD, staging environments, or architectural patterns aimed at teams/scale unless explicitly asked. See `README.md`'s "Why so simple?" section — this has already been discussed and deliberately decided against.

## Architecture pattern — read this first

- **One giant `state` object**, mutated directly, then `saveState()` (writes to Supabase) followed by `render()` (rebuilds the visible DOM via `innerHTML`) — in that order, every time.
- **No virtual DOM, no diffing.** Every `render()` call fully rebuilds whatever's on screen from a `view` string (e.g. `view = "inventory"`) via a big if/else dispatcher inside `render()`.
- **Modals are shared, not per-feature.** There are exactly two reusable modal shells: `#chart-modal` (fullscreen chart expand) and `#item-modal-overlay` / `#item-modal-sheet` (bottom-sheet, reused for Add/Edit Item, Restock/Sold/Spoiled quantity entry, Supplier Price updates, and the Notification panel). **Reuse these rather than building new modal markup** for new features that need a popup/sheet.
- **The sidebar (`#sidebar`) is the only navigation.** There is no back button — it was deliberately removed. Every screen is reached via `go(viewName)` from the sidebar or a direct link elsewhere in the UI.
- **History/audit logs follow one pattern:** an array of `{..., by: currentUser, time: new Date().toISOString()}` records, append-only from the user's perspective but user-deletable with a confirm + (for Household History) a separate passkey gate. If you add a new loggable action, follow this exact shape.

## Hard-won bug patterns — check for these before shipping

This project's real debugging history surfaced the same handful of mistakes repeatedly. Check for these specifically before telling a developer to push:

1. **A `<script src="...">` tag with inline code inside it.** The browser silently ignores all inline content when `src` is present — this caused a total app failure early on. Always use two separate `<script>` tags (one for CDN libraries, one for app code).
2. **Case-sensitive method typos** — e.g. `a.Click()` instead of `a.click()`. JS methods are case-sensitive; this exact bug happened.
3. **`removeChild` called on an element never `appendChild`'d.** If you write a download-trigger function, always include `href`, `download`, `appendChild`, `click()`, *then* `removeChild` — missing any one breaks the next.
4. **HTML entity typos** (`%nbsp;` instead of `&nbsp;`) — silently prints literal garbage text instead of failing loudly. Worth a visual double-check in generated documents/exports.
5. **A function called but never defined**, especially after a merge/edit (e.g. `getMonthSummary` and `syncStatus` both went missing this way at different points). If a `ReferenceError: X is not defined` shows up, grep the whole file for `X` first — it usually means a deletion happened somewhere unrelated to the current change, not a typo in the current one.
6. **Mismatched apostrophes in cross-sheet formula references** (this bit an Excel/xlsx deliverable once, not the web app — but the general lesson holds: escape special characters in any generated file, not just HTML).
7. **Dropdowns losing their selected value on re-render.** Because `render()` fully rebuilds the DOM from `state`, any `<select>` whose selection isn't tracked in a JS variable (not just read live from the DOM) will silently reset. Always track dropdown-driven UI state in a `let` variable and reflect it back with `selected` in the rendered HTML — see `rankMetric`/`rankOrder`/`hhRankOrder` for the established pattern.
8. **Search/text inputs losing focus mid-typing.** Same root cause as #7 — every keystroke triggers a full re-render. Fix pattern: after re-render, re-`.focus()` the input and restore cursor position with `setSelectionRange()`. See `setInvSearch()` for the reference implementation.

## Style conventions

- **Colors/fonts:** CSS custom properties at the top of `<style>` (`--cover`, `--brass`, `--teal`, `--bad`, `--good`, etc.) — a "ledger book" aesthetic (navy/cream/brass), intentionally chosen to feel familiar to users coming from a physical notebook. Reuse these tokens; don't introduce new one-off colors.
- **Confirm before destructive actions.** Every delete button, every category removal, every value that could zero out a real number goes through `confirm()` first. This was explicitly requested after an accidental data loss — do not skip it for new destructive actions.
- **Bilingual labels** on user-facing text where the app already does this (English primary, Filipino as a subtitle or alongside) — match the existing tone, don't translate everything, focus on the phrases a non-technical Filipino parent needs to understand at a glance.
- **Money is always formatted via the shared `peso()` helper** — never hand-roll a `₱` string.
- **Never mix the four "money pots"** (Store Cash / GCash Float / Household / Expansion) in a calculation. If a new feature needs to reference money, be explicit about which pot it belongs to and don't let it leak into another pot's totals (e.g. Store Health's Revenue/Expenses must never include Expansion or GCash float movements).

## Process conventions

- **Versioning:** `vMAJOR.CLEAN.MINOR` — see README for the full policy. When delivering a change, always state which digit it bumps and give the exact new version string and commit message together — don't make the developer ask.
- **Give exact paste locations.** This codebase has been built entirely through an AI assistant giving code snippets with precise "find this / replace with this" instructions, not full-file rewrites. Keep doing this — it's faster to verify and less error-prone for a non-full-time developer to apply.
- **Test order for any change:** apply locally → push → hard-refresh the live GitHub Pages URL (browser cache regularly causes false "it's not working" reports) → check browser console for errors → confirm existing real data isn't broken, not just a fresh test account.
- **Don't speculatively add features or defensive code for problems that haven't happened.** This project's entire development pattern has been: real friction/bug reported → fixed. Resist the pull to gold-plate; if you notice something *might* be worth fixing, mention it and let the developer decide, don't just add it.
