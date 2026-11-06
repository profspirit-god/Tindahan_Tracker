---
date: 2026-11-06
status: Proposal --- Not Approved for Implementation
subtitle: Assessment Proposal and Implementation Guidelines for Claude
title: Tindahan Tracker --- Family Access & Security Architecture
---

# Tindahan Tracker --- Family Access & Security Architecture

**Document type:** Technical proposal for assessment\
**Repository:** `profspirit-god/Tindahan_Tracker`\
**Intended reviewer:** Claude (repository-aware technical assessment)\
**Decision authority:** Project owner\
**Status:** Discussion draft. This document is not an instruction to
implement immediately.

> **Important:** Treat every recommendation in this document as a
> proposal to evaluate against the actual repository, current Supabase
> configuration, existing authentication work, and operational
> constraints. Do not assume that the descriptions below match the
> current implementation. Do not modify production code, database
> policies, credentials, or data until the owner has reviewed the
> assessment and explicitly approved an implementation plan.

------------------------------------------------------------------------

## Document navigation

  If you need to...                                     Read these sections
  ----------------------------------------------------- ---------------------
  Understand the request and intended user experience   1--3
  Review the proposed architecture                      4--6
  Assess database security and RLS                      7--8
  Assess PIN, sessions, and device enrollment           9--10
  Review synchronization and audit requirements         11--12
  Plan safe migration and testing                       13--15
  Produce an actionable assessment                      16
  Find implementation boundaries and non-goals          17--18

## 1. Executive summary

The owner wants Tindahan Tracker to support three people across multiple
devices:

1.  **Owner:** the project owner, primarily using the home PC.
2.  **Parent/Manager A:** the owner's father, using his own phone.
3.  **Parent/Manager B:** the owner's mother, using her own phone.

Both parents should have **full access to ordinary business operations**
and should be able to unlock the application using a personal PIN during
normal use. They should not have to repeatedly enter an email address
and password every time they open the application.

The owner should retain control over account administration and
security-sensitive configuration.

The proposed direction is:

-   Each person has an individual Supabase Auth identity. Do not share
    one account among family members.
-   Each device has its own authenticated session and device record
    where feasible.
-   A parent PIN is primarily a **local application-unlock mechanism**
    for an already authenticated session, not a replacement for server
    authentication.
-   PostgreSQL Row Level Security (RLS), and where appropriate trusted
    server-side functions, enforce access. Frontend-only checks are not
    security boundaries.
-   Both parents can perform normal business operations. Owner-only
    actions are limited to account administration and
    security/infrastructure management.
-   Existing application architecture and data should be preserved
    unless the repository assessment demonstrates a concrete reason to
    change them.

This proposal intentionally does **not** prescribe an immediate
framework migration or a wholesale database redesign.

## 2. Goals

### 2.1 Functional goals

-   Support three distinct people: one owner and two managers.
-   Support the owner's PC and each parent's separate phone.
-   Let each parent use a personal PIN for routine unlocking after
    initial enrollment.
-   Allow both parents to perform the normal work of running the store.
-   Attribute important actions to the authenticated person who
    performed them.
-   Let the owner revoke access to a lost or compromised device/account.
-   Keep all authorized devices connected to the same business data.
-   Preserve existing business records, calculations, workflows, and
    user experience wherever possible.

### 2.2 Security goals

-   Enforce authorization in the database or trusted backend, not only
    in JavaScript.
-   Prevent managers from granting themselves owner privileges.
-   Prevent one family member from impersonating another.
-   Keep Supabase service-role keys and other privileged secrets out of
    browser code.
-   Protect PINs from plaintext storage and trivial offline guessing.
-   Prevent revoked or disabled accounts from continuing to access
    protected data.
-   Avoid silent data loss from simultaneous use on multiple devices.
-   Provide a recoverable process for forgotten PINs and lost devices.

## 3. Scope and operating assumptions

### In scope

-   Supabase Auth identity and session review.
-   Owner and manager roles.
-   Parent PIN enrollment and local unlock experience.
-   Device/session lifecycle and revocation.
-   PostgreSQL RLS and trusted server-side operations.
-   Audit attribution.
-   Multi-device synchronization safety.
-   Backup, migration, and acceptance-test planning.

### Out of scope unless separately approved

-   Replacing Vanilla JavaScript, HTML, or CSS with a frontend
    framework.
