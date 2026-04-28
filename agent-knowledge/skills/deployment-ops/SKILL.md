# Deployment and DevOps

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Deployment and Infrastructure
**Maintainer:** LMS Agent Team

---

## Overview

Procedures for containerizing, automating, and deploying the LMS platform across environments. The platform consists of four services: `api-server` (NestJS), `web-student` (Next.js), `web-admin` (Next.js), and `super-portal` (Next.js), backed by PostgreSQL and Redis.

## Core Capabilities

- **dockerization**: Multi-stage Docker builds for NestJS and Next.js apps using pinned Node 20 and full workspace install/build stages in the pnpm monorepo.
- **cicd_pipelines**: GitHub Actions workflows that typecheck, lint, test, build, and run smoke checks.
- **env_management**: Per-environment secrets and configuration via `.env` files and Docker Compose overrides.
- **infrastructure**: PostgreSQL 15 + Redis for the stack, deployable on Railway, AWS ECS, or any container host.

## When to Use

Use when:

- Building Docker images for any LMS service
- Setting up CI/CD for new features or branches
- Configuring environment variables for staging/production
- Deploying to Railway, Vercel (frontend), or a custom container host

Skip when:

- Making UI or API code changes that do not affect deployment
- Running local development with `pnpm dev` (no Docker needed)

## Key Workflows

### Local Development with Docker Compose

1. Copy environment files: `cp .env.example .env` and fill in values.
2. Start infrastructure: `pnpm db:up`
3. Run committed migrations: `pnpm db:deploy`
4. Seed database: `pnpm db:seed`
5. Start services: `pnpm dev` (or individual apps with `pnpm --filter web-student dev`)

### Building Production Docker Images

Each app has its own `Dockerfile` at `apps/<name>/Dockerfile`. Build from the repo root:

```bash
docker build -t lms-api -f apps/api-server/Dockerfile .
docker build -t lms-web-student -f apps/web-student/Dockerfile .
docker build -t lms-web-admin -f apps/web-admin/Dockerfile .
docker build -t lms-super-portal -f apps/super-portal/Dockerfile .
```

### CI/CD Pipeline

GitHub Actions workflows at `.github/workflows/` run on push/PR. Standard pipeline stages:

1. **Fast checks**: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`.
2. **Build**: `pnpm turbo run build --concurrency=1 --filter=api-server --filter=web-admin --filter=web-student --filter=super-portal --filter=@repo/database`.
3. **E2E**: Playwright Chromium smoke for `web-student`, `web-admin`, and `super-portal`.
4. **API smoke**: PostgreSQL + Redis service containers, `db:deploy`, API smoke script.

## Docker Strategy

- Base image: `node:20-alpine` for all services.
- Pin Corepack/pnpm and Turbo versions in Dockerfiles.
- Do not use `turbo prune --scan-imports`; Turbo `2.7.5` does not support that flag in this repo. Current production Dockerfiles use full workspace install/build stages and copy only runtime artifacts into final images.
- NestJS (api-server): Run `node dist/main.js` directly (no standalone output needed).
- Next.js apps (web-student, web-admin, super-portal): Set `output: 'standalone'` in `next.config.js` for efficient production serving. Copy `.next/standalone`, `.next/static`, and `public/` directories.
- Always create a non-root user (`adduser --system --uid 1001`) in the runner stage.

## Environment Variables

| Variable              | Description                      | Example                                         |
| --------------------- | -------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string     | `postgresql://user:pass@host:5432/lms_platform` |
| `REDIS_URL`           | Redis connection string          | `redis://host:6379`                             |
| `PORT`                | API server port (default: 4000)  | `4000`                                          |
| `NEXT_PUBLIC_API_URL` | API base URL for Next.js clients | `https://api.lms.example.com`                   |

Environment file precedence: `.env.local` > `.env.production` > `.env`.

## Common Pitfalls

| Pitfall                                       | Fix                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Reintroducing unsupported `turbo prune` flags | Keep current full workspace Docker build stages unless a verified prune strategy replaces them |
| Next.js standalone output missing             | Verify `output: 'standalone'` is set in `next.config.js`                                       |
| Non-root user cannot read static files        | Use `--chown=nextjs:nodejs` on COPY for static dirs                                            |
| Frontend cannot reach API from browser        | Use a browser-reachable `NEXT_PUBLIC_API_URL`, not an internal Docker hostname                 |
| Stale lockfile in Docker cache                | Copy lockfile before `pnpm install` to leverage cache                                          |

## Best Practices

1. Never commit `.env` files. Use `.env.example` as a template.
2. Use `pnpm --filter` and Turbo filters for focused local checks; CI should still cover shared-package blast radius.
3. Tag Docker images with the Git commit SHA: `lms-api:${GITHUB_SHA}`.
4. Keep database migrations in CI before deploying the new API image.
5. Use `/api/health/live` for liveness and `/api/health/ready` for readiness. Readiness must return non-2xx when required dependencies are down.

## Related Skills

| Skill                | Use When                                                |
| -------------------- | ------------------------------------------------------- |
| engineering-planning | Planning feature rollouts that require deployment steps |
| i18n-workflow        | Deploying i18n changes requires rebuild of Next.js apps |

## Reference Documentation

- See `references/docker-compose.md` for detailed Docker Compose examples, CI/CD pipeline YAML, and deployment checklists.
