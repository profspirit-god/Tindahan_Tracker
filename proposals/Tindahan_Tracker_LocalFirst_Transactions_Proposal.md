# TINDAHAN TRACKER
# Local-First Transactions, Synchronization & Reliability Improvements

**Document Type:** Product Requirements & Technical Implementation Direction  
**Status:** Approved Product Direction — Pending Technical Inspection  
**Priority:** High  
**Scope:** Daily Entry first, reusable foundations for other transaction forms  
**Date:** November 7, 2026

---

# TABLE OF CONTENTS

| Section | Topic |
|---|---|
| 1 | Project Objective & Product Philosophy |
| 2 | Existing Problems & Investigation Evidence |
| 3 | Daily Entry Business Rules |
| 4 | Local-First Saving Architecture |
| 5 | Synchronization Queue |
| 6 | Transaction Identity & Data Management |
| 7 | Duplicate Entry Prevention & Warnings |
| 8 | Notification System & Settings |
| 9 | Conflict Detection & Issue Center |
| 10 | Offline Support & Recovery |
| 11 | Reusable Architecture & Integration |
| 12 | UI/UX Requirements |
| 13 | Testing & Acceptance Criteria |
| 14 | Implementation Phases |
| 15 | Scope Restrictions |
| 16 | Instructions & Expected Deliverables |

---

# 1. PROJECT OBJECTIVE & PRODUCT PHILOSOPHY

We are improving Tindahan Tracker's transaction reliability and saving experience.

This is not simply a fix for double-clicking the Save Entry button.

The objective is to establish a reliable transaction management system that:

- Provides an immediate and responsive user experience.
- Saves transactions locally before remote synchronization.
- Supports offline transactions.
- Prevents accidental duplicate submissions.
- Allows legitimate multiple transactions on the same date.
- Handles synchronization conflicts without silently overwriting records.
- Provides detailed, configurable notifications.
- Establishes reusable foundations for future transaction forms.

## Core Philosophy

**1. Human-centered error prevention**

Human error is inevitable. The application should work around human mistakes rather than punish users.

Warn users, explain the consequences, and allow intentional actions when appropriate.

Do not unnecessarily prohibit legitimate business operations.

**2. Local-first experience**

The user should not have to wait for backend processing before continuing to work.

The application should save locally first, then synchronize remotely.

**3. Data integrity**

Never silently duplicate, discard, or overwrite financial records.

**4. Honest feedback**

Distinguish between locally saved and remotely synchronized transactions.

Never claim that a backend operation succeeded before receiving confirmation.

**5. Reusability**

Build systems that can eventually support Daily Entry, GCash, Inventory, Payables, Receivables, and future transaction categories.

**6. Minimalist identity**

Preserve Tindahan Tracker's existing minimalist black-and-white, numbers-first identity.

Prioritize mobile usability. Avoid unnecessary redesign.

---

# 2. EXISTING PROBLEMS & INVESTIGATION EVIDENCE

The current investigation concerns `addDaily()` and `saveState()`.

The supplied Playwright test used a stateful mock server with 400 ms latency.

## Reproduced results

| Scenario | Result |
|---|---|
| One tap, filled form | 1 correct entry |
| Double-tap, 80 ms apart | 1 correct + 1 blank ₱0 entry |
| Triple-tap | 1 correct + 2 blank ₱0 entries |
| One tap on empty form | 1 blank ₱0 entry |
| Double-tap followed by cancel | Local state still contained 2 entries |
| Second tap after 600 ms | Blank ₱0 entry still created |

## Identified problems

### Problem A: No validation and immediate form rebuilding

`addDaily()` accepts empty values, initiates saving, and immediately renders a fresh form.

Subsequent taps can submit the newly empty form.

### Problem B: Overlapping asynchronous saves

Multiple `saveState()` operations can compare against stale server state and mistakenly identify the application's own pending write as an external update.

### Important evidence limitation

The tests used a mock Supabase client, not the live backend.

The delayed mock also retains a payload reference, so the cancel scenario does not conclusively establish how the actual Supabase client serializes and persists the payload.

Verify actual backend behavior before making conclusions about live data.

Other transaction forms may share the same pattern, but they have not yet been independently reproduced.

---

# 3. DAILY ENTRY BUSINESS RULES

These are established product requirements.

## 3.1 Zero-value entries