-   Replacing GitHub Pages solely for architectural preference.
-   Rewriting all business logic.
-   Replacing the existing data model without evidence that it is
    necessary.
-   Adding unrelated business features.
-   Treating this proposal as authorization to make production changes.

### Assumptions to verify, not facts to presume

-   The application is a browser-based frontend hosted through GitHub
    Pages.
-   Supabase is used for authentication and PostgreSQL persistence.
-   The application may store much of its state in a single JSONB
    document or row.
-   Claude may already have introduced Supabase email sign-in or related
    authentication changes.
-   The owner currently has difficulty accessing the original Supabase
    account.
-   The owner expects to have access to the parents' devices during
    enrollment.

Claude must inspect the repository and identify which assumptions are
correct, incorrect, or unknown.

## 4. Proposed identity and permission model

Use individual identities rather than a shared family login.

  ------------------------------------------------------------------------
  Person            Proposed role     Device            Intended access
  ----------------- ----------------- ----------------- ------------------
  Owner             `owner`           Home PC (and any  Full business
                                      separately        access plus
                                      enrolled owner    account/security
                                      device)           administration

  Father            `manager`         Father's phone    Full ordinary
                                                        business access

  Mother            `manager`         Mother's phone    Full ordinary
                                                        business access
  ------------------------------------------------------------------------

### 4.1 Meaning of "full access" for parents

For this project, full manager access means the parents can use the
application's ordinary business features, subject to confirmation of the
actual modules in the repository. This may include:

-   Sales and daily transaction records.
-   Expenses and cash-flow records.
-   Inventory, stock adjustments, and product records.
-   Customer receivables, debts, and payments.
-   Supplier records, purchases, and payables.
-   Reports, analytics, and historical business information.
-   Other ordinary operational records currently available to the owner.

The parents should not be treated as restricted cashiers if the intended
workflow is that they can manage the store.

### 4.2 Owner-only administrative capabilities

The following should normally remain owner-only:

-   Inviting, creating, disabling, or removing users.
-   Assigning or changing roles.
-   Managing device revocation for other users.
-   Changing authentication and security configuration.
-   Managing privileged database operations, secrets, and backups.
-   Performing destructive maintenance or recovery operations.

Claude should inspect the existing feature set and identify any current
owner-only functions that need an explicit decision. Do not silently
remove or broaden existing permissions.

### 4.3 Role model

A minimal role model may be sufficient:

-   `owner`
-   `manager`

Avoid adding roles such as cashier, auditor, or staff unless the current
application genuinely needs them.

Role assignment must be controlled by a trusted administrative path. A
manager must not be able to change their own role or another user's role
through an ordinary profile update.

## 5. Proposed authentication and PIN experience

### 5.1 Separate authentication from application unlocking

These are different security functions:

-   **Supabase Auth:** establishes the user's identity and issues an
    authenticated session.
-   **PIN unlock:** provides a convenient local lock for the application
    on a device that has already been enrolled and authenticated.

A PIN entered into a frontend-only screen does not, by itself, prove
identity to Supabase and must not grant database access.

### 5.2 Recommended parent enrollment flow

Subject to review of the existing Supabase Auth implementation:

1.  The owner restores access to the correct Supabase project and
    verifies the production environment.
2.  The owner creates or invites the father's individual Auth identity
    through a supported, secure enrollment flow.
3.  The father completes initial authentication on his own phone.
4.  The application associates the authenticated user ID with the
    manager profile.
5.  The father sets a personal PIN.
6.  The phone is registered as an enrolled device where feasible.
7.  The same process is repeated independently for the mother on her
    phone.
8.  The owner signs in on the home PC using the owner's own identity.

The parents should not need to know or use the owner's Supabase
credentials.

Do not assume that the parents can use a PIN for the very first
enrollment. Initial identity verification and account recovery must use
a secure mechanism supported by Supabase Auth.

### 5.3 Routine parent use

A proposed routine flow:

1.  Parent opens Tindahan Tracker on their own phone.
2.  If the device still has a valid authenticated session and the local
    application is locked, the parent enters their PIN.
3.  The application unlocks the interface for that already authenticated
    identity.
4.  The backend continues to authorize database requests using the
    authenticated Supabase session.
5.  If the session has expired, been revoked, or is no longer valid, the
    application requires reauthentication rather than accepting the PIN
    alone.

The UI should clearly distinguish: - Application locked. - Session
expired. - Account disabled. - Device revoked. - PIN incorrect. -
Network unavailable.

