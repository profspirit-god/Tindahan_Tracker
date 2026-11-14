# Phase 2 proposal: durable local save and coordinated sync

Date: 2026-11-11. Status: proposal only, no code. Builds on v31.0.5.
Facts used: one row `app_state` (id integer, data jsonb), about 31 KB, RLS policy `public read/write` (everyone, all commands), no triggers, no revision column, about 60 `saveState()` call sites, no record IDs, delete/undo by array index.

## 1. Goals and what stays the same

No lost entries, no duplicate server records on retry, no silent overwrite, entry saved the moment the owner taps Save. Unchanged: calculations, permissions, PIN and person codes, the single-row backend, no new tables, no migration unless approved in D2. Everything below ships behind a **per-device switch, default off**, so the family's phones keep running today's (R1-protected) behavior until Phase 5 acceptance. Turning the switch off is the rollback.

## 2. Compare-and-swap (answers to your six questions)

| Question | Answer |
|---|---|
| How does the conditional update work? | The shared JSON carries `_meta.revision` (whole number, +1 per write). A write says: replace `data` **only where** `id = 1` **and** `data->_meta->>revision` equals the revision I last read. One atomic SQL statement, so two writers cannot both win. Draft call: `.update({data}).eq('id',1).eq('data->_meta->>revision', String(expected)).select('id')`. |
| How is a failed comparison detected? | The statement matches 0 rows and returns **no error**. With `.select('id')` the app sees an empty list, which means "someone else wrote first". |
| How are concurrent updates retried? | Re-read the row, re-apply my operation to the fresh copy (see section 4), try again with the new revision. Bounded: 5 tries with growing, randomised waits, then the operation stays pending. Nothing is dropped. |
| How does the app know the server accepted it? | The conditional update returns the updated row (1 row, revision = mine). After a timeout or lost response the app re-reads: the record's `id` is present, or the revision moved past mine and contains it, so the operation counts as done and is not sent again. |
| Current row has no revision | First write uses `is null` instead of `eq`, then sets revision 1. Needs checking on a real database, which `cas_test.html` does. |
| Can older app versions bypass it? | **Yes.** The policy allows any unconditional write, and old code replaces `_meta` without a revision. Client-side CAS cannot stop that. New clients can *detect* it (revision missing or lower than expected) and raise a warning instead of continuing silently. Real protection needs a database trigger, see D2. |

**Optional trigger (needs your approval, additive, reversible with `drop trigger`).** A `BEFORE UPDATE` trigger on `app_state` that rejects any write whose `_meta.revision` is not exactly old revision + 1 (SQL editor and service role exempt). It makes revisions strictly sequential even if a client skips the filter, and makes old clients fail loudly instead of overwriting. Old clients from v31.0.3 on keep the data pending (R1 fix) and show the offline banner; versions before that could still lose data, so every device must be on v31.0.3 or later first. I will write and test the SQL on your test project before you decide.

## 3. Identity and legacy records (your requirement 3)

New records get `id` (UUID), `createdAt` (device time, kept when synced later). The list a record sits in is its category. **Sync status lives only on the device** (local store), never in the shared row, so it cannot cause conflicts or grow the shared data.

Legacy records stay untouched, no backfill. They are identified by **fingerprint**: list name plus a hash of the record's contents. Rules:
- Rows with the same fingerprint are interchangeable, so deleting "one of N identical rows" is safe.
- A legacy delete or undo is sent as an operation carrying the fingerprint and the **count of identical rows when the user acted**. It applies only if the server count still matches. A retry after success sees one fewer, so it is skipped (no second row deleted). A mismatch is never guessed: it becomes an Issue.
- Index numbers stop leaving the device. `delItem(list, index)` stays for forms not yet migrated. A new `delRecord(list, ref)` (by id, else fingerprint) is used by Daily first.

## 4. One coordinated writer (your requirement 2)

All writes to `app_state` go through one serialized engine, one operation at a time, each as read, apply, CAS write.

| Operation | Used for | On revision conflict |
|---|---|---|
| `add` (new record with id) | Daily first, other forms later | Skipped if id already present, never duplicates. |
| `delete` (by id, or fingerprint plus count) | Daily first | Already gone is fine, count mismatch becomes an Issue. |
| `replaceKey` (whole list, with a hash of what I last saw) | **Every form not yet migrated.** `saveState()` keeps its signature and turns into this. | List changed elsewhere: existing "Someone else updated" choice, now per list instead of whole blob, then an Issue if unresolved. |

So the ~60 legacy call sites keep working but can no longer overwrite another device's change silently, and they cannot race the new Daily path because they share the one queue.

