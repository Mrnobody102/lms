# Codebase Audit — Prompt Template

Use this prompt to perform a comprehensive production-readiness audit of the LMS Platform codebase. It triggers skills from `architecture-core`, `senior-backend`, `senior-frontend`, `auth-standards`, `nestjs-standards`, `nextjs-standards`, `db-intelligence`, `api-design-reviewer`, `testing-strategy`, `deployment-ops`, `monorepo-navigator`, `i18n-workflow`, and `code-review`.

---

## Prompt

```text
You are performing a comprehensive production-readiness audit of the LMS Platform codebase.

## Context Loading (Required)

Read these files first in order:
1. AGENTS.md
2. agent-knowledge/lms-platform/CONTEXT.md
3. docs/ARCHITECTURE.md
4. docs/ai-agent/SOP.md

Then load ALL of these skill files (this is a cross-cutting audit):
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

Perform a thorough expert-level audit of the entire codebase to ensure it meets
production-grade standards: clean, maintainable, secure, and ready for new team
members to onboard and contribute.

## Audit Scope — 8 Dimensions

### 1. Architecture & Code Structure
- Monorepo boundaries: are shared packages properly isolated?
- Module organization: flat feature folders, no god-modules?
- Dependency direction: do apps depend on packages, never the reverse?
- Cross-app code duplication: anything in apps/ that should be in packages/?
- Are there orphan files, dead imports, or unused modules?

### 2. Backend Code Quality (api-server)
- Controllers thin, services thick? No business logic in controllers?
- DTOs: every endpoint has validated input DTOs with class-validator + @ApiProperty?
- Swagger: full @ApiOperation, @ApiResponse, @ApiTags coverage?
- Error handling: consistent HttpException usage, no raw error exposure?
- Response contracts: explicit and documented, not relying on magic interceptors?
- N+1 queries or missing Prisma includes?

### 3. Security & Auth
- Tenant isolation: every tenant-scoped query includes tenantId?
- Cookie-first auth: no JWT in localStorage for browser auth?
- CSRF protection: double-submit cookie/header on state-changing requests?
- Rate limiting: sensitive endpoints (login, register) use stricter @Throttle?
- Input sanitization: no SQL injection, XSS, or path traversal vectors?
- Role-based access: proper @Roles + RolesGuard on mutation endpoints?
- Secrets: no hardcoded API keys, tokens, or passwords in source code?
- CORS: exact origin list, not wildcard?

### 4. Frontend Code Quality (web-student, web-admin, super-portal)
- Server Components by default, 'use client' only when necessary?
- Shared API client from @repo/api-client used consistently?
- Zustand auth store from @repo/shared, not custom per-app implementations?
- All user-facing strings in i18n files (vi.json + en.json), no hardcoded text?
- lucide-react only for icons, no mixed icon libraries?
- loading.tsx + error.tsx for all main route segments?
- next/image for all images?
- Proper async params pattern for Next.js 16 layouts?

### 5. Database & Prisma
- Schema conventions: UUID ids, createdAt/updatedAt, tenantId on all tenant models?
- Indexes on frequently filtered/joined columns?
- Relations defined on both sides?
- Migration history clean, no conflicting or dangerous migrations?
- Seed data idempotent and tenant-aware?

### 6. Testing Coverage
- Critical paths covered: auth, tenant isolation, CRUD operations?
- Test naming follows specification style?
- Prisma properly mocked in unit tests?
- E2E smoke tests exist for all 3 web portals?
- Coverage gaps in error paths (401, 403, 404, 422)?

### 7. Developer Experience & Maintainability
- Can a new developer clone, install, and run in under 10 minutes?
- README, quick-start, and contributing guide accurate and up-to-date?
- Code conventions consistent across all apps?
- TypeScript strict mode, no 'any' types in business logic?
- Environment variables documented in .env.example?
- No hardcoded URLs, ports, or environment-specific values?

### 8. Deployment & CI Readiness
- Dockerfiles follow multi-stage best practices?
- CI pipeline covers typecheck, lint, test, build, E2E, API smoke?
- Health endpoints (/api/health/live, /api/health/ready) working?
- Production configs (CORS, cookies, trust-proxy) documented?

## Acceptance Criteria

For each dimension, produce:
1. **Score** (1-10) with brief justification
2. **Findings** categorized by severity:
   - 🔴 CRITICAL — Security vulnerability, data leak, or production-breaking issue
   - 🟠 HIGH — Will cause problems in production or significantly hurt maintainability
   - 🟡 MEDIUM — Code smell, tech debt, or convention violation
   - 🟢 LOW — Suggestion for improvement, nice-to-have
3. **Specific file paths** and line numbers for each finding
4. **Recommended fix** with code example where applicable

## Output Format

Produce a structured markdown report with:
- Executive summary (overall score, top 5 critical findings)
- Detailed findings per dimension
- Prioritized action plan (what to fix first → last)
- Final verdict: is this codebase production-ready?

## Safety Rules

- Do NOT modify any source code during this audit
- Do NOT run destructive commands (delete, drop, reset)
- Do NOT push or commit anything
- Report security findings carefully — do not expose actual secrets in the report
- If a finding requires a product/architecture decision, flag it for human review

## Validation

After completing the audit:
- Run: pnpm run typecheck
- Run: pnpm run lint
- Run: pnpm run test
Report the results alongside your findings.
```

---

## Tùy chỉnh

### Audit chỉ Backend

Bỏ dimensions 4 (Frontend) và thay skill list bằng:

- `code-review`, `senior-backend`, `nestjs-standards`, `auth-standards`, `api-design-reviewer`, `db-intelligence`, `testing-strategy`

### Audit chỉ Security

Giữ dimension 3 (Security & Auth) và thêm:

- Grep patterns cho hardcoded secrets
- OWASP Top 10 mapping
- Skills: `code-review`, `auth-standards`, `senior-backend`, `api-design-reviewer`

### Audit chỉ Frontend

Giữ dimension 4 (Frontend) và thêm:

- Accessibility (a11y) checks
- Performance audit (bundle size, lazy loading)
- Skills: `code-review`, `senior-frontend`, `nextjs-standards`, `i18n-workflow`