- Empty monetary fields are interpreted as ₱0.
- Partially empty entries are allowed.
- At least one relevant monetary field greater than zero makes an ordinary entry valid.
- If some fields are zero, notify the user.
- Provide a short toast and an optional detailed popup explaining which fields are zero.
- Do not reject an entry simply because some fields are zero.

If every monetary field is zero and Store Closed has not been selected:

Show a confirmation:

"All monetary fields are ₱0. Are you sure you want to save this entry?"

The user may proceed or cancel.

Do not silently discard the entry.

## 3.2 Store Closed

Provide an explicit Store Closed option.

Behavior:

- Selecting Store Closed automatically sets relevant monetary fields to zero.
- The fields remain editable afterward.
- Store Closed is an indicator, not a restriction against recording transactions.
- Special treatment for customers may result in transactions even when the store is otherwise closed.

Preserve Store Closed as part of the transaction record.

## 3.3 Multiple entries per day

Multiple Daily Entries on the same date are allowed.

Do not enforce one entry per day.

However, before saving the second and every subsequent entry for that date, show a possible-duplicate warning by default.

Suggested wording:

"Today's entry was already logged. Proceed anyway? This may create a duplicate. Please check before continuing."

The user can:

- Proceed with the new entry.
- Cancel and review existing entries.

The warning must be configurable in Settings.

The warning is enabled by default.

## 3.4 Form behavior

After successful local persistence:

- Reset the form.
- Allow another transaction immediately.
- Do not wait for backend synchronization.

If local persistence fails:

- Preserve the form.
- Show an error.
- Do not claim the transaction was saved.

---

# 4. LOCAL-FIRST SAVING ARCHITECTURE

This is the central architectural direction.

## Desired workflow

1. User completes a transaction.
2. User presses Save.
3. Application performs required validation and warnings.
4. Transaction is committed to durable local storage.
5. Application immediately confirms that the transaction is saved on this device.
6. Form resets.
7. User can continue entering transactions.
8. Transaction enters the synchronization queue.
9. Backend synchronization happens asynchronously.
10. Backend confirmation updates the transaction's synchronization status.
11. A success toast confirms actual remote synchronization.

The user must not wait for remote synchronization before creating another transaction.

## Required states

Every transaction must distinguish between:

- Saving locally
- Saved on this device
- Waiting to sync
- Syncing
- Synced
- Sync failed / Needs attention

Do not use ambiguous success notifications.

For example:

"Entry saved on this device. Waiting to sync."

And after backend confirmation:

"Daily Entry successfully synchronized."

## Important requirement

Local persistence must be durable.

Investigate IndexedDB or another suitable browser-side storage mechanism.

Do not rely exclusively on:

- In-memory JavaScript objects.
- Temporary promises.
- Non-persistent queues.

Pending transactions must survive refreshes, browser restarts, and temporary connectivity loss.

---

# 5. SYNCHRONIZATION QUEUE

Implement a central synchronization queue.

## Requirements

- One synchronization operation at a time.
- One central queue for all transaction categories.
- Category-aware ordering.
- Preserve required operation dependencies.
- Users can continue creating local transactions while synchronization is running.
- New transactions must not modify previously queued payloads.
- Queue operations must be safe against accidental duplicate execution.
- Failed operations remain pending.
- Retry safely when possible.
- Provide manual Sync Now.
- Automatically resume synchronization when connectivity returns.

## Important technical requirement

Do not pass mutable whole-application state references into delayed asynchronous operations.

Use stable transaction identifiers and immutable snapshots or equivalent safe payload handling.

Investigate idempotent synchronization so retrying an operation does not create duplicate backend records.

---

# 6. TRANSACTION IDENTITY & DATA MANAGEMENT

Each transaction should have a stable identity.

Investigate an efficient metadata structure containing:

- Unique transaction ID.
- Transaction category.
- Business date.
- Creation timestamp.
- Last-modified timestamp.
- Synchronization status.
- Version/concurrency metadata.

Use a stable transaction ID generated before synchronization.

Preserve the original transaction date and creation time when synchronizing offline records later.

Do not replace the original creation time with the synchronization time.

## Efficiency

Avoid unnecessary database fields.

Avoid repeatedly uploading the entire application dataset for every transaction if safe incremental synchronization is compatible with the existing architecture.

Investigate the current backend structure before proposing migrations.

---

