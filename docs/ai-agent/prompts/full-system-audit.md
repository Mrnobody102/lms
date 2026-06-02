# Full System Audit + Remediation - Copy Prompt

````text
You are performing a disciplined full-system audit, remediation, and verification pass for the LMS Platform codebase.

Your job is not to skim for a few obvious issues. Treat this like a production release readiness audit that must be offline-verifiable from the source tree, tests, scripts, config, and local command output.

## Core Principles

1. Do not audit by sampling.
   Audit every in-scope product flow, module boundary, security boundary, config path, test layer, and deployment/release artifact that can be verified from the repo.

2. Evidence first.
   Every important finding must include evidence: file/line, failing test, command output, log, schema/config mismatch, or a concrete cross-file inconsistency. If evidence is incomplete, mark it as Hypothesis or Suggestion, not a proven issue.

3. Production-grade, but do not overclaim.
   The target is production-grade quality that can be verified offline. Do not claim "production ready" if the repo lacks live evidence such as load tests, canary data, real production infra, production DB data, real provider credentials, mobile store validation, or runtime hardware evidence.

4. Read deeply.
   Read real flows, functions, edge cases, cross-module interactions, configs, tests, scripts, docs, and generated/deploy artifacts when relevant. Do not stop at architecture diagrams or checklists.

5. Correctness over speed.
   Do not rush or optimize for token savings at the cost of correctness. Also avoid infinite loops, speculative rewrites, style-only churn, or broad refactors without evidence.

6. Skills and docs are domain standards to operationalize, not truth.
   Load relevant skills/docs, verify them against current source code and official sources when the task depends on current external behavior, then convert validated guidance into concrete audit checks, fix rules, test cases, and final-report evidence. If a skill/doc is stale, say so and rely on verified code/official docs.

7. Phase gates are mandatory.
   Do not jump from reading code to editing code. Follow the phase gates below.

8. Fix proven in-scope issues.
   If an issue is in scope, high-confidence, proven, and verifiable, fix it. Defer only when it needs a product decision, unavailable credential, live environment, destructive data action, hardware/runtime unavailable locally, or a risky rewrite.

9. Fix-review-test loop.
   After each remediation batch, review the diff, reread affected tests/flows, and ask whether the fix introduced a regression. Later loops must become more conservative unless new evidence appears.

10. Final report needs a ledger.
    The final report must show what was audited, what was fixed, what was deferred, what was not covered, and what evidence supports the conclusion.

## Repo Context

LMS Platform is a pnpm/Turborepo monorepo with:

- `apps/api-server`: NestJS API.
- `apps/web-student`: student portal.
- `apps/web-admin`: center/admin portal.
- `apps/web-sales`: public sales/catalog portal.
- `apps/super-portal`: platform/super-admin portal.
- `packages/database`: Prisma schema/client/seed.
- `packages/api-client`: shared API client.
- `packages/shared`: shared auth/state/helpers.
- `packages/ui`: shared UI primitives.
- Planned mobile app: `apps/mobile-student` (P11), not currently scaffolded unless source proves otherwise.

Hard rules from this repo still apply:

- API responses go through `TransformInterceptor` except documented health/metrics/binary exceptions.
- Tenant isolation is mandatory for tenant-scoped reads/writes.
- Use `LearningAccessService` for enrollment access checks where applicable.
- Integration tests must close Nest apps and keep deterministic DB state.
- No `any`; use interfaces, generics, or `unknown` with type guards.
- Next.js portals use `proxy.ts`, not deprecated `middleware.ts`.
- UI text changes update both `vi.json` and `en.json`.
- Do not commit or push unless explicitly requested by the human in the current request.

## Phase 0 - Context And Source Validation Gate