## 5. Durable local storage (your requirement 1)

IndexedDB, one **transaction** over two stores, so both succeed or neither does:
- `records`: new-format records by id.
- `outbox`: operations (`opId`, category, type, immutable copy of the payload, status, attempts, next retry time, last error).
- `meta`: last known revision and the last server snapshot (lets the app start offline).

Save flow: validate and confirm (Phase 1), commit record plus operation in one transaction, only then say "saved on this device", reset the form. If the transaction fails: form is kept, red toast, nothing claimed. Memory (`state`) is rebuilt as *server snapshot plus pending operations applied on top*, so refreshes, polling and restarts can never drop a pending entry. The R1 localStorage copy remains as the fallback if IndexedDB is unavailable (private mode, blocked), with a warning toast, and any existing R1 queue is converted into operations on first run before it is removed.

## 6. Sync behavior

Statuses (local): saved on device, waiting to sync, syncing, synced, needs attention. Triggers: Save, `online` event, app returning to the foreground, the 20 s refresh, Sync Now. Retry waits about 2 s, 5 s, 15 s, 60 s, then every 5 min with jitter, **never discarded**; "needs attention" after 8 failures. Toasts follow the wording from Phase 1.

## 7. Conflict types that can actually occur (input for Phase 4)

| Type | Example | Handling |
|---|---|---|
| Revision miss | Two phones save together | Silent re-apply and retry. |
| Target already gone | Same entry deleted on two phones | Informational. |
| Ambiguous legacy delete | Identical-row count differs | Issue. |
| Whole-list conflict | Legacy form edited on two phones | Choice, then Issue. |
| Old-app overwrite | Revision missing or lower | Warning Issue. |
| Failed or rejected operation | Server refuses repeatedly | Issue (needs attention). |

Daily entries have no edit feature, so "edit both versions" and true merge are not needed for them. The smallest Issue Center is a list with Keep mine (re-apply), Keep server (after a recovery copy), and Discard with confirmation.

## 8. Steps (each reviewable, tested, behind the switch)

| Step | Content | Touches live data? |
|---|---|---|
| 2a | Run `cas_test.html` on a test project, decide D2. No app code. | No |
| 2b | Pure logic only (apply operation, fingerprints, ids, revision rules) plus tests. Not wired in. | No |
| 2c | IndexedDB store and atomic commit, Daily add only. | Only devices with the switch on |
| 2d | Serialized engine with CAS, `saveState()` becomes `replaceKey`, regression comparison of every form's saved data against today's build. **Riskiest step.** | Switch on only |
| 2e | Daily delete and undo by identity, legacy fingerprints. | Switch on only |
| 2f | Status indicator, Sync Now, backoff. | Switch on only |
| 2g | R1 queue conversion and IndexedDB fallback. | Switch on only |

## 9. Tests (beyond the Phase 0 plan)

Two browser contexts saving at the same moment, lost response, killed tab mid-transaction, IndexedDB failure, polling with pending operations, legacy delete with identical rows and a retry, old-client overwrite detection, every form compared against the current build, and a real phone plus a second device at Phase 5.

## 10. Decisions needed

- **D1** Keep sync status on the device only, not in the shared row?
- **D2** After `cas_test.html` passes: add the revision trigger (migration, tested first on your test project), or accept client-only protection and document that older apps can bypass it?
- **D3** Legacy delete by fingerprint plus count, with ambiguity becoming an Issue rather than a guess?
- **D4** Per-device switch, default off, every device on v31.0.3 or later before anyone turns it on?
- **D5** Fall back to the R1 localStorage copy when IndexedDB is unavailable?
- **D6** Run the test page below on a test project (or on your live project: it only touches row id 999) and send me the pass/fail text.
- **D7** Export a backup from Data Tools before step 2c is ever enabled on a real device.

## 11. Addendum from step 2b (2026-11-12): resurrection guard

Found while writing the logic: if phone A's `add` reaches the server but the reply is lost, and phone B deletes that entry before A retries, a plain idempotent retry would bring the deleted entry back. Fix: the shared data remembers the newest 200 deleted ids in `_meta.deleted`; an `add` whose id is on that list is skipped and reported as "deleted elsewhere before it synced" (it becomes an Issue in a later step, with a recovery copy). Limits: 200 deletions is far beyond normal use, but a phone offline through more than 200 later deletions could still resurrect an entry; an older app version that replaces `_meta` also wipes the list (another reason for the trigger). Legacy rows (no id) use the count rule from section 3 instead. Covered by tests in `phase2b/sync_core_tests.js`.
