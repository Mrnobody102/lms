# Current Work

Last updated: 2026-10-26

## Review hardening — 2026-10-26

- AI quota reservations serialize per tenant in PostgreSQL and write a pending ledger entry before provider work; completion updates that entry instead of charging twice.
- Adaptive paths and SRS recheck current learning access. Instructor signals exclude personal cards and tenant-wide mastery.
- Adaptive start/resume creates an owner-scoped practice set from the selected questions; submitting an attempt completes the path atomically.
- Portal query caches and practice drafts are separated by user/tenant; dashboard SSR data carries its learner identity.
- Fixed standalone practice/exam history rendering, combined SRS filters, adaptive retry/error UI, and UTC report windows.
- Apply migration `20261026090000_adaptive_practice_sessions` before deploying the API. The full migration chain was verified on an isolated PostgreSQL test instance.
- Database regressions: set `LMS_INTEGRATION_DATABASE_URL` to an isolated local database named `lms_test`, migrate it, then run `pnpm --filter api-server test -- src/learning-regressions.integration.spec.ts`.
- Browser regressions: `pnpm --filter web-student exec playwright test e2e/adaptive-learning.spec.ts --project=chromium --workers=1`.
- Verified: contract/lint/typecheck gate, full unit suite (301 API tests plus shared/UI/client tests), 5 PostgreSQL integration scenarios, full monorepo build, and 11 Chromium smoke/regression journeys against the production student build, including a 390px mobile layout. Prisma migration diff against the migrated test database reported no differences.
- Browser smoke uses mocked API responses; PostgreSQL integration tests exercise the real services/database separately. Real-provider AI and staging deployment verification remain external checks.

## At A Glance

| Item                                 | Status | Progress            | Notes                                                                                                  |
| ------------------------------------ | ------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| Batch 15: production readiness       | Done   | `[##########] 100%` | Merged and pushed                                                                                      |
| Docs cleanup                         | Done   | `[##########] 100%` | Active product docs reduced to 3 files                                                                 |
| Mega Batch 16: production hardening  | Done   | `[##########] 100%` | Closed with SRS/custom-card polish and Super Portal ops list hardening                                 |
| Mega Batch 17: ops + scale readiness | Done   | `[##########] 100%` | Code tracks closed with ops artifacts, hot-path API resilience, and validation evidence                |
| Mega Batch 18: AI-native governance  | Done   | `[##########] 100%` | Quota/ledger/audit, provider reliability, explainable adaptive sequencing with learner and admin UI    |
| Product readiness                    | Active | `[########--] 80%`  | App contracts and repo-side ops gates are strong; staging evidence remains an external deployment task |
| Mega Batch 19: Mobile Student App    | Next   | `[----------] 0%`   | P11 planned; `apps/mobile-student` not scaffolded yet                                                  |

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

Mega Batch 19 theme: Mobile Student App MVP and native learning loop (see `PLAN.md` P11).

Batch 19 has not started. Before scaffolding `apps/mobile-student`, confirm the shared client foundation in `@repo/api-client` can take a mobile adapter (explicit base URL, bearer/session token from native secure storage, tenant resolver) without breaking the browser cookie/CSRF flow.

| Status | Work                 | Output                                                                                  |
| ------ | -------------------- | --------------------------------------------------------------------------------------- |
| Next   | Client foundation    | `@repo/api-client` adapter seam for mobile auth/tenant; browser behavior unchanged      |
| Next   | Expo scaffold        | `apps/mobile-student` with login, tenant selection, and dashboard/today                 |
| Next   | Native learning loop | Course/lesson, SRS review, practice/exam, and adaptive next steps on the same contracts |
| Next   | Mobile release ops   | Mobile smoke in CI, app config, update policy, observability baseline                   |

## Closed Mega Batch 18

Mega Batch 18 theme: AI-native governance and adaptive learning.

Batch 18 made AI behavior operationally safe and product-useful: quota enforcement, auditability, provider retry/fallback behavior, prompt/version governance, and adaptive learning signals that admins and learners can read.

| Status   | Work                         | Output                                                                                                   |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Done     | AI governance foundation     | Tenant feature flag, provider readiness, user daily quota, subscription quota, ledger                    |
| Done     | AI audit and prompt lineage  | Prompt/version metadata, generation draft audit actions, quota/provider failure audit                    |
| Done     | Platform AI usage visibility | Super Portal API and AI settings usage table with quota/configuration state                              |
| Done     | Provider reliability         | Error classification, retry with `AI_MAX_RETRIES`, timeout budget, health signal shown in Super Portal   |
| Done     | Deterministic AI fallback    | Practice AI feedback carries `source` and `fallbackReason`; learner UI shows a rule-based check badge    |
| Done     | Adaptive sequencing          | `GET /adaptive-learning/next-steps` ranks SRS due, path items, and weak skills with score breakdowns     |
| Done     | Learner adaptive UI          | Student dashboard section with ranked steps, explanations, start/skip actions, both locales              |
| Done     | Admin adaptive UI            | Student detail panel with signal summary, ranked steps, reason labels, and score breakdown tooltip       |
| External | AI provider evidence         | Run a real provider on staging to confirm quota, ledger, retry, fallback, and Super Portal health signal |

Done means:

- AI requests are tenant-scoped, quota-bounded, auditable, and covered by focused tests.
- Prompt/provider changes are versioned and observable.
- User-facing AI output has deterministic fallback states.
- Admin and learner UI text is synced in `vi.json` and `en.json`.
- `pnpm lint`, `pnpm run typecheck`, focused tests, and relevant builds pass.

Sequencing rules (see `apps/api-server/src/adaptive-learning/adaptive-sequencing.ts`):

| Step kind       | Base | Extra signals                                                                                  | Reason code                  |
| --------------- | ---- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| `REVIEW_DUE`    | 90   | +0.5 per due card (max 20)                                                                     | `srs_cards_due`              |
| `ADAPTIVE_PATH` | 50   | +priority (max 30), +mastery gap (max 20), +2 per due card in skill (max 5), +5 if in progress | `weak_skill_practice_misses` |
| `WEAK_SKILL`    | 40   | +gap below 60% mastery (max 30), +2 per due card in skill (max 5); needs 3+ attempts           | `low_skill_mastery`          |

One step per skill, at most 3 weak-skill steps, default 6 steps, deterministic tie-breaks.

Batch 18 closeout validation (2026-09-15, all green):

```bash
pnpm --filter api-server exec tsc --noEmit
pnpm --filter api-server test -- src/adaptive-learning src/practice/ai-evaluation.service.spec.ts src/practice/practice.service.spec.ts src/ai/ai-gateway.service.spec.ts
pnpm --filter web-student exec tsc --noEmit
pnpm --filter web-admin exec tsc --noEmit
pnpm run check:contracts
pnpm lint
pnpm run typecheck
TZ=UTC pnpm --filter api-server test
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000 pnpm --filter web-student build
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000 pnpm --filter web-admin build
```

Notes:

- `admin-reports.service.spec.ts` (`getActivityTrend`) is timezone-sensitive and fails on UTC+7 machines but passes with `TZ=UTC` (CI default). It predates Batch 18 and is unrelated to it.
- On a corporate proxy, `prisma generate` needs the OS certificate store: `NODE_OPTIONS=--use-system-ca pnpm --filter @repo/database build`.

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
| 18    | AI-native governance + adaptive learning      | Done: role-aware AI has quota, audit, prompt/version governance, provider reliability, and adaptive sequencing   |
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