# 7. DUPLICATE ENTRY PREVENTION & WARNINGS

Duplicate detection is a warning mechanism, not a restriction.

For Daily Entry:

- Check whether any entry already exists for the same business date.
- Warn before saving every subsequent entry for that date.
- Different monetary values do not eliminate the warning.
- Allow the user to proceed.
- Allow the user to cancel.
- Preserve the form when canceled.
- Make the warning configurable in Settings.

Do not treat two entries on the same date as automatically identical or invalid.

---

# 8. NOTIFICATION SYSTEM & SETTINGS

Build a reusable and expandable notification system.

## 8.1 Toasts

Toasts must remain enabled globally.

They communicate:

- Success.
- Failure.
- Warning.
- Short informational messages.

Users may configure:

- Toast detail level.
- Sound.
- Visual particles/effects.

Toasts must accurately distinguish local saving from backend synchronization.

## 8.2 Popups

Popups can be enabled or disabled individually through Settings.

They are used for:

- Important confirmations.
- Possible duplicate entries.
- Zero-value warnings.
- Store Closed behavior.
- Data conflicts.
- Other important decisions.

Disabling a popup must not disable validation or data protection.

## 8.3 Settings structure

Create:

Settings → Notifications

Expandable categories:

### Daily Entry

- Zero-value fields warning.
- All-zero entry confirmation.
- Store Closed confirmation, if applicable.
- Possible duplicate entry warning.
- Local save notification.
- Synchronization success/failure.

### Synchronization

- Waiting to sync.
- Sync started.
- Sync completed.
- Sync failed.
- Connection restored.

### Data Issues

- Conflict detected.
- Issue requires attention.
- Conflict resolution completed.

Future categories:

- GCash.
- Inventory.
- Payables.
- Receivables.
- Other transaction categories.

The structure must be expandable so future notification settings can be added without redesigning the entire settings page.

## 8.4 Default behavior

Default preferences should be attention-grabbing:

- Important popups enabled.
- Detailed toasts enabled.
- Sound enabled.
- Visual effects enabled where supported and appropriate.

Users can adjust the settings.

Toasts cannot be globally disabled.

## 8.5 Severity

Notification behavior depends on severity.

- Informational: short toast.
- Success: toast confirming the actual completed action.
- Warning: toast and/or popup.
- Critical: persistent issue record.
- Action required: remain visible until acknowledged or resolved.

Critical unresolved issues must remain discoverable even when their popup is disabled.

---

# 9. CONFLICT DETECTION & ISSUE CENTER

A genuine data conflict must never be silently resolved through last-write-wins behavior.

## 9.1 Persistent Issues tab

Create an Issues tab or equivalent persistent area.

When a conflict is detected:

1. Show an attention-grabbing toast.
2. Show a popup where enabled.
3. Create a persistent issue record.
4. Identify the affected transaction.
5. Keep the issue visible until resolved.

## 9.2 Required issue information

Display:

- Transaction form/category.
- Business date.
- Unique transaction ID.
- Issue type.
- Local version.
- Remote/server version.
- Relevant timestamps.
- Synchronization status.
- Available resolution actions.

Do not use vague warnings without identifying the affected record.

## 9.3 Resolution actions

Users must be able to:

1. Keep the local version.
2. Keep the remote/server version.
3. Merge the versions when safe.
4. Edit either version before resolving.
5. Discard a selected version or record with explicit confirmation.

Preserve both versions until the user resolves the issue.

Clearly identify which version will be retained and which will be discarded.

Never silently merge or overwrite financial records.

Recheck the remote version immediately before finalizing a resolution because it may have changed while the issue was pending.

## 9.4 Future AI assistant compatibility

A future AI assistant will help users understand and resolve issues.

Do not implement the AI assistant now.

However, structure issue information so an AI can eventually understand:

- Affected transaction.
- Changes between versions.
- Conflict reason.
- Available actions.
- Previous resolution attempts.

The AI must not independently discard or overwrite financial records.

User approval remains necessary for consequential resolutions.

---

# 10. OFFLINE SUPPORT & RECOVERY

Required behavior:

- Transactions can be created offline.
- Transactions are committed locally.
- The application displays that they are waiting to sync.
- Synchronization resumes automatically when connectivity returns.
- Manual Sync Now is available.
- Failed synchronization does not delete local transactions.
- Pending transactions survive refresh and browser restart.
- Retry does not create duplicate remote records.
- Preserve original business date and creation time.

