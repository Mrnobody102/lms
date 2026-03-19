# Deployment and DevOps

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Deployment and Infrastructure
**Maintainer:** LMS Agent Team

---

## Overview

Procedures for containerizing, automating, and deploying the LMS platform across environments. The platform consists of four services: `api-server` (NestJS), `web-student` (Next.js), `web-admin` (Next.js), and `super-portal` (Next.js), backed by PostgreSQL and Redis.

## Core Capabilities

- **dockerization**: Multi-stage Docker builds for NestJS and Next.js apps using `turbo prune` in a pnpm monorepo.
- **cicd_pipelines**: GitHub Actions workflows that build, test, and deploy each service.
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
3. Run migrations: `pnpm db:push`
4. Start services: `docker compose -f deployment/production/docker-compose.prod.yml up --build`

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

1. **Lint & Type Check**: `pnpm lint` and `pnpm build` across affected apps
2. **Test**: Unit and integration tests via Vitest
3. **Build**: Docker images for all changed apps
4. **Deploy**: Push images and update services (Vercel for frontends, Railway/ECS for backend)

## Docker Strategy

- Base image: `node:18-alpine` for all services (reduced size).
- Use `turbo prune --scan-imports <app> --docker` to create isolated build context per app.
- NestJS (api-server): `output: 'standalone'` not needed. Run `node dist/main.js` directly.
- Next.js apps (web-student, web-admin, super-portal): Set `output: 'standalone'` in `next.config.js` for efficient production serving. Copy `.next/standalone`, `.next/static`, and `public/` directories.
- Always create a non-root user (`adduser --system --uid 1001`) in the runner stage.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/lms_platform` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `PORT` | API server port (default: 4000) | `4000` |
| `NEXT_PUBLIC_API_URL` | API base URL for Next.js clients | `https://api.lms.example.com` |

Environment file precedence: `.env.local` > `.env.production` > `.env`.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| `turbo prune` produces empty `out/` | Ensure `--filter=<app>` matches the app name in `turbo.json` |
| Next.js standalone output missing | Verify `output: 'standalone'` is set in `next.config.js` |
| Non-root user cannot read static files | Use `--chown=nextjs:nodejs` on COPY for static dirs |
| Frontend cannot reach API in Docker | Use Docker Compose service names (e.g., `http://api:4000`) not `localhost` |
| Stale lockfile in Docker cache | Copy lockfile before `pnpm install` to leverage cache |

## Best Practices

1. Never commit `.env` files. Use `.env.example` as a template.
2. Use `pnpm --filter` to build only affected apps in CI, not the entire monorepo.
3. Tag Docker images with the Git commit SHA: `lms-api:${GITHUB_SHA}`.
4. Keep database migrations in CI before deploying the new API image.
5. Health-check endpoints (`/health`) on all services for container orchestrator readiness probes.

## Related Skills

| Skill | Use When |
|---|---|
| engineering-planning | Planning feature rollouts that require deployment steps |
| i18n-workflow | Deploying i18n changes requires rebuild of Next.js apps |

## Reference Documentation

- See `references/docker-compose.md` for detailed Docker Compose examples, CI/CD pipeline YAML, and deployment checklists.
