# Current Work

Last updated: 2026-06-09

## At A Glance

| Item                                 | Status  | Progress            | Notes                                                                                                  |
| ------------------------------------ | ------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| Batch 15: production readiness       | Done    | `[##########] 100%` | Merged and pushed                                                                                      |
| Docs cleanup                         | Done    | `[##########] 100%` | Active product docs reduced to 3 files                                                                 |
| Mega Batch 16: production hardening  | Done    | `[##########] 100%` | Closed with SRS/custom-card polish and Super Portal ops list hardening                                 |
| Mega Batch 17: ops + scale readiness | Done    | `[##########] 100%` | Code tracks closed with ops artifacts, hot-path API resilience, and validation evidence                |
| Mega Batch 18: AI-native governance  | Active  | `[###-------] 30%`  | Batch 18A foundation implemented: tenant/user AI quota, ledger, audit, and Super Portal usage view     |
| Product readiness                    | Active  | `[########--] 80%`  | App contracts and repo-side ops gates are strong; staging evidence remains an external deployment task |
| Mobile Student App                   | Planned | `[----------] 0%`   | P11 planned; `apps/mobile-student` not scaffolded yet                                                  |

## Previous Ship

Batch 16 closed the production contract and workflow readiness gaps:

| Area             | Result                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| API contracts    | Contract, tenant-scope, i18n, production readiness checks stayed green  |
| SRS/custom cards | Deck/course/category organization and Quizlet-style review flow shipped |
| Student review   | Fixed card skip behavior by using a stable local session queue          |
| Super Portal     | Ops data tables gained search, page-size controls, and pagination       |
| Portal smoke     | Student and Super Portal smoke checks passed before push                |

Validated with:

```bash
pnpm lint
pnpm run typecheck
pnpm run test
pnpm --filter web-student exec playwright test e2e/example.spec.ts --project=chromium --workers=1
pnpm --filter super-portal exec playwright test e2e/smoke.spec.ts --project=chromium --workers=1
```

## Recent Ship

Mega Batch 17 closed the repository-side operations, release, and scale readiness tracks.

| Area              | Result                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Edge/env/ops      | Reverse proxy, production env, observability, backup/restore, retention, security, and load artifacts   |
| API hot path      | Tenant resolution and JWT validation gained short-lived in-process caches with explicit invalidation    |
| Redis resilience  | Response cache now treats Redis stalls/outages as fast cache misses instead of blocking public requests |
| Student dashboard | Course continuation queries run in parallel against the access-scoped course relation                   |

Latest validation:

```bash
pnpm --filter api-server typecheck
pnpm --filter api-server build
pnpm --filter api-server test -- src/common/cache/resilient-cache.factory.spec.ts src/auth/strategies/jwt.strategy.spec.ts src/common/middleware/tenant.middleware.spec.ts src/common/utils/tenant-request.util.spec.ts
pnpm lint
pnpm --filter api-server test
pnpm run typecheck
pnpm run test
pnpm --filter web-student build
```

Manual Redis outage check on 2026-06-09:

| Scenario                                      | Result             |
| --------------------------------------------- | ------------------ |
| Redis down, `/api/public/courses` first call  | HTTP 200 in 1.523s |
| Redis down, `/api/public/courses` repeat call | HTTP 200 in 0.452s |
| Redis down, `/api/health/ready`               | HTTP 503 in 0.792s |
| Redis restored, catalog repeat call           | HTTP 200 in 0.009s |
| Redis restored, `/api/health/ready`           | HTTP 200 in 0.710s |

## Active Mega Batch

Mega Batch 18 theme: AI-native governance and adaptive learning.

Batch 18 should make AI behavior operationally safe and product-useful before expanding more AI-native learning features. The batch should prioritize quota enforcement, auditability, provider fallback/retry behavior, prompt/version governance, and adaptive learning signals that can be explained to admins and learners.

| Status | Work                         | Output                                                                                  |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| Done   | AI governance foundation     | Tenant feature flag, provider readiness, user daily quota, subscription quota, ledger   |
| Done   | AI audit and prompt lineage  | Prompt/version metadata, generation draft audit actions, quota/provider failure audit   |
| Done   | Platform AI usage visibility | Super Portal API and AI settings usage table with quota/configuration state             |
| Next   | Provider reliability         | Retry/fallback policy, timeout budgets, health signals, and deterministic failure modes |
| Next   | Adaptive learning signals    | Explainable mastery inputs and recommendations grounded in learner activity             |

Done means:

- AI requests are tenant-scoped, quota-bounded, auditable, and covered by focused tests.
- Prompt/provider changes are versioned and observable.
- User-facing AI output has deterministic fallback states.
- Admin and learner UI text is synced in `vi.json` and `en.json`.
- `pnpm lint`, `pnpm run typecheck`, focused tests, and relevant builds pass.

Batch 18A validation:

```bash
pnpm --filter api-server exec tsc --noEmit
pnpm --filter api-server test -- src/ai/ai-governance.service.spec.ts src/practice/ai-evaluation.service.spec.ts src/practice/ai-question-generation.service.spec.ts src/admin/admin-platform.service.spec.ts
pnpm --filter super-portal typecheck
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000 pnpm --filter super-portal build
pnpm lint
pnpm run typecheck
pnpm run test
```