Investigate a bounded retry/backoff strategy.

If the backend may have accepted a request but the client did not receive its response, reconcile using stable transaction identity before retrying.

Do not assume a timeout means the backend rejected the transaction.

---

# 11. REUSABLE ARCHITECTURE & INTEGRATION

The owner approved building reusable foundations now, starting with Daily Entry.

Separate responsibilities logically:

1. Transaction validation.
2. Local transaction persistence.
3. Synchronization queue.
4. Backend adapter.
5. Conflict detection and resolution.
6. Notification service.
7. Transaction identity and metadata.

These are architectural responsibilities, not an instruction to create unnecessary frameworks or files.

Follow the existing codebase conventions.

## Other transaction forms

Investigate:

- Daily Entry.
- GCash.
- Inventory.
- Payables.
- Receivables.

Determine which share the existing push-save-render pattern.

Implement and validate the reusable foundations using Daily Entry first.

Do not rewrite every transaction form now.

Document how each form can integrate into the new system later.

---

# 12. UI/UX REQUIREMENTS

Preserve:

- Minimalist black-and-white design.
- Numbers-first identity.
- Existing functional layouts where practical.

Prioritize:

- Mobile usability.
- Clear save states.
- Compact synchronization indicators.
- Easy access to unresolved issues.
- Understandable warnings.
- Responsive transaction entry.

Avoid:

- Unnecessary redesign.
- Excessive popups.
- Blocking the entire application during synchronization.
- Hiding unresolved conflicts.
- Mixing presentation changes with business calculations.

---

# 13. TESTING & ACCEPTANCE CRITERIA

Perform as much meaningful testing as practical.

## Daily Entry

- Single valid submission.
- Empty form.
- Partially empty form.
- All-zero entry.
- Store Closed entry.
- Store Closed with edited monetary values.
- Intentional zero-value confirmation.
- Cancel confirmation.
- Multiple entries on the same date.

## Repeated submissions

- Single tap.
- Double-tap.
- Triple-tap.
- Very rapid taps.
- Delayed repeated taps.
- Real mobile touch input.
- Keyboard submission, if supported.
- New entry while previous entries are syncing.

Acceptance: no accidental duplicate from one submission gesture and no blank entry caused by a reset form.

## Local persistence

- Successful local commit.
- Failed local commit.
- Page refresh.
- Browser restart.
- Multiple pending transactions.
- Queue payload immutability.
- Stable transaction identifiers.

## Synchronization

- Slow network.
- Intermittent connectivity.
- Offline creation.
- Reconnection.
- Backend rejection.
- Timeout.
- Uncertain backend response.
- Retry.
- Multiple queued transactions.

Acceptance: no lost local transactions and no accidental duplicate remote records.

## Conflict testing

- Two devices modify the same record.
- Offline changes conflict with server changes.
- Remote version changes while an issue is pending.
- Keep-local action.
- Keep-server action.
- Merge.
- Edit.
- Discard.
- Explicit confirmation.
- Persistent issue visibility.

## Notifications

- Toasts cannot be globally disabled.
- Popup toggles work.
- Category expansion works.
- Sound settings work.
- Visual effect settings work.
- Detail level works.
- Critical issues remain discoverable.

## Regression testing

Inspect:

- Daily Entry.
- GCash.
- Inventory.
- Payables.
- Receivables.
- Reports.
- Insights.
- Transaction history.
- Existing calculations.

Test on an actual mobile device, including narrow-screen layouts.

Document all test results and remaining limitations.

---

# 14. IMPLEMENTATION PHASES

Implement in small, reviewable phases.

## Phase 0 — Repository Inspection

Before coding:

- Confirm current branch and commit.
- Check working-tree status.
- Trace Daily Entry save flow.
- Inspect `addDaily()` and `saveState()`.
- Inspect local persistence.
- Inspect Supabase communication.
- Inspect realtime subscriptions.
- Inspect transaction structures.
- Inspect other transaction forms.
- Identify migration risks.

Deliverable:

A concise architecture report, affected-file list, technical constraints, proposed design, and test plan.

## Phase 1 — Daily Entry Safeguards

Implement:

- Empty-as-zero handling.
- Zero-value notifications.
- All-zero confirmation.
- Store Closed option.
- Editable fields after Store Closed.
- Same-date duplicate warning.
- Safe submission guard.
- Correct form reset after local persistence.

