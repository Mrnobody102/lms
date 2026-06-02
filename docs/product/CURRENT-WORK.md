# Current Work

Last updated: 2026-06-01

## At A Glance

| Item                                | Status  | Progress            | Notes                                                        |
| ----------------------------------- | ------- | ------------------- | ------------------------------------------------------------ |
| Batch 15: production readiness      | Done    | `[##########] 100%` | Merged and pushed                                            |
| Docs cleanup                        | Done    | `[##########] 100%` | Active product docs reduced to 3 files                       |
| Mega Batch 16: production hardening | Active  | `[#####-----] 50%`  | API caps/tests, CI gates, integrity checks, UI states, smoke |
| Product readiness                   | Active  | `[########--] 75%`  | Keep improving isolation, CI, metrics, bounded lists         |
| Mobile Student App                  | Planned | `[----------] 0%`   | P11 planned; `apps/mobile-student` not scaffolded yet        |

## What Just Shipped

Batch 15 closed the immediate production-readiness gaps:

| Area              | Result                                                            |
| ----------------- | ----------------------------------------------------------------- |
| CI                | E2E jobs build workspace runtime packages first                   |
| API usage metrics | Tenant/media/ledger aggregation is typed                          |
| AI/SRS            | Bulk flashcards validate count and handle provider shape variance |
| Student UI        | Dashboard and custom-card lists are bounded                       |
| Super Portal      | `/` is system overview; `/tenants` is tenant management           |
| Operations        | Metrics are real or source-labeled                                |
| TypeScript        | Removed API bootstrap `as any`; shared AI count constants         |

Validated with:

```bash
pnpm lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## Active Mega Batch

Mega Batch 16 theme: production contracts and workflow readiness.

| Status | Work                         | Output                                                                                         |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Done   | Baseline gate                | `check:contracts`, `lint`, `typecheck`, `api-server test` passed before edits                  |
| Done   | Cross-tenant deny tests      | Practice/exam deny tests prevent attempt creation/submission when course access is denied      |
| Done   | Bounded list enforcement     | Practice/exam attempt history and notifications are capped at service boundary                 |
| Done   | Data integrity checks        | Added read-only checks for course activities, activity progress, notifications, media, risk    |
| Done   | CI/release smoke checks      | CI fast checks run `check:contracts`; API smoke runs database build + `check:data-integrity`   |
| Done   | Portal smoke coverage        | Student/admin/super portal smoke now asserts login/readiness paths with deterministic mocks    |
| Done   | Shared operational UI states | Student exams, admin risk report, and Super Portal ops use shared loading/empty/error states   |
| Next   | Remaining workflow polish    | Admin practice/exams reports, student practice/review/dashboard, super portal tenant detail    |
| Next   | Broader tenant deny coverage | Enrollment/cohort/admin-report/SRS/media HTTP or service tests where risk remains demonstrable |

Done means:

- Tenant-scoped reads/writes have explicit tenant context and focused tests.
- UI text is synced in `vi.json` and `en.json`.
- No new `any`, typing lint disables, or fake operational metrics.
- `pnpm run check:contracts`, focused tests, and relevant smoke/build checks pass.

Latest focused validation:

```bash
pnpm run check:contracts
pnpm lint
pnpm run typecheck
pnpm --filter api-server test
pnpm --filter api-server test -- src/practice/practice.service.spec.ts src/exam/exam.service.spec.ts src/notification/notification.service.spec.ts src/notification/notification.controller.spec.ts
pnpm --filter web-student typecheck
pnpm --filter web-admin typecheck
pnpm --filter super-portal typecheck
pnpm --filter web-admin exec playwright test e2e/smoke.spec.ts --project=chromium --workers=1
pnpm --filter web-student exec playwright test e2e/example.spec.ts --project=chromium --workers=1
pnpm --filter super-portal exec playwright test e2e/smoke.spec.ts --project=chromium --workers=1
pnpm run check:data-integrity
pnpm run test
pnpm run build
```

## Mega Batch Queue

| Batch | Theme                                         | Outcome                                                                                                        |
| ----- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 16    | Production contracts + workflow readiness     | Tenant/security regressions are hard to reintroduce; critical admin/student flows are bounded and smoke-tested |
| 17    | Operations, release + scale readiness         | Operators can diagnose issues; release gates, data integrity, list scale, and reporting volume are controlled  |
| 18    | AI-native governance + adaptive learning      | Role-aware AI has quota, audit, prompt/version governance, provider reliability, and adaptive learning signals |
| 19    | Mobile Student App MVP + native learning loop | Expo app scaffold, mobile auth adapter, dashboard/course/SRS/practice loop, offline-lite foundation            |

## Roadmap Dashboard

| Priority | Focus                    | Progress           | Next output                                              |
| -------- | ------------------------ | ------------------ | -------------------------------------------------------- |
| P0       | Foundation hardening     | `[########--] 80%` | Production env, release, CI gates stay green             |
| P1       | Tenant/security boundary | `[#######---] 70%` | More cross-tenant deny tests and audit coverage          |
| P2       | Admin/student workflows  | `[########--] 80%` | More workflow polish and negative cases                  |
| P3       | Operations visibility    | `[#####-----] 50%` | Tenant health, real usage, alerts, request correlation   |
| P4       | Scale/data integrity     | `[#####-----] 50%` | Bounded lists, integrity checks, index review            |
| P5       | Shared maintainability   | `[#####-----] 50%` | Shared primitives after duplication is proven            |
| P6       | Mobile student app       | `[----------] 0%`  | Scaffold native app after API/client foundation is ready |

## Quality Rules

| Rule                         | Current state                          |
| ---------------------------- | -------------------------------------- |
| Explicit `any` in app source | Cleared by lint                        |
| i18n for touched UI          | Sync both locales                      |
| Operational metrics          | Real, source-labeled, or hidden        |
| Large lists                  | Server pagination or bounded rendering |
| Super-admin global queries   | Intentional and documented             |

## Docs Model

| File                                                 | Purpose                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- |
| [CURRENT-WORK.md](CURRENT-WORK.md)                   | Current batch, next batch, checklist, recent validation |
| [PLAN.md](PLAN.md)                                   | Durable product roadmap and phase status                |
| [AI-NATIVE-LMS-ROADMAP.md](AI-NATIVE-LMS-ROADMAP.md) | Long-term AI product direction                          |

Docs rules:

- Keep short-lived batch status here.
- Merge durable decisions into `PLAN.md`, `AGENTS.md`, or `SOP.md`.
- Delete stale planning notes after useful decisions are merged; git history is the archive.
- Promote repeated rules into scripts/checks when possible.

## Handoff Checklist

- [ ] Confirm `git status --short`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm run typecheck`.
- [ ] Run focused tests; use `pnpm run test` for shared/backend changes.
- [ ] Run `pnpm run build` when CI, routing, package boundaries, or Next.js apps change.
- [ ] Update both locales for UI text.
- [ ] Update this file when batch status or next scope changes.
