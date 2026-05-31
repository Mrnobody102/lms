# Production Hardening Audit

Last updated: 2026-05-31

## Baseline

- Branch: `main`
- Baseline commit before this batch: `d4b01cf feat: improve lesson authoring and student exam flows`
- Planned validation gate:
  - `pnpm lint`
  - `pnpm run typecheck`
  - `pnpm test`
  - `pnpm run check:contracts`
  - `pnpm run check:data-integrity`
  - focused portal E2E when local services are available

## Current Gate Results

- `pnpm lint`: passed.
- `pnpm run typecheck`: passed.
- `pnpm test`: passed.
- `pnpm run check:contracts`: passed.
- `pnpm run check:data-integrity`: passed after fixing the script to load the workspace database package and root `.env`.
- `pnpm --filter super-portal test:e2e`: passed on Chromium.
- `pnpm test:e2e`: blocked in `web-student` before reaching later portals; see `AUDIT-007` and `AUDIT-008`.

## Domain Inventory

| Domain          | Primary apps/modules                                                 | Current implementation notes                                                                                                                                |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth / tenant   | `auth`, `TenantMiddleware`, portal auth stores                       | Cookie-based browser auth is established. Super portal uses in-app login. Tenant hints are guarded for production.                                          |
| Course / lesson | `course`, `lesson`, admin course editor, student course/lesson pages | Course unit/lesson authoring exists with multiple lesson types and student viewing. Needs continued edge-case checks around linked resources and readiness. |
| Practice        | `practice`, admin practice manager, student practice pages           | Practice sets/questions, AI review, attempts, audio prompt support exist. Recent UI now exposes set question editing.                                       |
| Exam            | `exam`, admin exam manager, student exam pages                       | Exam templates and attempts exist. Student list is now grouped by course. Needs expiry/review/security regression coverage.                                 |
| SRS             | `srs`, student dashboard/review surfaces                             | Review cards and due summaries exist. Needs focused audit for source snapshots and due state edge cases.                                                    |
| Roleplay        | `roleplay`, admin scenario manager, student roleplay pages           | Text/audio roleplay exists. Needs provider-stability, microphone fallback, and feedback history review.                                                     |
| Reporting       | `admin-reports`, admin reports pages                                 | Risk/cohort/program/course reports exist. Needs saved filter/export edge-state review.                                                                      |
| Media / usage   | `media`, `UsageLedger`, storage quota logic                          | Upload quota and ledger records exist. Super portal should use this data instead of demos.                                                                  |
| Billing         | `admin-billing`, billing Prisma models                               | Tenant billing config and overview exist per tenant. Super portal lacks platform-wide real billing views.                                                   |
| Super Portal    | `apps/super-portal`, `admin/tenants`, `admin/system`                 | Tenant CRUD and telemetry are real; ops pages still contain demo-derived rows and need real platform APIs.                                                  |

## Findings

| ID        | Severity | Finding                                                                                                                         | Impact                                                                          | Fix plan                                                                                                                         | Test requirement                                                                                     |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| AUDIT-001 | High     | Super portal ops pages derive billing, usage, domain, feature flag, incident, and audit rows in frontend demo code.             | Operators can see fabricated operational data, which is unsafe for production.  | Add Super Admin platform APIs backed by Prisma/metrics and replace demo page content with API data and empty/unavailable states. | Super portal E2E for billing, usage, feature flags, audit logs. API tests for Super Admin access.    |
| AUDIT-002 | High     | Tenant detail page only edits JSON settings and does not show real usage/subscription/audit timeline.                           | Super admins still need DB access to inspect tenant health.                     | Add `GET /admin/tenants/:id/overview` with counts, subscription, media usage, recent audit logs, and readiness.                  | Service tests verify tenant-scoped aggregate counts.                                                 |
| AUDIT-003 | High     | Sensitive platform mutations do not yet have dedicated audit actions.                                                           | Platform configuration changes are hard to trace.                               | Add platform audit actions and log tenant create/update/status, feature flag, subscription/quota changes.                        | Unit tests assert audit log call for mutations.                                                      |
| AUDIT-004 | Medium   | Feature flags are stored in inconsistent settings namespaces (`features` versus intended `featureFlags`).                       | Frontend and backend can drift when flags expand.                               | Normalize reads from both keys and persist updates under `settings.featureFlags`.                                                | Tests verify backward-compatible read and canonical write.                                           |
| AUDIT-005 | Medium   | Course/lesson/practice/exam flows have limited regression coverage for duplicate/reorder/expired-attempt/linked-resource cases. | Small UI/API edits can reintroduce workflow bugs.                               | Add focused API/unit/E2E tests in PR3 after platform APIs land.                                                                  | New tests for duplicate lessons, missing linked resources, answer visibility, expired exam attempts. |
| AUDIT-006 | Medium   | Release gate does not yet assert Super Portal real-data operations.                                                             | Demo regressions can reappear without failing CI.                               | Extend E2E and production checks to catch demo markers/fabricated ops rows.                                                      | `pnpm test:e2e` plus static check or E2E assertion.                                                  |
| AUDIT-007 | Medium   | `web-student` dashboard E2E expects heading `What to do next`, but `/en` renders the unauthenticated portal entry after login.  | Full E2E gate stops before admin and super portal suites run.                   | Audit the student auth refresh/home routing contract, then update product behavior or stale E2E expectation.                     | `pnpm --filter web-student test:e2e -- --project=chromium`.                                          |
| AUDIT-008 | Medium   | `web-student` roleplay E2E cannot submit text because the session submit button becomes detached/disabled after input fill.     | Roleplay regression may be hidden behind an unstable test or disabled UX state. | Review roleplay session state transitions, message input enablement, and mock route timing.                                      | Roleplay E2E passes without force-clicking or bypassing disabled state.                              |

## Remediation Order

1. Replace Super Portal demo operational data with real APIs and hooks.
2. Add tenant overview and platform audit logging.
3. Harden product flows only where verified edge cases or duplication are found.
4. Extend E2E/release gates and docs after behavior is stable.
