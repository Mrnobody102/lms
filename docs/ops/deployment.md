# Deployment Guide

This guide covers local development, production deployment, CI checks, and runtime monitoring for the LMS Platform.

## 1. Local Development

Prerequisites:

- Node.js >= 20.9.0
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
- `TRUST_PROXY`
- `ALLOW_TENANT_HEADER_IN_PRODUCTION`
- `APP_PUBLIC_URL`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_DOMAIN`
- `MCP_ENABLED`

Production database changes must use migrations:

```bash
pnpm --filter @repo/database db:deploy
```

Do not run `db:push` against production databases.

For the Docker Compose production template, provide at least:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`

The compose template includes a one-shot `migrate` service that runs `prisma migrate deploy`
before the API service starts. `NEXT_PUBLIC_API_URL` must be a browser-reachable URL, not the
internal Docker service hostname.

Current production hardening notes:

- Dependencies are pinned; do not reintroduce `"latest"` in package manifests.
- Browser apps use cookie-first auth and do not store JWT as client authority.
- CSP keeps `unsafe-inline` scripts and `unsafe-eval` out of production. They are enabled only in non-production Next dev so webpack dev hydration and Playwright E2E can run.
- `CORS_ORIGINS` must contain exact frontend origins only, for example `https://admin.example.com,https://student.example.com` without paths or query strings.
- `TRUST_PROXY` must be enabled only behind a trusted reverse proxy. When enabled, tenant host resolution can use the proxy-forwarded host seen by Express.
- `ALLOW_TENANT_HEADER_IN_PRODUCTION` should stay `false` unless a trusted edge explicitly injects `x-tenant-id`; normal production traffic should resolve tenants by domain/subdomain.
- Redis readiness supports `redis://`, `rediss://`, and URL credentials such as `rediss://default:password@host:6380`.
- API throttling uses Redis-backed storage when `REDIS_URL` is configured; local development without `REDIS_URL` falls back to the Nest in-memory throttler.
- Learning access policy is centralized in `LearningAccessService`; new course/lesson/progress endpoints should use that service instead of duplicating enrollment checks.
- MCP should stay disabled in production unless intentionally enabled with `MCP_ENABLED=true` and a strong `MCP_API_KEY`.

## 3. CI/CD

The release-grade workflow lives in `.github/workflows/ci.yml`.

CI jobs:

1. `fast_checks`: install, generate Prisma client, typecheck, lint, unit/integration tests.
2. `build`: sequential production builds for API, frontend apps, and database package.
3. `e2e_chromium`: Chromium Playwright smoke for student, admin, and super portal.
4. `api_smoke`: PostgreSQL + Redis service containers, `migrate deploy`, API smoke script.

Docker image validation is intentionally manual in `.github/workflows/docker-build.yml`.
Run it before release candidates or Dockerfile changes. Full image builds are expensive on
Windows and consume more GitHub Actions minutes than the regular CI path.

For local Docker checks, prefer targeted builds:

```bash
docker compose -f deployment/production/docker-compose.prod.yml build api
docker compose -f deployment/production/docker-compose.prod.yml build web-admin
```

Run the post-deploy smoke script after a release:

```bash
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://learn.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://ops.example.com
```

## 4. Monitoring

| Endpoint                             | Use                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `GET /api/health/live`               | Liveness probe                                                                              |
| `GET /api/health/ready`              | Readiness probe for database and Redis; returns HTTP 503 when a required dependency is down |
| `GET /api/health/metrics`            | In-memory request metrics                                                                   |
| `GET /api/health/metrics/prometheus` | Prometheus text metrics for scraping                                                        |
| `GET /api/health/docs`               | Human-readable health endpoint reference                                                    |

See [monitoring.md](monitoring.md) for operational details.

Prometheus and Alertmanager starter configs are in `deployment/production/monitoring/`.
Mount them into your monitoring stack and update the receiver in `alertmanager.yml` before production use.

## 5. Troubleshooting

- Database connection errors: verify `DATABASE_URL`, firewall rules, and migration state.
- Redis readiness errors: verify `REDIS_URL`, TLS mode (`rediss://` for managed TLS Redis), credentials, and network access.
- CORS errors: ensure all frontend origins are listed as exact origins in `CORS_ORIGINS`.
- Cookie auth across subdomains: configure `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE`, and HTTPS.
- Build errors: run `pnpm install --frozen-lockfile`, `pnpm --filter @repo/database generate`, then the failing build command.