### 5.4 PIN requirements

Claude should recommend a practical PIN policy based on the actual
threat model and browser capabilities.

At minimum:

-   Never store a plaintext PIN.
-   Never put a PIN, PIN hash, or PIN verification secret in public
    source code.
-   Do not treat a plain SHA-256 hash of a short PIN as sufficient
    protection. A six-digit PIN has a small search space and can be
    brute-forced if an attacker obtains an unsalted or inadequately
    protected verifier.
-   Use a vetted, appropriately salted password-hashing approach if a
    server-side PIN verifier is genuinely required.
-   Enforce rate limits and escalating delays or temporary lockouts for
    repeated failures.
-   Avoid revealing whether a PIN belongs to another user.
-   Provide a secure PIN reset process that requires owner-controlled or
    identity-verified recovery.
-   Do not transmit the PIN to the database on every ordinary business
    request.

**Important browser limitation:** A normal browser-based application
cannot guarantee that a JavaScript PIN screen protects session tokens
from someone who can inspect or execute code in that browser profile. A
local PIN screen is a convenience lock, not a substitute for server-side
authentication, device security, or protection against cross-site
scripting (XSS).

Claude must explain the limits of the proposed implementation rather
than describing a frontend PIN gate as strong device security.

### 5.5 Session persistence and storage

Inspect the current Supabase client configuration before changing it.

Evaluate:

-   Where Supabase session tokens are stored.
-   Whether the application uses the official Supabase client session
    lifecycle correctly.
-   How refresh tokens are handled.
-   What happens when browser storage is cleared.
-   What happens when a user logs out.
-   What happens after password reset, account disablement, or device
    revocation.
-   Whether XSS could steal or misuse a session.

Do not invent a custom token-storage or cryptography system without a
demonstrated need and a reviewed design.

If browser storage is used, document its limitations. Consider stronger
device-bound authentication or passkeys as a future option, but do not
make them a prerequisite for the first safe release unless required by
the existing implementation.

## 6. Proposed application architecture

The conceptual flow is:

``` text
Father's phone ─┐
Mother's phone ─┼── Tindahan Tracker frontend
Owner's PC ─────┘             |
                              v
                         Supabase Auth
                              |
                     Authenticated identity
                              |
                              v
                 PostgreSQL RLS / trusted backend
                              |
                              v
                   Shared business data
```

### 6.1 Frontend responsibilities

The frontend may:

-   Display the login and PIN-unlock screens.
-   Display features permitted to the current user.
-   Request data and submit ordinary business operations.
-   Display session, lock, and device status.
-   Show clear errors when access is denied.

The frontend must not be the final authority for:

-   User identity.
-   Role assignment.
-   Authorization to read or modify protected data.
-   Audit actor identity.
-   Privileged database operations.

### 6.2 Backend and database responsibilities

The database and trusted backend should:

-   Verify the authenticated identity.
-   Enforce RLS policies.
-   Check that the account is active and belongs to the correct
    business.
-   Enforce role-based permissions.
-   Validate sensitive operations.
-   Record the authenticated actor for audit events.
-   Protect privileged operations from direct browser invocation by
    unauthorized users.

Use Supabase Edge Functions or PostgreSQL functions/RPCs where they
provide a clear security or transaction boundary. Do not introduce
server-side components indiscriminately if RLS and ordinary database
operations are sufficient.

## 7. Database identity and role design

Claude should inspect the current schema first. The following is a
conceptual model, not a demand to create these exact tables.

Possible profile structure:

``` text
profiles
--------
id                  -> matches auth.users.id
display_name
role                -> owner | manager
is_active
created_at
updated_at
```

If the application may support multiple businesses or tenants, consider
a business membership model instead:

``` text
business_memberships
--------------------
business_id
user_id
role
is_active
created_at
```

Do not add multi-tenant complexity unless the current product direction
warrants it.

### 7.1 Required invariants

-   Every person has a unique Supabase Auth user ID.
-   The profile or membership references that authenticated user ID.
-   Only an authorized owner-controlled process can grant the `owner`
    role.
-   A manager cannot edit their own role or activate a disabled account.
-   Disabled users cannot access protected business data.
-   A user must not gain access merely by changing a frontend variable,
    request body, or local storage value.
-   The authenticated actor must be derived from the verified session,
    not from a client-supplied `user_id`.

### 7.2 Role lookup and RLS design

