# Codebase Audit — Copy Prompt

```text
You are performing a comprehensive production-readiness audit of the LMS Platform codebase.

## Context Loading (Required)

Read these files first in order:
1. AGENTS.md
2. CLAUDE.md
3. agent-knowledge/lms-platform/CONTEXT.md
4. docs/ARCHITECTURE.md
5. docs/ai-agent/SOP.md

Then load ALL of these skill files (cross-cutting full-system audit):
- agent-knowledge/skills/code-review/SKILL.md
- agent-knowledge/skills/architecture-core/SKILL.md
- agent-knowledge/skills/senior-backend/SKILL.md
- agent-knowledge/skills/senior-frontend/SKILL.md
- agent-knowledge/skills/auth-standards/SKILL.md
- agent-knowledge/skills/nestjs-standards/SKILL.md
- agent-knowledge/skills/nextjs-standards/SKILL.md
- agent-knowledge/skills/db-intelligence/SKILL.md
- agent-knowledge/skills/api-design-reviewer/SKILL.md
- agent-knowledge/skills/testing-strategy/SKILL.md
- agent-knowledge/skills/deployment-ops/SKILL.md
- agent-knowledge/skills/monorepo-navigator/SKILL.md
- agent-knowledge/skills/i18n-workflow/SKILL.md

## Audit Goal

Perform a thorough expert-level audit of the entire codebase to ensure it meets production-grade standards: secure, maintainable, consistent, observable, and ready for scale + fast onboarding.

## Audit Scope — 10 Dimensions

### 1) Architecture & Code Structure
- Monorepo boundaries: shared packages properly isolated?
- Dependency direction: apps depend on packages, never reverse?
- Module organization: feature-oriented, no god-modules?
- Cross-app duplication: anything in apps/ that belongs in packages/?
- Dead code/orphan files/unused modules/imports?

### 2) Backend Code Quality (api-server)
- Controllers thin, services thick?
- DTO validation coverage (class-validator) + Swagger metadata consistency?
- Error handling consistency (HttpException mapping, no raw/internal leaks)?
- Explicit response contracts and predictable status codes?
- Query quality: N+1 risks, missing select/include strategy, pagination consistency?

### 3) Security & Auth
- Tenant isolation: every tenant-scoped query includes tenantId?
- RBAC coverage on sensitive mutations/reads?
- Cookie-first auth correctness, token/session handling, logout/invalidate flow?
- CSRF protection on state-changing endpoints?
- Input validation/sanitization (SQLi, XSS, path traversal, SSRF vectors)?
- Secrets management: no hardcoded keys/tokens/passwords?
- CORS/cookie/proxy config hardened for production?
- Audit logging for sensitive actions present and usable?

### 4) Frontend Quality (web-student, web-admin, web-sales, super-portal)
- Correct Server/Client Component boundaries?
- Shared API client/auth state reuse (avoid per-app drift)?
- i18n discipline: all UI strings externalized, en/vi parity?
- Route-level resiliency: loading.tsx/error.tsx coverage?
- Data fetching/cache/revalidation strategy consistency?
- Accessibility basics (labels, keyboard, semantic structure)?

### 5) Database & Prisma
- Schema conventions consistency (id/timestamps/tenant fields)?
- Index coverage for common filters/joins/sorts?
- Relation integrity and cascade behavior sanity?
- Migration safety (backward compatibility, destructive changes, rollback readiness)?
- Seed scripts idempotent and tenant-aware?

### 6) Testing & Quality Gates
- Coverage of critical paths: auth, tenant isolation, core CRUD, permission boundaries?
- Meaningful negative-path tests (401/403/404/409/422)?
- Unit/integration/E2E layering healthy?
- Mock strategy correctness (Prisma/external services)?
- Flaky-test patterns or missing deterministic setup?

### 7) Developer Experience & Maintainability
- New-developer setup path clarity and reliability?
- README/runbook/contributing docs aligned with actual commands?
- Type safety quality (`any`/unsafe casts in business logic)?
- Env var documentation completeness (.env.example parity)?
- Convention consistency across apps/packages?

### 8) Performance & Scalability
- Backend hotspots: expensive queries, missing pagination/limits, heavy sync paths?
- Frontend hotspots: unnecessary client bundles, render waterfalls, over-fetching?
- Caching strategy opportunities (HTTP/cache headers/server caching)?
- Background/async processing opportunities for slow critical paths?

### 9) Observability & Operations
- Structured logging quality and correlation context?
- Health/readiness endpoints meaningful and accurate?
- Error monitoring hooks and actionable diagnostics?
- Operational runbooks for common incidents?

### 10) CI/CD & Release Readiness
- CI gates cover typecheck/lint/test/build adequately?
- Docker/build artifacts follow secure multi-stage best practices?
- Deployment config consistency across environments?
- Safe rollout/rollback strategy documented?

## Required Method

1. Build an inventory map of all apps/packages and key modules.
2. Audit each dimension end-to-end.
3. For each finding, include exact file path + line range.
4. Distinguish clearly between verified issues vs assumptions.
5. Prefer high-signal findings; avoid style-only noise unless it impacts maintainability/risk.

## Output Format (Strict)

Return a single structured markdown report:

### A. Executive Summary
- Overall score (0-100)
- Production readiness verdict: READY / NEEDS WORK / HIGH RISK
- Top 10 issues by risk

### B. Scorecard by Dimension
For each of the 10 dimensions:
- Score (1-10)
- What is good
- What is risky
- Confidence level (High/Medium/Low)

### C. Detailed Findings
For every finding use this template:
- ID: AUDIT-XXX
- Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- Dimension:
- Location: <file path>:<line start>-<line end>
- Evidence:
- Impact:
- Recommended Fix:
- Example Patch (optional, minimal):

### D. Prioritized Remediation Plan
- Quick wins (1-2 days)
- Short term (1-2 sprints)
- Medium term (1-2 months)
- Owner suggestion (Backend / Frontend / DevOps / Cross-team)

### E. Validation Results
Run and report:
- pnpm run typecheck
- pnpm run lint
- pnpm run test
Include pass/fail summary and notable failures.

## Safety Rules

- Do NOT modify source code.
- Do NOT run destructive commands (delete/drop/reset/force-push).
- Do NOT expose secret values in report output.
- If uncertain, mark explicitly as "Needs human confirmation".
```
