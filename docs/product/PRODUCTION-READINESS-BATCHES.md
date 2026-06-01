# Production Readiness Batch Plan

Current short-form tracker: [CURRENT-WORK.md](CURRENT-WORK.md).

This plan turns the remaining large batches into executable work. Batch 1
session hardening and Batch 3 tenant UX V2 are already complete. The remaining
work should be shipped as small vertical slices with tests and operational
checks, not as one broad rewrite.

## Execution Rules

- Preserve tenant isolation first. Every API/database task must state how
  tenant context is resolved and tested.
- Keep browser auth cookie-first. Frontend code must not store JWTs in
  `localStorage`.
- Prefer shared components and shared API helpers over per-app copies.
- Every UI change needs loading, empty, error, and mobile states.
- Every production-facing change must run `pnpm run check:contracts`,
  focused tests, and the relevant portal E2E smoke.
- Do not add new fake operational metrics. Use real API data, hide the metric,
  or explicitly mark it as unavailable.

## Batch 2: UI Foundation And Consistency

Goal: make the three portals feel like one product and reduce future UI churn.

Scope:

- Define shared operational primitives in `@repo/ui`: loading state, empty
  state, status indicators, page header, metric tile, toolbar.
- Replace duplicated table loading/empty states in admin, student, and super
  portal screens.
- Normalize page padding, table density, filter controls, dialogs, and action
  buttons.
- Add mobile viewport checks to smoke tests for auth-protected primary routes.

Acceptance:

- New feature pages can compose existing shared primitives without copying
  markup.
- Main route groups in all portals have consistent loading and empty states.
- No hardcoded display strings; `vi.json` and `en.json` stay synchronized.

## Batch 6 + 10: API, Tenant Boundary, And Security Lockdown

Goal: prevent API contract drift and cross-tenant/security regressions.

Scope:

- Expand `scripts/check-api-contracts.js` with Swagger/decorator checks where
  false positives are low.
- Add a tenant-scope audit for Prisma access. Start advisory, then turn strict
  once allowlists are reviewed.
- Add auth/security contract tests for role mismatch, tenant mismatch, refresh
  failure, CSRF failure, and sensitive audit-log events.
- Review all browser API clients for shared `createApiClient` usage.
- Review CSP, CORS, CSRF exemptions, cookie attributes, and rate limits.

Acceptance:

- `pnpm run check:contracts` fails on missing proxy, deprecated middleware,
  unsafe auth token storage, missing API wrapper infrastructure, and missing
  production readiness controls.
- Tenant scoped APIs have explicit cross-tenant deny tests.
- Sensitive mutations have audit logs or documented exceptions.

## Batch 7 + 8: Observability, Release, And Deploy Readiness

Goal: make production incidents diagnosable and deploys repeatable.

Scope:

- Add frontend request-id correlation for user-visible errors.
- Surface auth failure, refresh failure, tenant mismatch, and CSRF failure
  metrics.
- Add post-deploy smoke checks for all three portals and the API readiness
  endpoint.
- Add production env preflight for CORS origins, cookie domain, Google client
  IDs, API URL, Redis, and JWT secrets.
- Update release docs with the exact command sequence and rollback criteria.

Acceptance:

- Operators can trace a user report from portal error to API request logs.
- Production deploy fails early on unsafe or incomplete env configuration.
- Release docs include rollback steps for API, web apps, and migrations.

## Batch 4 + 5: Admin And Student Workflow Completion

Goal: make the existing product workflows complete enough for daily use.

Admin scope:

- Course/program/level builder polish: publish readiness, missing-content
  warnings, and quick navigation.
- Practice/exam authoring polish: shared question editor, preview, publish
  gates, audio prompt clarity.
- Student/cohort management polish: bulk action feedback, filters, enrollment
  review, and audit visibility.
- Reports polish: saved filters, export states, breadcrumb drill-down.

Student scope:

- Dashboard action flow: continue lesson, daily SRS, weak skills, next best
  item.
- Course detail polish: unit progress, lesson states, resume points.
- Practice/exam/review polish: attempt status, feedback readability, mobile
  layout.
- Vocabulary/SRS and roleplay polish: due/overdue states, recent attempts, and
  feedback history.

Acceptance:

- Each primary workflow has one deterministic E2E smoke.
- Student and admin empty states tell the user what action to take next.
- Mobile practice/exam/review routes remain readable.

## Batch 9 + 11 + 12: Data Integrity, Scale, And Test Strategy

Goal: keep the system reliable as data volume and feature count grow.

Scope:

- Add database integrity scripts for tenant relations, orphan records, soft
  delete consistency, and enrollment/progress consistency.
- Review indexes for high-traffic report, activity, attempt, and notification
  queries.
- Move large admin lists to server-side pagination where still client-side.
- Add query timing tests or budget checks for reporting services.
- Split tests into fast unit, API integration, portal smoke, and full E2E.
- Add shared Playwright fixtures for auth, tenant data, and API mocks.

Acceptance:

- Large lists do not fetch unbounded data.
- Integrity scripts can run read-only in staging before release.
- CI has a fast gate and a full release gate with clear failure ownership.

## Batch 13 + 14: Super Portal Operations And Maintainability

Goal: make the platform manageable by operators and maintainable by engineers.

Scope:

- Tenant detail V3: real usage counts, health summary, activity timeline,
  config readiness, and audit log viewer.
- Super portal incident view: API health, tenant traffic, alert summary, and
  recent auth/security failures.
- Architecture documentation refresh: auth, tenant resolution, release flow,
  and data model boundaries.
- Refactor repeated hooks/forms/tables into shared package patterns when there
  is proven duplication.
- Add ADRs for cookie auth, tenant isolation, and reporting/SRS architecture.

Acceptance:

- Operators can inspect a tenant without direct DB access.
- New contributors can follow docs to add a feature without copying legacy
  patterns.
- Shared abstractions are used by at least two apps or two feature areas.

## Current Slice Started

This slice implements the first production-readiness pass for Batch 2, Batch
6, Batch 8, and Batch 14:

- Add shared `EmptyState`, `LoadingState`, and `ErrorState` primitives in
  `@repo/ui`.
- Apply shared operational states to super portal tenant list, admin students,
  admin skills, admin cohorts, and student course catalog.
- Add `scripts/check-production-readiness.js`.
- Add advisory `scripts/check-tenant-scope.js` with documented allowlist for
  intentional super-admin global telemetry.
- Add `scripts/check-production-env.js` for production env preflight without
  printing secret values.
- Add `pnpm run check:production`, `pnpm run check:tenant-scope`, and
  `pnpm run check:production-env`; wire production and tenant checks into
  `pnpm run check:contracts`.
- Add contract checks into `pnpm run release:check`.

Next recommended slice:

1. Continue converting admin practice/exam/report table states to `@repo/ui`
   primitives.
2. Add strict cross-tenant API tests around high-risk student, course,
   enrollment, exam, and practice endpoints.
3. Add post-deploy smoke scripts for API readiness plus all three portal login
   routes.
4. Add read-only data integrity checks for orphan progress, enrollment, and
   tenant relation consistency.

## Batch 15: Current Feature Completion Mega Batch

Goal: close the current production gaps discovered during CI, student SRS/AI
usage, and Super Portal operations review without starting unrelated product
areas.

Scope:

- CI closure: remove type inference drift in platform usage aggregation and
  make E2E jobs build workspace packages required by Next.js proxy/runtime
  imports.
- Student SRS/AI reliability: validate bulk flashcard counts server-side,
  tolerate provider JSON shape variance where safe, avoid raw 500s for bulk AI
  generation, and keep large custom-card lists bounded in the UI and API.
- Student dashboard list limits: cap dashboard queues, feedback, and course
  snapshots to recent/actionable items so the first screen stays bounded.
- Super Portal information architecture: split global system overview and
  partner/tenant management into separate routes instead of sharing the same
  dashboard surface.
- Super Portal data provenance: label operational metrics by source so
  operators can distinguish persisted database counts, live runtime telemetry,
  in-memory per-instance request metrics, and derived alerts.
- Operational documentation: record the completed mega batch and keep the next
  production-readiness work anchored to real data, tenant isolation, and CI
  repeatability.

Acceptance:

- CI no longer fails on `AdminPlatformService.getUsage` implicit `any` or
  Playwright web-server module resolution for `@repo/shared`.
- `/` in Super Portal is only the system overview, while `/tenants` is the
  partner/tenant management surface.
- Super Portal metrics are either real, explicitly source-labeled, or hidden.
  No new fake operational metric is introduced.
- Bulk AI flashcards fail with actionable API errors instead of generic
  internal server errors where the provider/config is the cause.
- `pnpm lint`, `pnpm run typecheck`, `pnpm run test`, and the full build pass
  before handoff.

Implemented in this batch:

- Added typed platform usage aggregation rows for tenant/media/ledger data.
- Added CI E2E dependency build step for `@repo/shared` and `@repo/api-client`.
- Split Super Portal tenant management into `/tenants`.
- Added Super Portal data-source badges for database, runtime, in-memory, and
  derived telemetry.
- Hardened student bulk flashcard generation and custom-card list rendering.

## Latest Completed Slice

- Split the public course sales experience out of `web-student` into the new
  `web-sales` app on port `3103`.
- Added unauthenticated public catalog API routes for published tenant courses:
  `GET /api/public/courses` and `GET /api/public/courses/:id`.
- Kept tenant isolation on public catalog reads through `TenantMiddleware` and
  restricted responses to marketing-safe course/unit/lesson preview fields.
- Replaced the student guest home with a short login-first entry screen linking
  to login, activation, and the new sales catalog.
- Wired `web-sales` into build, dev, Docker, production compose, i18n checks,
  production readiness checks, CORS defaults, docs, and E2E smoke.

## Previous Completed Slice

- Replaced PowerShell-only port cleanup in the root E2E flow with a
  cross-platform Node script while keeping the existing PowerShell helper for
  Windows fallback.
- Removed native browser prompts from the admin rich text editor. Link, image,
  and table insertion now use the shared dialog/input/button primitives with
  synchronized English and Vietnamese strings.
- Added `pnpm run check:data-integrity`, a read-only Prisma integrity check for
  tenant-scoped enrollment, progress, learning activity, practice, and exam
  relationships.
- Extended production readiness checks so the release contract fails if the
  cross-platform port cleanup or data integrity script is missing.
- Verified the root `pnpm run test:e2e` flow now runs through all three portals
  from Linux.
