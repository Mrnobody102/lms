# Current Work Summary

Last updated: 2026-06-01

## Status

| Area               | State       | Notes                                                                                             |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| Latest commit      | Done        | `7ed9735 chore: harden production readiness batch`                                                |
| Remote sync        | Done        | `main` is aligned with `origin/main`                                                              |
| Validation         | Done        | `pnpm lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build` passed                       |
| TypeScript hygiene | Improved    | Removed explicit `any` casts in API bootstrap; shared AI bulk count constants                     |
| Product readiness  | In progress | Next work should stay focused on tenant isolation, bounded lists, real metrics, and repeatable CI |

## Completed Slice: Batch 15

Goal: close production gaps found around CI, student SRS/AI, and Super Portal operations without starting unrelated product areas.

Delivered:

- CI E2E now builds workspace runtime dependencies before portal smoke jobs.
- `AdminPlatformService.getUsage` uses typed aggregation rows for tenant/media/ledger usage.
- AI bulk flashcard generation validates count server-side and returns actionable provider errors.
- Groq bulk flashcard parsing tolerates safe provider JSON variance.
- Student custom-card and dashboard lists are bounded for maintainable rendering.
- Super Portal split system overview (`/`) from tenant management (`/tenants`).
- Super Portal operational metrics now show data-source labels: database, runtime, in-memory, derived.
- API bootstrap no longer needs `as any` for cache setup.

Validation:

- `pnpm lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`

## Code Quality Snapshot

Good:

- Strict linting is active and currently passes across the workspace.
- Explicit `any` usage in app source is cleared by lint; remaining `expect.any(...)` usage is test matcher usage, not unsafe typing.
- Main UI text touched in this slice is synced in `en.json` and `vi.json`.
- Core thresholds added in this slice are named constants where they cross service/DTO boundaries.

Watch:

- Some feature-local constants are acceptable today, but promote them when reused by API and UI or multiple feature modules.
- Super-admin global queries must stay intentional and documented because they bypass ordinary tenant scoping by design.
- Operational metrics should be real, source-labeled, or hidden. Do not add placeholder/fake metrics.
- Long list screens should default to server pagination or bounded rendering.

## Next Batch: Batch 16

Theme: contract hardening and workflow polish.

Recommended scope:

1. Add high-risk cross-tenant deny tests for student/course/enrollment/practice/exam APIs.
2. Continue replacing duplicated loading/empty/error UI states with `@repo/ui` primitives in admin practice, exam, and report screens.
3. Add post-deploy smoke checks for API readiness and portal login routes.
4. Add read-only data integrity checks for orphan progress, enrollment, tenant relations, and soft-delete consistency.
5. Review remaining list endpoints/screens for unbounded reads and add pagination where needed.

Definition of done:

- Tenant-scoped reads/writes have explicit tenant context and focused regression tests.
- New or touched UI strings update both `vi.json` and `en.json`.
- No new `any`, no lint disables for typing shortcuts, and no fake metrics.
- `pnpm run check:contracts`, focused tests, and relevant portal smoke/build checks pass.

## Roadmap Focus

| Priority | Focus                    | Next useful output                                                       |
| -------- | ------------------------ | ------------------------------------------------------------------------ |
| P0       | Foundation hardening     | Production env, CI, release, contract checks stay green                  |
| P1       | Tenant/security boundary | Cross-tenant deny tests and audit coverage                               |
| P2       | Admin/student workflows  | Complete daily-use flows with deterministic smoke tests                  |
| P3       | Operations visibility    | Tenant health, real usage, alerts, request correlation                   |
| P4       | Scale/data integrity     | Bounded lists, integrity checks, index review                            |
| P5       | Shared maintainability   | Shared UI primitives and documented patterns after duplication is proven |

## Working Checklist

Before each handoff:

- [ ] Confirm `git status --short` and staged files are intentional.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm run typecheck`.
- [ ] Run focused tests; run `pnpm run test` for shared/backend changes.
- [ ] Run `pnpm run build` when CI, routing, package boundaries, or Next.js apps change.
- [ ] Update both locales for UI text.
- [ ] Update this file when batch status or next scope changes.
