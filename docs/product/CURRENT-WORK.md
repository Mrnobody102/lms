# Current Work

Last updated: 2026-06-01

## At A Glance

| Item                           | Status | Progress            | Notes                                                |
| ------------------------------ | ------ | ------------------- | ---------------------------------------------------- |
| Batch 15: production readiness | Done   | `[##########] 100%` | Merged and pushed                                    |
| Docs cleanup                   | Done   | `[##########] 100%` | Active product docs reduced to 3 files               |
| Batch 16: contract hardening   | Next   | `[----------] 0%`   | Tenant tests, shared states, smoke checks            |
| Product readiness              | Active | `[#######---] 70%`  | Keep improving isolation, CI, metrics, bounded lists |

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

## Next Batch

Batch 16 theme: contract hardening and workflow polish.

| Order | Work                     | Target                                                                 |
| ----- | ------------------------ | ---------------------------------------------------------------------- |
| 1     | Cross-tenant deny tests  | Student, course, enrollment, practice, exam APIs                       |
| 2     | Shared UI states         | Admin practice, exam, report screens use `@repo/ui` primitives         |
| 3     | Post-deploy smoke checks | API readiness and portal login routes                                  |
| 4     | Data integrity checks    | Orphan progress, enrollment, tenant relations, soft-delete consistency |
| 5     | Bounded list audit       | Pagination or capped rendering for remaining large lists               |

Done means:

- Tenant-scoped reads/writes have explicit tenant context and focused tests.
- UI text is synced in `vi.json` and `en.json`.
- No new `any`, typing lint disables, or fake operational metrics.
- `pnpm run check:contracts`, focused tests, and relevant smoke/build checks pass.

## Roadmap Dashboard

| Priority | Focus                    | Progress           | Next output                                            |
| -------- | ------------------------ | ------------------ | ------------------------------------------------------ |
| P0       | Foundation hardening     | `[########--] 80%` | Production env, release, CI gates stay green           |
| P1       | Tenant/security boundary | `[######----] 60%` | Cross-tenant deny tests and audit coverage             |
| P2       | Admin/student workflows  | `[#######---] 70%` | Daily-use flows with deterministic smoke tests         |
| P3       | Operations visibility    | `[#####-----] 50%` | Tenant health, real usage, alerts, request correlation |
| P4       | Scale/data integrity     | `[####------] 40%` | Bounded lists, integrity checks, index review          |
| P5       | Shared maintainability   | `[#####-----] 50%` | Shared primitives after duplication is proven          |

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