Claude must inspect how roles are currently stored and how policies
obtain them.

Policies must avoid unsafe recursion, privilege escalation, and reliance
on client-editable profile fields. If a `SECURITY DEFINER` function is
proposed, review its ownership, fixed `search_path`, execution grants,
and input validation.

Do not copy a generic SQL policy into production without adapting it to
the actual schema and testing it under each user identity.

## 8. Row Level Security and data-access requirements

RLS is a primary security boundary for a browser application connected
to Supabase.

Claude should inventory every table, view, function, and storage bucket
that contains or exposes business data.

For each relevant table, document:

-   Whether RLS is enabled.
-   Whether policies exist for `SELECT`, `INSERT`, `UPDATE`, and
    `DELETE`.
-   Which roles or authenticated identities each policy permits.
-   Whether anonymous access is possible.
-   Whether a user can change protected columns.
-   Whether views or RPC functions bypass or alter expected permissions.
-   Whether grants are broader than the policies intend.

### 8.1 Expected access behavior

  -----------------------------------------------------------------------
  Operation                   Owner     Active manager    Unauthenticated
                                                                     user
  -------------- ------------------ ------------------ ------------------
  Read business               Allow              Allow               Deny
  records                                              

  Create                      Allow              Allow               Deny
  ordinary                                             
  business                                             
  records                                              

  Update                      Allow              Allow               Deny
  ordinary                                             
  business                                             
  records                                              

  Delete              As explicitly      As explicitly               Deny
  ordinary                 approved           approved 
  business                                             
  records                                              

  Change a            Allow through               Deny               Deny
  user's role    trusted admin path                    

  Disable             Allow through               Deny               Deny
  another        trusted admin path                    
  account                                              

  Read                Never through      Never through               Deny
  privileged                browser            browser 
  secrets                                              
  -----------------------------------------------------------------------

Deletion behavior should be assessed carefully. If the existing
application uses soft deletion, archival, or undo, preserve those
semantics. Do not grant broad destructive privileges simply because
managers have full operational access.

### 8.2 Single-row JSONB warning

If the application stores the entire application state in one JSONB row,
table-level RLS can generally decide whether a user may access or update
that row. It cannot automatically enforce different permissions on
individual JSON properties inside the document.

Therefore:

-   If owner and managers have the same access to the entire business
    state, an active-membership policy may be adequate for that row,
    subject to concurrency and validation concerns.
-   If some parts of the JSONB state must be owner-only, frontend hiding
    is insufficient. Consider a trusted backend boundary or separating
    sensitive data into protected tables.
-   Do not assume that a policy on the JSONB row protects individual
    fields.
-   Do not expose administrative or secret values inside a JSONB
    document sent to all managers.

Claude must make a specific recommendation based on the actual state
structure.

### 8.3 Supabase keys

-   The Supabase publishable/anon key is intended to be used by a client
    application, provided RLS and grants are correctly configured.
-   The `service_role` key and any secret key with elevated privileges
    must never be included in `index.html`, public JavaScript, Git
    history, or GitHub Pages assets.
-   If a privileged key was ever committed or published, treat it as
    compromised and rotate it through the Supabase project after access
    is recovered.
-   Do not claim that hiding a publishable key makes a database secure.

## 9. Device enrollment and management

The three devices should have separate authenticated sessions.

Proposed device records, if useful and safely implementable:

``` text
user_devices
------------
id
user_id
device_label
created_at
last_seen_at
revoked_at
```

This is a conceptual schema. Browser device identification is imperfect:
user-agent strings and client-generated device IDs can be spoofed or
reset. Do not describe a browser-generated device ID as strong hardware
identity.

### 9.1 Expected devices

  Device label     Account
  ---------------- -------------------
  Father's Phone   Father's identity
  Mother's Phone   Mother's identity
  Home PC          Owner's identity

### 9.2 Device-management behavior

-   The owner can view enrolled devices and their last-seen information.
-   The owner can revoke a device or account.
-   A revoked device must no longer be able to access protected data
    after the backend recognizes the revocation.
-   Each parent can log out of their own device.
-   Logging out one device should not unintentionally log out every
    other family device unless the chosen Supabase session-revocation
    mechanism explicitly behaves that way.
-   A lost phone should have a documented response procedure.
-   Device records should not be trusted as the only authorization
    control.