## Closed Mega Batch 17

Mega Batch 17 theme: operations, release, and scale readiness.

The 2026-06-04 production-scale review found that the app architecture and stack are sound for staging/early production, but the deploy/operations layer is incomplete. Batch 17 now explicitly includes the edge, secrets, observability, backup/restore, deploy pipeline, and load-test work needed before serving real production traffic at scale.

| Status   | Work                             | Output                                                                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Done     | MB16 closeout                    | Current SRS/custom-card and Super Portal ops-list changes reviewed, committed, and pushed                    |
| Done     | Production-scale plan refresh    | Batch 17 split into edge, env/secrets, CI/CD, observability, backup/restore, integrity, load tracks          |
| Done     | Platform list contracts          | Super Portal platform endpoints use server pagination/filtering with `items` + `meta`                        |
| Done     | Platform data integrity checks   | Read-only integrity checks extended for platform media, billing, usage ledger, and audit logs                |
| Done     | Edge/reverse proxy artifact      | Caddy compose service and Caddyfile route API/student/admin/sales/super portal, strip public `x-tenant-id`   |
| Done     | Production env contract          | `.env.production.example` plus production env preflight coverage for Caddy hosts, webhook, and reset secret  |
| Done     | Observability starter            | Prometheus and Alertmanager compose services use a non-empty generic webhook receiver contract               |
| Done     | Backup/restore/runbook artifacts | Backup, restore, rollback, retention, security, and load baseline docs/scripts added                         |
| External | Staging evidence                 | Provision real secrets/domains, run Caddy stack, alert webhook test, restore drill, smoke, and load baseline |

Done means:

- Tenant-scoped reads/writes have explicit tenant context and focused tests.
- UI text is synced in `vi.json` and `en.json`.
- No new `any`, typing lint disables, or fake operational metrics.
- `pnpm run check:contracts`, focused tests, and relevant smoke/build checks pass.

Latest focused validation:

```bash
git diff --check
pnpm run check:contracts
pnpm lint
pnpm run typecheck
pnpm --filter api-server test -- src/admin/admin-platform.service.spec.ts
pnpm --filter api-server test
pnpm --filter super-portal exec playwright test e2e/smoke.spec.ts --project=chromium --workers=1
pnpm run check:data-integrity
pnpm run test
pnpm run build
```

## Mega Batch Queue

| Batch | Theme                                         | Outcome                                                                                                          |
| ----- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 16    | Production contracts + workflow readiness     | Tenant/security regressions are hard to reintroduce; critical admin/student flows are bounded and smoke-tested   |
| 17    | Operations, release + scale readiness         | Operators can diagnose issues; release gates, data integrity, list scale, and reporting volume are controlled    |
| 18    | AI-native governance + adaptive learning      | Role-aware AI has quota, audit, prompt/version governance, provider reliability, and adaptive learning signals   |
| 19    | Mobile Student App MVP + native learning loop | Expo app scaffold, mobile auth adapter, dashboard/course/SRS/practice loop, offline-lite foundation              |
| 20    | High-scale platform architecture              | HA DB/cache/storage, queue partitioning, CDN/media delivery, and canary/load evidence for 100k+ to million users |

## Batch 17 Production Checklist

| Track                    | Status | Required output                                                                                                  |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Edge/reverse proxy       | Done   | Caddy topology artifact with TLS host routing, `X-Forwarded-*`, upload limit, and public `x-tenant-id` stripping |
| Env/secrets              | Done   | `.env.production.example`, preflight checks, `JWT_RESET_SECRET` parity, and no frontend-exposed secret rule      |
| CI/CD/staging            | Done   | Repo-side workflow/env validation is in place; staging deploy evidence is an external deployment task            |
| Observability            | Done   | Prometheus/Alertmanager compose config and generic webhook receiver contract                                     |
| Backup/restore           | Done   | Runbook and scripts exist; staging restore drill evidence is an external deployment task                         |
| Data integrity/retention | Done   | Read-only checks in release gate and baseline privacy/retention policy                                           |
| Performance/load         | Done   | Baseline script/docs and Redis-outage hot-path evidence exist; staging p95/p99 is an external deployment task    |
| Security/compliance      | Done   | CORS/CSRF/CSP/tenant-header/WAF stance documented and guarded by production readiness checks                     |

## Roadmap Dashboard

| Priority | Focus                    | Progress           | Next output                                               |
| -------- | ------------------------ | ------------------ | --------------------------------------------------------- |
| P0       | Foundation hardening     | `[########--] 80%` | Run staging deploy evidence with real domains and secrets |
| P1       | Tenant/security boundary | `[#######---] 70%` | More cross-tenant deny tests and audit coverage           |
| P2       | Admin/student workflows  | `[########--] 80%` | More workflow polish and negative cases                   |
| P3       | Operations visibility    | `[######----] 60%` | Tenant health, real usage, alerts, request correlation    |
| P4       | Scale/data integrity     | `[######----] 60%` | Staging p95/p99, query review, and restore/load evidence  |
| P5       | Shared maintainability   | `[#####-----] 50%` | Shared primitives after duplication is proven             |
| P6       | Mobile student app       | `[----------] 0%`  | Scaffold native app after API/client foundation is ready  |

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