Read these first:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/product/CURRENT-WORK.md`
4. `docs/product/PLAN.md`
5. `docs/ARCHITECTURE.md`
6. `docs/ai-agent/SOP.md`
7. `agent-knowledge/lms-platform/CONTEXT.md`

Then load only relevant skill files for the audit scope. For a full-system audit, normally include:

- `agent-knowledge/lms-platform/SKILL.md`
- `agent-knowledge/skills/code-review/SKILL.md`
- `agent-knowledge/skills/architecture-core/SKILL.md`
- `agent-knowledge/skills/nestjs-standards/SKILL.md`
- `agent-knowledge/skills/nextjs-standards/SKILL.md`
- `agent-knowledge/skills/auth-standards/SKILL.md`
- `agent-knowledge/skills/db-intelligence/SKILL.md`
- `agent-knowledge/skills/database-operations/SKILL.md`
- `agent-knowledge/skills/api-design-reviewer/SKILL.md`
- `agent-knowledge/skills/testing-strategy/SKILL.md`
- `agent-knowledge/skills/deployment-ops/SKILL.md`
- `agent-knowledge/skills/monorepo-navigator/SKILL.md`
- `agent-knowledge/skills/i18n-workflow/SKILL.md`

Before using any skill as guidance:

- Check whether the skill matches the current stack and repo layout.
- Prefer current source code and official docs over stale skill text.
- If latest external behavior matters, verify with official sources only and cite them.

Skill operationalization gate:

- For each skill used, record why it applies to this LMS system.
- Verify whether it matches the actual framework, runtime, versions, repo layout, and deployment target.
- Translate validated skill guidance into concrete questions for this codebase, such as:
  - Can any role bypass RBAC or tenant boundaries?
  - Can a student see courses, grades, files, notifications, analytics, or attempts from another tenant?
  - Can an instructor/admin mutate grades, enrollment, publication state, or attempts after a locked state?
  - Are quiz/exam attempts idempotent across retries, refreshes, timeouts, and duplicate submissions?
  - Are uploads constrained by type, size, storage path, tenant ownership, preview/download permission, and unsafe content handling?
  - Do tests prove negative cases and permission denials, not only happy paths?
- Apply skill-derived checks during audit, risk ranking, implementation, test design, validation, and final review.
- If skills conflict, use this priority order:
  1. Current source code and tests.
  2. Actual runtime, package versions, config, and deployment target.
  3. Official version-matched docs or primary sources.
  4. Security/privacy requirements.
  5. LMS business invariants.
  6. Local repo conventions.
  7. Generic best practice.

Phase 0 output before audit:

- Git status summary.
- Inventory of apps/packages/scripts/docs inspected.
- Skill/docs loaded, why they apply, derived checks, and whether any appeared stale or conflicting.
- Scope boundaries and known constraints.

## Phase 1 - System Inventory Gate

Build a map before judging quality:

- Apps, packages, scripts, CI workflows, Docker/deploy files.
- API modules, controllers, services, DTOs, guards, interceptors, filters, middleware.
- Prisma models, migrations, seed paths, indexes, relations, tenant fields.
- Portal routes, proxy files, auth stores, API clients, i18n files, route loading/error states.
- Test files by layer: unit, integration, E2E, contract/readiness scripts.
- Docs/runbooks that affect release, deployment, migration, and agent work.

Phase 1 output:

- Inventory table.
- Critical product flows that will be traced.
- Known missing artifacts that limit confidence.

## Phase 2 - Deep Audit Gate

Audit the current LMS system across these dimensions. For each dimension, read code deeply enough to verify behavior, not just intent.

### 1. Architecture And Module Boundaries

- Monorepo dependency direction.
- Shared package boundaries.
- God modules, hidden coupling, duplicated domain logic.
- Route/module ownership across `api-server`, portals, and packages.
- Docs alignment with current source tree.

### 2. Backend/API Correctness

- Controller/service separation.
- DTO validation, Swagger metadata, and response contracts.
- Error handling and exception shapes.
- Pagination/list bounds, N+1 risks, transaction boundaries.
- API compatibility between backend and portal clients.

### 3. Auth, Session, RBAC, Tenant Isolation

- Login/register/session restore/logout flows.
- Cookie-first browser auth and CSRF.
- Role guards and permission checks for super admin, tenant admin, instructor/admin, student, parent, org admin, and guest when implemented.
- Permission matrix coverage, including negative tests for unsupported role/action/resource combinations.
- Tenant resolution from host/header/session and production constraints.
- Cross-tenant deny behavior for reads and writes.
- Cross-tenant deny behavior for user, course, grade, attempt, file, notification, analytics, and export data.
- Sensitive mutation audit logs.

### 4. LMS Business Flows

Trace these end to end where implemented:

- Admin/user lifecycle: super admin, tenant admin, instructor/admin, student.
- Course/program/level/unit/lesson creation and publishing/readiness.
- Enrollment, roster management, cohort/class membership, drop/reactivation behavior, and access revocation.
- Student course access, lesson progress, continue learning, dashboard.
- Practice: question bank, exercise sets, attempts, scoring, feedback.
- Exam/quiz: timer, attempt lifecycle, retry/idempotency, duplicate submit, answer visibility, review, integrity rules.
- Grading/gradebook-like invariants: score ownership, locked deadlines, grade edits, feedback visibility, report/export correctness.
- Certificate/completion invariants where implemented: eligibility, issue/revoke behavior, tenant ownership.
- SRS and skill mastery: card creation, queue, review grading, mastery updates.
- AI tutor/practice generation/roleplay: quota, provider errors, prompt/context tenant safety.
- Reporting/gradebook-like flows: drill-downs, exports, risk flags, cohort comparison.
- Activation/license flow.
- Media upload/content access/security.
- Notifications and async jobs.
- Public sales catalog.
- Super Portal operations, tenant management, billing/plans, usage/storage, domains, feature flags, AI settings, audit/incident/infra views.
- Planned mobile readiness: API/client assumptions that would block `apps/mobile-student`.

### 5. Data Model, Migrations, Transactions

- Tenant-scoped model conventions.
- Composite unique keys and relation integrity.
- Indexes for common filters/sorts/joins.
- Soft-delete consistency.
- Data integrity over UI success: transactions, idempotency keys, rollback behavior, and persisted state must match user-facing success states.
- Destructive migration risk.
- Seed idempotency and tenant awareness.
- Data integrity scripts and migration rollback/runbooks.

### 6. Frontend Workflows And UI Correctness

- Route protection and unauthorized behavior.
- React Server/Client Component boundaries.
- API client reuse and error handling.
- React Query/state management correctness.
- Loading, empty, error, disabled, mobile states.
- i18n parity and no hardcoded user-facing strings.
- Accessibility as production quality: labels, focus, keyboard navigation, semantic structure, dialog/menu behavior, error announcement, and screen-reader names.
- Large list rendering and over-fetching.

### 7. File Upload, Content Security, Privacy

- Media upload path, MIME/size/status checks, signed URLs.
- Path traversal, SSRF, XSS, HTML/rich text handling.
- Privacy by design for student data, grades, minors, PII, uploads, activity logs, exports, retention, deletion, and audit trails.
- Secrets exposure in frontend env, logs, docs, CI.

### 8. Notifications, Jobs, Async Reliability

- BullMQ/Redis requirements.
- Retry/idempotency behavior, replay safety, and duplicate-notification prevention.
- Error handling and observability.
- Job data tenant scoping.
- Failure modes when Redis/provider unavailable.

### 9. Performance And Scale

- Class/school-scale list endpoints.
- Reporting and analytics query volume.
- Cursor/pagination needs for logs/time-series.
- Expensive synchronous request paths.
- Frontend bundle/render hotspots.
- Caching strategy and invalidation correctness.

### 10. Observability, Support Diagnosis, Operations

- Request ID propagation.
- Structured logs and redaction.
- Health/readiness endpoints.
- Metrics source clarity.
- Super Portal operator visibility.
- Trust and auditability for grade changes, enrollment/drop, course publishing, exports, tenant changes, feature flags, billing/plan changes, and admin actions.
- Runbooks for incidents, migration, rollback, backup/restore, queue retry, notification replay, failed payment recovery, and integration recovery.

### 11. Deployment, CI/CD, Backup, Restore, Rollback

- GitHub Actions coverage.
- Build scripts, package build order, Prisma generate.
- Docker/compose/deploy config.
- Env validation and secret checks.
- Release check and staging smoke.
- Backup/restore and migration safety evidence.

### 12. Testing Quality

- Unit, integration, E2E layering.
- Negative cases: 401/403/404/409/422, cross-tenant, role mismatch, invalid state transitions.
- Deterministic setup/teardown.
- Test assertions that prove behavior instead of implementation details.
- Missing tests for critical LMS flows.

## Phase 3 - Self-Challenge Gate

Before planning fixes, challenge your own audit in three passes:

1. Missing-scope pass:
   - Which implemented LMS flows did you not trace?
   - Which files did you assume rather than inspect?

2. Production-failure pass:
   - Where would production fail despite tests passing?
   - What depends on live infra/provider/credential/data not available offline?

3. Test-quality pass:
   - Do current tests prove the intended behavior?
   - Are there tests that pass while the user-facing behavior could still be broken?

Update finding confidence after this gate. Downgrade unsupported claims.

## Phase 4 - Findings And Remediation Plan Gate

Classify findings:

- Critical: data leak, auth bypass, destructive data risk, production deploy blocker.
- High: likely user-facing break, tenant/security regression risk, broken critical workflow.
- Medium: maintainability/reliability gap with clear evidence.
- Low: cleanup or documentation mismatch with limited risk.

Each finding must use this structure:

- ID: FSA-XXX
- Severity:
- Dimension:
- Product flow:
- Location: `path:line`
- Evidence:
- Impact:
- Confidence: High / Medium / Low
- Fix plan:
- Verification:
- Defer reason, if deferred:

Remediation planning rules:

- Use skill-derived checklists to rank risk, choose fixes, and define required tests.
- Fix all proven in-scope Critical/High issues unless blocked by safety/external constraints.
- Fix Medium issues when surgical and verifiable.
- Do not rewrite large subsystems without evidence and a human decision.
- Do not fix style-only issues unless they reduce real risk or unblock validation.
- If user-facing text changes, update both `vi.json` and `en.json`.

## Phase 5 - Implementation Gate

Implement only after Phase 4.

For each fix:

1. Make the smallest safe change.
2. Preserve tenant isolation and existing module boundaries.
3. Preserve LMS domain invariants: enrollment, roles, grades, attempts, deadlines, certificates, course visibility, privacy, and auditability.
4. Add/update focused tests when behavior changes.
5. Update docs only when they prevent future misuse or reflect real workflow changes.
6. Avoid unrelated refactors.

After each fix group:

- Review `git diff`.
- Reread affected flow and tests.
- Ask: did this create a regression, loosen authorization, remove validation, break i18n, or hide errors?
- If yes, fix before proceeding.

## Phase 6 - Validation Gate

Run the strongest validation that is relevant and available.

Baseline commands:

```bash
pnpm run check:contracts
pnpm lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Add focused commands when relevant:

```bash
pnpm --filter api-server test
pnpm --filter web-student test:e2e
pnpm --filter web-admin test:e2e
pnpm --filter super-portal test:e2e
pnpm test:e2e
pnpm run check:data-integrity
pnpm run check:production-env
```

Do not claim live production readiness unless live/staging checks were actually run and evidence is included.

## Phase 7 - Final Report Gate

Return a structured report with:

### A. Executive Summary

- Verdict: READY OFFLINE / NEEDS WORK / HIGH RISK.
- Important limitation: offline-only or live evidence included.
- Top risks remaining.
- High-confidence fixes completed.

### B. Skill Application Ledger

Table columns:

- Skill or source
- Why it applies
- Version/runtime/source validation
- Concrete checks derived
- Findings, fixes, or tests driven by it
- Stale/conflicting/deferred guidance

### C. Audit Coverage Ledger

Table columns:

- Area / Flow
- Files or modules inspected
- Depth: Inventory / Flow traced / Line-by-line / Tested
- Evidence gathered
- Confidence
- Gaps / deferred coverage

### D. Findings Ledger

Table columns:

- ID
- Severity
- Status: Fixed / Deferred / Hypothesis / Suggestion
- Evidence
- Fix or defer reason
- Verification

### E. Remediation Summary

- Files changed.
- What changed.
- Why it resolves the finding.
- Tests added/updated.

### F. Validation Results

- Commands run.
- Pass/fail.
- Notable output.
- Commands skipped and why.

### G. Remaining Risks And Next Mega Batch Candidates

- Only include risks with evidence or clear missing evidence.
- Map deferred work to current roadmap mega batches when possible:
  - Batch 16: production contracts and workflow readiness.
  - Batch 17: operations, release, scale readiness.
  - Batch 18: AI-native governance and adaptive learning.
  - Batch 19: mobile student app MVP.

## Safety Rules

- Do not commit or push unless explicitly requested by the human in the current request.
- Do not run destructive commands: reset, force-push, drop DB, delete data, destructive migration, mass file deletion.
- Do not expose secret values.
- Do not change public API contracts or schema destructively without an explicit migration/compatibility plan and human approval.
- Do not claim live readiness without live evidence.
- Stop and ask when a fix requires product policy, credential access, real production/staging data, or destructive data actions.

````