Claude must verify the exact Supabase Auth session-revocation
capabilities and limitations before promising immediate per-device
revocation. If the current token/session design cannot support reliable
individual device revocation, explain the limitation and propose a safe
alternative.

## 10. Account enrollment, recovery, and lifecycle

### 10.1 Initial enrollment

Do not begin enrollment until the owner has recovered access to the
correct Supabase account and confirmed the correct project.

Proposed sequence:

1.  Confirm the production Supabase project and its URL/key
    configuration.
2.  Create a verified backup/export of the current business data.
3.  Inspect existing Auth users and determine whether Claude already
    created accounts.
4.  Avoid creating duplicate identities.
5.  Create or invite the father's account.
6.  Complete initial sign-in on the father's phone.
7.  Set the father's display name and manager role through a trusted
    owner-controlled process.
8.  Enroll the device and establish the PIN-unlock experience.
9.  Test reading and writing business data.
10. Repeat independently for the mother's account and phone.
11. Verify the owner account on the home PC.
12. Test all three identities and devices before normal production use.

### 10.2 Forgotten PIN

A forgotten PIN must not be recoverable by displaying the old PIN.

Recommended recovery:

-   Require a trusted account recovery or owner-controlled reset
    process.
-   Reauthenticate or verify identity before resetting the PIN.
-   Invalidate the old local unlock credential.
-   Preserve the user's business records and identity.
-   Log the security-relevant reset event.

### 10.3 Lost device

Recommended response:

1.  Owner opens device/account management from a trusted device.
2.  Revoke the lost device or the affected user's sessions using a
    verified mechanism.
3.  If compromise is suspected, reset the user's authentication
    credentials as appropriate.
4.  Confirm the revoked device can no longer access protected data.
5.  Enroll a replacement device through the normal process.

## 11. Multi-device synchronization and data integrity

Three people using different devices introduces real concurrency risk.

Claude must inspect the current save/load logic, conflict detection, and
offline queue before changing them.

### 11.1 Risks to investigate

-   Two devices load the same initial state and later save different
    changes.
-   A full JSONB write from one device overwrites another device's newer
    update.
-   Retried network requests create duplicate sales or payments.
-   An offline queued action is submitted after the underlying record
    has changed.
-   A client writes stale data after another device has updated the same
    record.
-   The application displays success before the server confirms a write.

### 11.2 Desired behavior

-   Use server-confirmed writes for important financial and inventory
    operations.
-   Use atomic database operations or transactions for related changes.
-   Add idempotency protection to operations that may be retried.
-   Detect stale versions and return a visible conflict rather than
    silently overwriting newer data.
-   Preserve existing offline behavior only if its reconciliation rules
    are safe and understood.
-   Never silently discard a transaction.
-   Ensure audit records correspond to committed operations.

### 11.3 JSONB architecture decision

Do not automatically normalize the database as part of this security
project.

First determine whether the current single-document model can safely
support the expected three-device workload.

If retaining JSONB:

-   Assess optimistic concurrency/version checks.
-   Assess whether writes are atomic and compare-and-swap behavior is
    actually enforced by the database.
-   Consider a PostgreSQL RPC that performs a version check and update
    atomically.
-   Validate the incoming operation and avoid trusting arbitrary client
    replacement of protected state.
-   Measure document growth and write contention.

If the current model cannot reliably prevent lost updates, present a
staged alternative. A future move to transaction-oriented tables may be
appropriate, but requires a separate migration proposal, data
validation, and rollback plan.

## 12. Audit logging and accountability

Important business actions should be attributable to the authenticated
user.

Potential audit fields:

``` text
audit_events
------------
id
business_id
actor_user_id
action
entity_type
entity_id
created_at
metadata
```

This is illustrative, not a required schema.

Requirements:

-   Derive `actor_user_id` from the authenticated session on the trusted
    side.
-   Do not trust a client-provided actor ID.
-   Record security-relevant events such as account changes, role
    changes, device revocation, and PIN resets.
-   Preserve the application's existing business audit/history behavior.
-   Do not log passwords, PINs, access tokens, refresh tokens, or other
    secrets.
-   Restrict modification/deletion of security audit records.
-   Define retention and backup expectations.

The UI may display a person's name, but the stored actor reference
should be the stable authenticated user ID.

## 13. Backup, migration, and rollback requirements

Security changes can lock users out or damage existing records if
deployed carelessly.

Before any production migration:

