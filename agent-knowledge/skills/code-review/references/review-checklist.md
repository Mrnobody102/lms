# Production-Readiness Review Checklist

Use this checklist when performing a full codebase audit. Check each item and note any findings.

## Architecture & Structure

- [ ] Shared packages (`@repo/database`, `@repo/shared`, `@repo/ui`, `@repo/api-client`) have clear boundaries.
- [ ] No app-specific code in shared packages.
- [ ] No shared code duplicated in apps (should be extracted to packages).
- [ ] Feature modules are flat under `src/`, not nested under `modules/` or `features/`.
- [ ] No circular dependencies between packages.
- [ ] No orphan files (unused components, dead routes).
- [ ] `turbo.json` pipeline covers all necessary tasks.

## Backend (api-server)

- [ ] Every controller has `@ApiTags`, `@ApiBearerAuth` decorators.
- [ ] Every endpoint has `@ApiOperation` + `@ApiResponse`.
- [ ] Every DTO field has `@ApiProperty` + `class-validator` decorator.
- [ ] `ValidationPipe` configured globally with `whitelist: true, forbidNonWhitelisted: true`.
- [ ] Controllers are thin — no business logic.
- [ ] Services handle all Prisma queries and business logic.
- [ ] All tenant-scoped queries include `tenantId` in `where` clause.
- [ ] `HttpException` subclasses used for all errors — no raw strings.
- [ ] No `console.log` in production code (use NestJS Logger).
- [ ] Rate limiting applied on auth endpoints.
- [ ] Pagination on all list endpoints with `{ data, meta }` format.

## Security

- [ ] No hardcoded secrets, API keys, or tokens in source code.
- [ ] `.env` not committed; `.env.example` has all documented variables.
- [ ] CORS uses exact origin list — no wildcard `*`.
- [ ] Auth cookies are `HttpOnly`, `Secure` (in production), `SameSite`.
- [ ] CSRF double-submit cookie/header on state-changing requests.
- [ ] JWT validated server-side; frontend never reads/decodes JWT.
- [ ] Role-based guards on all mutation endpoints.
- [ ] Input sanitization — no SQL injection, XSS, path traversal vectors.
- [ ] Error responses never expose stack traces or internal details.
- [ ] `x-tenant-id` header not trusted in production by default.

## Frontend (web-student, web-admin, super-portal)

- [ ] Server Components used by default; `'use client'` only when necessary.
- [ ] `@repo/api-client` used for all API calls — no custom axios instances.
- [ ] `@repo/shared` auth store used — no custom auth stores.
- [ ] All user-facing strings in i18n files (`vi.json` + `en.json`).
- [ ] `lucide-react` used exclusively for icons.
- [ ] `next/image` used for all images.
- [ ] `loading.tsx` + `error.tsx` for all main route segments.
- [ ] `Link` imported from `src/navigation.ts`, not `next/link`.
- [ ] No `any` types in business logic.
- [ ] Responsive design with mobile-first approach.

## Database

- [ ] All models use UUID primary keys (`@id @default(uuid())`).
- [ ] All models have `createdAt` + `updatedAt`.
- [ ] All tenant-scoped models have `tenantId` + `@relation`.
- [ ] Indexes on foreign keys and frequently filtered columns.
- [ ] Relations defined on both sides.
- [ ] Migration history is clean — no conflicting migrations.
- [ ] Seed file is idempotent (can run multiple times safely).

## Testing

- [ ] Auth service: 90%+ coverage.
- [ ] Tenant middleware: 95%+ coverage.
- [ ] Controllers: happy path + error path coverage.
- [ ] Prisma properly mocked in unit tests.
- [ ] E2E smoke tests for all 3 web portals.
- [ ] Test naming follows specification style.

## Developer Experience

- [ ] `README.md` has accurate setup instructions.
- [ ] `docs/quick-start.md` enables clone → run in <10 minutes.
- [ ] `CONTRIBUTING.md` has commit conventions and workflow.
- [ ] `PROJECT_STRUCTURE.md` reflects current codebase.
- [ ] All environment variables documented in `.env.example`.
- [ ] No hardcoded URLs, ports, or environment-specific values.
- [ ] TypeScript strict mode enabled.

## Deployment

- [ ] Dockerfiles use multi-stage builds with `node:20-alpine`.
- [ ] Non-root user in Docker runner stage.
- [ ] Next.js apps have `output: 'standalone'`.
- [ ] CI pipeline: typecheck → lint → test → build → E2E → API smoke.
- [ ] Health endpoints: `/api/health/live` and `/api/health/ready`.
- [ ] Docker images tagged with Git commit SHA.
