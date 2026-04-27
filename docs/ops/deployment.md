# Deployment Guide

This guide covers local development, production deployment, CI checks, and runtime monitoring for the LMS Platform.

## 1. Local Development

Prerequisites:

- Node.js >= 18
- pnpm
- Docker Desktop

Run locally:

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## 2. Production Strategy

Recommended deployment split:

- Frontend apps (`web-student`, `web-admin`, `super-portal`): Vercel or equivalent Next.js hosting.
- Backend API (`api-server`): Docker on VPS/container platform.
- Database: managed PostgreSQL where possible.
- Redis: managed Redis where possible.

Frontend environment variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WEB_STUDENT_URL`
- `NEXT_PUBLIC_TENANT_ID` for local/dev tenant hints only. Production should resolve tenant by domain/subdomain unless `sendTenantHeaderInProduction` is explicitly enabled for a trusted deployment.

Backend environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `APP_PUBLIC_URL`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_DOMAIN`
- `MCP_ENABLED`

Production database changes must use migrations:

```bash
pnpm --filter @repo/database db:deploy
```

Do not run `db:push` against production databases.

Current production hardening notes:

- Dependencies are pinned; do not reintroduce `"latest"` in package manifests.
- Browser apps use cookie-first auth and do not store JWT as client authority.
- CSP keeps `unsafe-inline` scripts and `unsafe-eval` out of production. They are enabled only in non-production Next dev so webpack dev hydration and Playwright E2E can run.
- `CORS_ORIGINS` must contain exact frontend origins only, for example `https://admin.example.com,https://student.example.com` without paths or query strings.
- Redis readiness supports `redis://`, `rediss://`, and URL credentials such as `rediss://default:password@host:6380`.
- Learning access policy is centralized in `LearningAccessService`; new course/lesson/progress endpoints should use that service instead of duplicating enrollment checks.
- MCP should stay disabled in production unless intentionally enabled with `MCP_ENABLED=true` and a strong `MCP_API_KEY`.

## 3. CI/CD

The release-grade workflow lives in `.github/workflows/ci.yml`.

CI jobs:

1. `fast_checks`: install, generate Prisma client, typecheck, lint, unit/integration tests.
2. `build`: sequential production builds for API, frontend apps, and database package.
3. `e2e_chromium`: Chromium Playwright smoke for the student web app.
4. `api_smoke`: PostgreSQL + Redis service containers, `migrate deploy`, API smoke script.

## 4. Monitoring

| Endpoint                  | Use                                      |
| ------------------------- | ---------------------------------------- |
| `GET /api/health/live`    | Liveness probe                           |
| `GET /api/health/ready`   | Readiness probe for database and Redis   |
| `GET /api/health/metrics` | In-memory request metrics                |
| `GET /api/health/docs`    | Human-readable health endpoint reference |

See [monitoring.md](monitoring.md) for operational details.

## 5. Troubleshooting

- Database connection errors: verify `DATABASE_URL`, firewall rules, and migration state.
- Redis readiness errors: verify `REDIS_URL`, TLS mode (`rediss://` for managed TLS Redis), credentials, and network access.
- CORS errors: ensure all frontend origins are listed as exact origins in `CORS_ORIGINS`.
- Cookie auth across subdomains: configure `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE`, and HTTPS.
- Build errors: run `pnpm install --frozen-lockfile`, `pnpm --filter @repo/database generate`, then the failing build command.