-   Export the existing business data.
-   Confirm that the export can be read and restored.
-   Record the current schema and policies.
-   Record the current Supabase Auth configuration.
-   Identify all current users and project credentials without exposing
    secrets in the repository.
-   Use a separate development/staging Supabase project for testing
    where feasible.
-   Test migrations against a copy of production data with sensitive
    information handled appropriately.
-   Prepare a rollback procedure.
-   Do not delete or overwrite existing Auth users without an approved
    migration plan.
-   Do not reset the production database to make authentication testing
    easier.

Every migration should be: - Versioned. - Idempotent where practical. -
Reviewed before execution. - Tested on a non-production environment. -
Documented with preconditions and rollback limitations.

If a migration is not safely reversible, state that clearly and require
explicit owner approval.

## 14. Security testing and acceptance criteria

Claude should produce a test plan and, where possible, automated tests.
Manual tests should be documented with expected results.

### 14.1 Identity and role tests

-   [ ] Owner signs in with the owner's own identity.
-   [ ] Father signs in with his own identity.
-   [ ] Mother signs in with her own identity.
-   [ ] Father and mother do not share credentials or user IDs.
-   [ ] Each account is associated with the correct profile.
-   [ ] A manager cannot change their role to owner.
-   [ ] A manager cannot modify another user's role or active status.
-   [ ] A disabled manager is denied access to protected business data.

### 14.2 PIN tests

-   [ ] Each parent can enroll a personal PIN on their own device.
-   [ ] Correct PIN unlocks only the already authenticated local
    session.
-   [ ] Incorrect PIN does not unlock the application.
-   [ ] Repeated incorrect attempts trigger the agreed
    rate-limit/lockout behavior.
-   [ ] PINs are not stored or transmitted in plaintext.
-   [ ] PIN reset requires the approved recovery process.
-   [ ] A PIN alone cannot establish a new Supabase identity or bypass
    an expired session.
-   [ ] Clearing browser data results in a safe reauthentication flow.

### 14.3 Database and RLS tests

-   [ ] Anonymous users cannot read or modify protected business data.
-   [ ] Authenticated but unregistered users cannot access the business.
-   [ ] Active managers can perform the approved ordinary business
    operations.
-   [ ] Managers cannot access owner-only administrative operations.
-   [ ] Managers cannot self-promote by modifying profile data or
    request payloads.
-   [ ] Direct API requests are subject to the same authorization rules
    as the UI.
-   [ ] No privileged service-role secret is exposed in frontend assets
    or repository history.
-   [ ] Views, RPCs, functions, and storage policies do not bypass
    intended controls.

### 14.4 Device and session tests

-   [ ] Father's phone has an independent session.
-   [ ] Mother's phone has an independent session.
-   [ ] Home PC uses the owner's identity.
-   [ ] Logging out one device has the documented effect and does not
    unexpectedly disrupt other devices.
-   [ ] Revoking a device prevents further protected access according to
    the documented revocation guarantee.
-   [ ] Expired sessions require reauthentication.
-   [ ] A lost-device recovery scenario is tested.

### 14.5 Business integrity tests

-   [ ] Existing inventory and transaction records remain intact.
-   [ ] Existing financial calculations remain unchanged unless
    separately approved.
-   [ ] Two devices can perform independent operations without silent
    data loss.
-   [ ] Duplicate network retries do not create duplicate financial
    transactions.
-   [ ] Conflict detection works under simultaneous edits.
-   [ ] Audit entries identify the correct authenticated actor.
-   [ ] Backup restoration is tested.

A test is not passed merely because the UI hides a button. Where
applicable, test the database/API directly under each identity.

## 15. Deployment and rollout strategy

Use a staged rollout.

### Stage A --- Discovery only

-   Inspect repository and current Supabase integration.
-   Identify existing authentication changes.
-   Inventory tables, RLS policies, functions, and secrets exposure.
-   Produce a gap analysis.
-   Make no code or database changes.

### Stage B --- Design approval

-   Present the recommended architecture.
-   Identify unresolved decisions.
-   List required schema and code changes.
-   Explain risks, compatibility issues, and rollback limitations.
-   Wait for owner approval.

### Stage C --- Staging implementation

-   Implement only approved changes in a development branch and
    non-production Supabase project.
-   Test with separate owner, father, and mother identities.
-   Test all three device types.
-   Verify existing business workflows and data behavior.

### Stage D --- Production preparation

