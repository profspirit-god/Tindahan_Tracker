# Technical proposal: blank entries from `addDaily()` and the async save

Status: investigation only. No app code was changed. Base: `index.html` v31.0.2 (`addDaily`/`saveState` are identical to `eadbe1c`).

## 1. Evidence (Chromium + stateful mock server, 400 ms save latency)

Script: `repro_addDaily.py`. Raw output: `evidence.txt`. The control (one tap, filled form) logs exactly 1 entry, so the harness is valid.

| Scenario | Entries logged | Notes |
|---|---|---|
| A. One tap, form filled | 1 | Correct. |
| B. Double-tap 80 ms apart | 2 (real + blank ₱0) | Plus 1 false "Someone else updated the data" dialog. |
| C. Triple-tap | 3 (real + 2 blanks) | Plus 2 false conflict dialogs. |
| D. One tap on an empty form | 1 blank ₱0 | No double-tap involved. |
| E. Double-tap, user presses Cancel on the dialog | 2 in the mock server | **Not conclusive.** My mock kept a live reference to `state` and copied it after the delay, so this may be a mock artifact. Needs a test against the real Supabase client. |
| F. Second tap 600 ms later (after save landed) | 2 (real + blank ₱0) | No dialog, blank entry still created. |

## 2. Root causes (two independent problems)

1. **No validation, and the form is rebuilt instantly.** `addDaily()` pushes whatever is in the fields, calls `saveState()` without awaiting it, then `render()` swaps in a fresh empty form. Any further press of Save, at any speed (F), or a first press on an empty form (D), logs a blank ₱0 entry for today.
2. **Overlapping saves flag themselves as conflicts.** `saveState()` sets `lastKnownSavedAt` before its update finishes. A second save started during that window reads the old server timestamp and shows the "Someone else updated" prompt about the user's own write (B, C). Whether a blank entry pushed while the first save is waiting also rides along in that save (because `state` is passed by reference) is **not established**: the real client may serialise the body when the request is sent. Correction added Nov 7 after review.

## 3. Proposed fixes

| | Change | Touches save pipeline? | Fixes |
|---|---|---|---|
| **Fix 1 (recommended)** | In `addDaily()` only: refuse to save when all money fields are empty or zero (inline message, form kept), plus a short re-entry guard. | No | Cause 1: B, C, D, F. Removes the trigger for most of cause 2 on this screen. |
| **Fix 2 (optional, separate)** | Serialize `saveState()` (one save at a time) so a save never compares itself against its own in-flight write. | Yes (S6) | Cause 2 everywhere, not just Daily. |
| Not proposed now | "Confirm only after save succeeds / keep input on failure" (original proposal §7.4). | Yes | Larger redesign, defer. |

Fix 1 is about 8 lines in one function. It needs your decision on one rule (below).

## 4. Decisions needed

1. Is a genuine all-zero day ever logged on purpose (store closed)? If yes, Fix 1 should ask "Log a ₱0 day?" instead of blocking.
2. Approve Fix 1 now? Fix 2 only after a real-phone check of how often the false conflict dialog appears.

## 5. Limits and not yet checked

- Mouse clicks in desktop Chromium, not real touch on a phone. Confirm on a real device.
- `addGcash()` (and likely other add-functions) share the same push, save, render pattern. By code reading only, not reproduced.
- Effect of existing blank ₱0 rows on Insights, averages or day counts was not assessed. Worth checking real data for zero rows dated today.