Deliverable:

Daily Entry implementation with focused automated tests.

## Phase 2 — Local Persistence & Synchronization

Implement:

- Durable local transaction storage.
- Central synchronization queue.
- Sequential synchronization.
- Stable transaction IDs.
- Immutable queued payloads.
- Synchronization statuses.
- Retry and recovery.
- Offline support.

Deliverable:

Reliable local-first Daily Entry workflow.

## Phase 3 — Notification System

Implement:

- Reusable toast service.
- Reusable popup service.
- Expandable notification categories.
- Individual popup toggles.
- Sound settings.
- Visual effects settings.
- Toast detail settings.
- Severity-aware behavior.

Deliverable:

Reusable notification foundation integrated with Daily Entry.

## Phase 4 — Issue Center

Implement:

- Persistent issue records.
- Conflict identification.
- Version comparison.
- Keep-local.
- Keep-server.
- Merge.
- Edit.
- Discard.
- Explicit confirmations.
- Safe resolution.

Deliverable:

Tested conflict-management workflow.

## Phase 5 — Regression & Mobile Testing

Perform:

- Full acceptance tests.
- Real-device testing.
- Offline testing.
- Slow-network testing.
- Conflict testing.
- Existing transaction regression testing.

Document integration requirements for other transaction forms.

Deliverable:

Final testing report, changed-file summary, known limitations, and next-step recommendations.

---

# 15. SCOPE RESTRICTIONS

## Authorized

- Daily Entry reliability improvements.
- Local-first persistence.
- Sequential synchronization.
- Transaction identity.
- Offline support.
- Reusable notifications.
- Issue Center.
- Conflict resolution.
- Investigation of other transaction forms.
- Appropriate testing.

## Not authorized without separate approval

- Unrelated UI redesign.
- Changes to existing financial calculations.
- Authentication redesign.
- Permission redesign.
- Broad rewriting of all transaction forms.
- Unnecessary database migrations.
- Destructive data migrations.
- Deleting existing records.
- Implementing the AI assistant.
- Silent conflict resolution.

If a requirement cannot be safely implemented within the current architecture, explain the limitation and propose alternatives before expanding the scope.

---

# 16. INSTRUCTIONS & EXPECTED DELIVERABLES

## IMPORTANT: START WITH PHASE 0

Do not immediately start modifying the application.

First inspect the actual repository.

Answer these questions:

1. What is the current branch and commit?
2. What is the source of truth for transaction data?
3. What local persistence currently exists?
4. Does `saveState()` upload the entire application state or individual changes?
5. How are asynchronous saves handled?
6. How does the existing conflict detection work?
7. How do realtime subscriptions interact with pending writes?
8. Do transactions already have unique identifiers?
9. What backend constraints exist?
10. Can the existing backend support idempotent writes?
11. What is the safest durable local storage option?
12. How can pending changes survive refresh and browser restart?
13. Which other transaction forms share the same save pattern?
14. Which reports and calculations depend on the current record structure?
15. What is the smallest safe implementation that satisfies these requirements?

## Expected Phase 0 response

Provide:

**A. Current Architecture**

Explain the existing data flow and save process.

**B. Affected Files**

List the exact files and functions that would be modified.

**C. Technical Risks**

Identify potential data loss, compatibility, synchronization, and migration risks.

**D. Proposed Architecture**

Explain how local persistence, synchronization, notifications, and conflict handling should work together.

**E. Implementation Plan**

Break down the work into reviewable phases.

**F. Testing Plan**

Specify how each important requirement will be verified.

**G. Approval Required**

Identify any decisions that still require the owner's approval.

Do not implement broad changes before presenting the Phase 0 findings.

---

# FINAL DEVELOPMENT DIRECTIVE

Treat this document as the approved product direction and requirements, not permission to rewrite the application indiscriminately.

The priority is reliability, usability, and maintainability.

Preserve the existing minimalist, black-and-white, numbers-first identity.

Make the user experience immediate while the backend works asynchronously.

Protect financial records.

Allow legitimate business operations.

Never silently discard or overwrite data.

Build reusable foundations without unnecessarily complicating the existing application.

Work phase by phase, explain every significant change, and provide evidence through testing.

**Start with Phase 0: inspect, analyze, document, and propose. Do not code yet.**