-   Back up production data.
-   Review SQL migrations and deployment steps.
-   Confirm account recovery and owner access.
-   Confirm rollback plan.
-   Obtain explicit owner approval.

### Stage E --- Production rollout

-   Apply the approved migrations.
-   Enroll the parents on their own phones.
-   Verify owner access on the home PC.
-   Run the acceptance tests.
-   Monitor errors, synchronization, and access-denied events.

## 16. Required output from Claude

**Do not implement the proposal in the first response.** First inspect
the repository and return an assessment.

The assessment should contain:

1.  **Current-state summary** --- what authentication, authorization,
    PIN, device, and database mechanisms already exist.
2.  **Evidence** --- exact file paths, function names, SQL migration
    names, and relevant code locations.
3.  **Verified security gaps** --- distinguish confirmed vulnerabilities
    from possible risks and unknowns.
4.  **Existing work to preserve** --- identify Claude's previous
    authentication/security implementation and whether it is sound.
5.  **Architecture recommendation** --- accept, modify, or reject each
    major proposal in this document, with reasons.
6.  **Schema and RLS assessment** --- table-by-table inventory and
    recommended policy changes.
7.  **PIN feasibility assessment** --- explain exactly what can and
    cannot be secured in the current browser architecture.
8.  **Session and device assessment** --- identify actual Supabase
    behavior and any limitations around individual device revocation.
9.  **Synchronization assessment** --- determine whether the current
    JSONB write strategy is safe for concurrent use by three devices.
10. **Migration plan** --- ordered, minimal changes with backups,
    staging, and rollback considerations.
11. **Test plan** --- concrete tests for owner, both managers, anonymous
    users, and direct database/API access.
12. **Open questions** --- only questions that genuinely require the
    owner's decision.

For every recommendation, label it as one of:

-   **Required:** necessary to meet a security requirement.
-   **Recommended:** materially improves security or reliability.
-   **Optional:** useful but not required for the initial release.
-   **Not recommended:** explain the risk or unnecessary complexity.

Do not claim a security issue is fixed unless the relevant
implementation and enforcement have been verified.

## 17. Implementation boundaries and non-negotiable cautions

Until the owner approves a separate implementation plan:

-   Do not edit production code.
-   Do not execute SQL against the production Supabase project.
-   Do not delete, recreate, or reset Auth users.
-   Do not alter or delete business data.
-   Do not rotate credentials without coordinating the change and
    updating the deployment configuration.
-   Do not add service-role keys to frontend files, GitHub Actions
    artifacts, or the repository.
-   Do not replace the existing authentication implementation before
    understanding it.
-   Do not introduce a frontend-only PIN check and call the application
    secure.
-   Do not assume RLS is correct merely because it is enabled.
-   Do not assume that all users should receive unrestricted access to
    administrative/security functions.
-   Do not rewrite the JSONB architecture without a separate
    evidence-based migration proposal.
-   Do not change business calculations, transaction semantics, or
    historical records as collateral work.
-   Do not invent Supabase capabilities. Verify them against the
    project's actual configuration and current official documentation.

If repository access or Supabase access is unavailable, state exactly
what cannot be verified and continue only with a clearly labeled static
assessment.

## 18. Questions Claude should resolve

Claude should answer these from repository evidence where possible, and
ask the owner only when necessary:

1.  Has Supabase email authentication already been implemented? If so,
    how?
2.  Are there existing owner, staff, or role checks? Where are they
    enforced?
3.  Are RLS policies enabled on every exposed business table?
4.  Is the application state stored in one JSONB row, multiple rows, or
    a combination?
5.  Does the current save mechanism prevent lost updates across devices?
6.  Are PINs or passkeys already implemented? If so, are they merely
    frontend checks?
7.  What session storage and refresh behavior does the current Supabase
    client use?
8.  Can the existing setup revoke one device's access independently?
9.  Which current features should remain owner-only?
10. What is the least disruptive secure enrollment method for the
    parents?

## 19. Final design principle

The target is not maximum complexity. The target is an application that
is secure enough for real family business records while remaining simple
for the people who use it every day.

The parents should experience a straightforward routine:

**Open Tindahan Tracker → enter personal PIN → manage the store.**

Behind that simple experience, the system should enforce individual
identity, database authorization, session validity, device recovery,
audit attribution, and safe multi-device writes.

Claude's job at this stage is to assess whether this design is
appropriate for the actual codebase, identify what must change, and
propose the smallest safe implementation. The project owner makes the
final decision.
