# Code Review & Codebase Audit

**Tier:** POWERFUL
**Category:** Engineering / Quality Assurance
**Domain:** Code Review, Architecture Audit, Production Readiness
**Maintainer:** LMS Agent Team

---

## Overview

Systematic codebase review and production-readiness audit skill for the LMS Platform. Use when conducting architecture reviews, security audits, code quality assessments, tech debt analysis, or onboarding readiness evaluations. This is a cross-cutting skill that orchestrates findings from multiple domain-specific skills.

## Core Capabilities

- **architecture_audit**: Evaluate monorepo boundaries, module organization, dependency direction, and cross-app duplication.
- **security_review**: Identify tenant isolation gaps, auth vulnerabilities, input validation holes, hardcoded secrets, and CORS misconfigurations.
- **code_quality_scan**: Detect dead code, unused imports, inconsistent patterns, `any` types, hardcoded values, and convention violations.
- **maintainability_check**: Assess developer onboarding readiness, documentation accuracy, TypeScript strictness, and code consistency.
- **production_readiness**: Verify Dockerfiles, CI pipeline coverage, health endpoints, environment variable documentation, and deployment configs.

## When to Use

Use when:

- Performing a full codebase audit before a production release.
- Reviewing code quality across multiple apps or packages.
- Assessing security posture after adding new features.
- Evaluating developer experience for new team member onboarding.
- Identifying tech debt and prioritizing cleanup work.
- Preparing for external code review or audit.

Skip when:

- Reviewing a single PR or small feature change (use domain-specific skill instead).
- Writing new code (use the relevant implementation skill).
- Running automated tests (use `testing-strategy`).

## Audit Dimensions

### 1. Architecture & Structure

- Are shared packages properly isolated from app-specific code?
- Module organization: flat feature folders, no god-modules?
- Dependency direction: apps → packages, never reverse?
- Orphan files, dead imports, unused modules?
- Cross-app duplication that should be in packages?

### 2. Backend Quality

- Controllers thin, services thick?
- DTOs validated with `class-validator` + `@ApiProperty`?
- Full Swagger coverage (`@ApiOperation`, `@ApiResponse`, `@ApiTags`)?
- Consistent `HttpException` usage, no raw error exposure?
- No N+1 queries or missing Prisma includes?

### 3. Security

- Every tenant-scoped query includes `tenantId`?
- Cookie-first auth, no JWT in localStorage?
- CSRF double-submit on state-changing requests?
- Rate limiting on sensitive endpoints?
- No SQL injection, XSS, or path traversal vectors?
- No hardcoded secrets in source code?
- CORS exact origin list, not wildcard?

### 4. Frontend Quality

- Server Components by default, `'use client'` only when necessary?
- Shared API client and auth store used consistently?
- All strings in i18n files, no hardcoded text?
- `lucide-react` only for icons?
- `loading.tsx` + `error.tsx` for all main routes?

### 5. Database

- Schema conventions followed (UUID, timestamps, tenantId)?
- Indexes on filtered/joined columns?
- Migration history clean?
- Seed data idempotent?

### 6. Testing

- Critical paths covered (auth, tenant isolation, CRUD)?
- Prisma properly mocked?
- E2E smoke tests for all portals?
- Error path coverage?

### 7. Developer Experience

- New dev can clone → install → run in <10 minutes?
- Documentation accurate and up-to-date?
- No `any` types in business logic?
- Environment variables documented?
- No hardcoded URLs/ports?

### 8. Deployment Readiness

- Dockerfiles follow multi-stage best practices?
- CI covers typecheck, lint, test, build, E2E, API smoke?
- Health endpoints working?
- Production configs documented?

## Key Workflows

### Full Codebase Audit

1. Load context: `AGENTS.md`, `CONTEXT.md`, `ARCHITECTURE.md`.
2. Load all relevant skills (architecture, backend, frontend, auth, db, testing, deployment).
3. Scan each dimension systematically.
4. Categorize findings by severity: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM, 🟢 LOW.
5. Provide specific file paths and line numbers.
6. Recommend fixes with code examples.
7. Produce executive summary + prioritized action plan.

### Focused Security Audit

1. Load `auth-standards`, `senior-backend`, `api-design-reviewer` skills.
2. Review auth flow, tenant isolation, input validation, CORS, rate limiting.
3. Check for hardcoded secrets with grep patterns.
4. Verify CSRF protection on all state-changing endpoints.
5. Report findings with severity and remediation.

### Tech Debt Assessment

1. Load `architecture-core`, `monorepo-navigator` skills.
2. Search for `// TODO`, `// FIXME`, `// HACK` comments.
3. Identify `any` types, unused exports, circular dependencies.
4. Check for outdated dependencies.
5. Estimate effort and prioritize cleanup.

## Severity Levels

| Level    | Icon | Criteria                                                       | Action                  |
| -------- | ---- | -------------------------------------------------------------- | ----------------------- |
| CRITICAL | 🔴   | Security vulnerability, data leak, production-breaking         | Fix immediately         |
| HIGH     | 🟠   | Will cause production problems or major maintainability issues | Fix before next release |
| MEDIUM   | 🟡   | Code smell, convention violation, tech debt                    | Plan for next sprint    |
| LOW      | 🟢   | Suggestion, nice-to-have improvement                           | Backlog                 |

## Common Pitfalls

| Pitfall                                        | Fix                                                     |
| ---------------------------------------------- | ------------------------------------------------------- |
| Reviewing everything at once without structure | Use the 8 dimensions systematically                     |
| Reporting too many LOW findings                | Focus on CRITICAL and HIGH first                        |
| Missing tenant isolation gaps                  | Grep for Prisma queries without `tenantId` filter       |
| Not checking error paths                       | Review catch blocks, error boundaries, and 4xx handlers |
| Ignoring documentation staleness               | Compare docs against actual code behavior               |
| Modifying code during audit                    | Audit is read-only; fixes come in a separate task       |

## Best Practices

1. **Read-only audit**: never modify source code during a review. Report findings, then fix separately.
2. **Structured output**: use consistent severity levels and include file paths + line numbers.
3. **Prioritize ruthlessly**: a few CRITICAL findings are more valuable than 50 LOW suggestions.
4. **Cross-reference skills**: use domain-specific skills for deep-dive analysis within each dimension.
5. **Run validation gates**: execute `typecheck`, `lint`, `test` to get automated signal alongside manual review.
6. **Check both happy and error paths**: security and reliability issues hide in error handling.
7. **Verify documentation accuracy**: stale docs are worse than no docs.

## Related Skills

| Skill               | Use When                                             |
| ------------------- | ---------------------------------------------------- |
| architecture-core   | Deep-diving into monorepo structure and boundaries   |
| senior-backend      | Reviewing NestJS patterns, services, and controllers |
| senior-frontend     | Reviewing React/Next.js patterns and components      |
| auth-standards      | Auditing authentication and authorization flows      |
| api-design-reviewer | Checking REST API design consistency                 |
| db-intelligence     | Reviewing Prisma schema and query patterns           |
| testing-strategy    | Evaluating test coverage and quality                 |
| deployment-ops      | Checking Docker and CI/CD readiness                  |

## Reference Documentation

→ See `references/review-checklist.md` for the full production-readiness checklist.
