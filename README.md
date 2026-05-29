# LMS Platform — Next-Gen Multi-tenant Education Platform

A state-of-the-art, **multi-tenant SaaS Learning Management System** built for language schools, training centers, and online academies. Designed with a _"Shopify for Education"_ philosophy: one powerful unified platform, limitless tenants, and complete isolation for branding, curriculums, and student data.

---

## 🌟 Outstanding Features

- **Hybrid AI-Enhanced Learning**: Fuses traditional course foundations (lessons, quizzes, practice) with evidence-based learning science (spaced repetition, mastery tracking).
- **AI Conversation Roleplay**: Revolutionary scenario-based dialogue sessions to immerse students in real-world scenarios.
- **Enterprise Multi-Tenancy**: Built on a shared-database model where all tenants share the same robust codebase but are cryptographically isolated at every query layer.
- **Strict Production Security**:
  - Zero `localStorage` token leakage — exclusively uses `HttpOnly` cookie-based JWTs with `SameSite: Lax` for seamless cross-site mobile support.
  - Complete CSRF double-submit protection.
- **Flawless i18n Support**: Full bilingual support (Vietnamese & English) rigorously tested by automated contract checks.
- **Bulletproof Reliability**: E2E tested with Playwright in isolated browser contexts with stateful authentication mocking.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)

---

## Key Features

### 🎓 Learning Experience (Student Portal)

| Feature                                                                | Status        |
| ---------------------------------------------------------------------- | ------------- |
| Course catalog with enrollment-based access                            | ✅ Production |
| Structured learning: Program → Level → Course → Unit → Lesson          | ✅ Production |
| Lesson types: Video, Text, Quiz, Micro-card, Practice, Exam            | ✅ Production |
| Learning dashboard: continue learning, daily streak, activity calendar | ✅ Production |
| Spaced Repetition System (SRS) — SM-2 algorithm, daily review queue    | ✅ Production |
| Practice engine: multiple choice, fill-in-blank, matching, ordering    | ✅ Production |
| Listening comprehension: audio prompt with replay limit                | ✅ Production |
| Exam engine: timed, resume-able, auto-graded with section navigation   | ✅ Production |
| AI In-Context Tutor: explains mistakes in practice/exam review         | ✅ Production |
| AI Conversation Roleplay: scenario-based dialogue sessions             | ✅ MVP        |
| Skill Mastery tracking with EWMA-based scoring                         | ✅ Production |
| Certificates upon course completion                                    | ✅ Production |
| Discussion threads per lesson                                          | ✅ Production |
| Google Sign-In (OAuth 2.0 with ID token verification)                  | ✅ Production |
| i18n: Vietnamese & English                                             | ✅ Production |

### 🛠️ Admin Portal (Center Owner)

| Feature                                                           | Status        |
| ----------------------------------------------------------------- | ------------- |
| Course/Unit/Lesson CRUD with full-page lesson editor              | ✅ Production |
| Question bank management (practice & exam)                        | ✅ Production |
| Student management: enroll/unenroll, bulk operations, detail view | ✅ Production |
| Activation codes & license entitlements                           | ✅ Production |
| Cohort management                                                 | ✅ Production |
| Reporting: drill-down Program → Level → Course → Unit → Skill     | ✅ Production |
| Time-series activity trends & CSV export                          | ✅ Production |
| Student risk flags & cohort comparison                            | ✅ Production |
| AI-generated question draft review queue                          | ✅ MVP        |
| Instructor assignments per course                                 | ✅ Production |
| Marketplace for sharing/subscribing to content                    | ✅ MVP        |
| Notification system                                               | ✅ Production |

### 🌐 Super Admin Portal (Platform Owner)

| Feature                                           | Status        |
| ------------------------------------------------- | ------------- |
| Tenant lifecycle management                       | ✅ MVP        |
| Platform-level user identity (GlobalUserIdentity) | ✅ Production |
| Audit logs                                        | ✅ Production |

### 🔒 Security & Infrastructure

- **Cookie-first auth** with `HttpOnly` JWT cookies — no `localStorage` tokens
- **CSRF double-submit** protection for all state-changing requests
- **Tenant isolation** enforced at auth guards, service policy, and DB constraints
- **Rate limiting** via Redis-backed throttler (configurable per endpoint)
- **Token versioning** — password change invalidates all existing sessions
- **Production tenant resolution** from domain/subdomain, not client headers
- **MCP server** (opt-in) with API key auth and tenant scoping
- **Audit logging** for sensitive admin actions

---

## Architecture

```
┌─────────────┐    HTTPS     ┌────────────────────────────────┐
│    Browser   ├─────────────▶   CDN / Reverse Proxy           │
└─────────────┘              └────┬────────┬────────┬──────────┘
                                  │        │        │
                         web-student  web-admin  super-portal
                                  │        │        │
                                  └────────┴────────┘
                                           │ REST + HttpOnly Cookie
                                    ┌──────▼──────┐
                                    │  api-server  │
                                    │   (NestJS)   │
                                    └──────┬───────┘
                                    ┌──────┴───────┐
                               PostgreSQL        Redis
                           (source of truth)  (throttle/cache)
```

**Multi-tenancy model**: Shared database, tenant-scoped at every layer.

- Auth guards inject `tenantId` from verified request context
- Service layer uses `LearningAccessService` for enrollment + tenant policy
- DB constraints enforce tenant-scoped uniqueness on all learning relations

---

## Tech Stack

| Layer        | Technology                                                            |
| ------------ | --------------------------------------------------------------------- |
| **Monorepo** | pnpm 9 + Turborepo                                                    |
| **Backend**  | NestJS (modular), Prisma ORM, PostgreSQL, Redis                       |
| **Frontend** | Next.js 15 (App Router), React, Tailwind CSS, Zustand, React Query v5 |
| **Auth**     | JWT (HttpOnly cookie), CSRF tokens, Google OAuth 2.0                  |
| **AI**       | Pluggable AI gateway (Google Gemini / custom endpoint)                |
| **Media**    | S3-compatible storage, presigned uploads, BullMQ job queue            |
| **Testing**  | Vitest (unit), Playwright (E2E)                                       |
| **CI/CD**    | GitHub Actions, Docker, Vercel                                        |
| **Language** | TypeScript (strict mode, no `any`)                                    |

---

## Apps & Portals

| App            | Port          | Description                    |
| -------------- | ------------- | ------------------------------ |
| `web-student`  | 3100          | Student-facing learning portal |
| `web-admin`    | 3101          | Center owner admin portal      |
| `super-portal` | 3102          | Platform super admin           |
| `web-sales`    | 3103          | Public course sales page       |
| `api-server`   | 4000          | Central REST API               |
| Swagger UI     | 4000/api/docs | Interactive API docs           |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.9.0 (use `.nvmrc` — pinned to 20.19.5)
- **pnpm** — `npm install -g pnpm`
- **Docker** — for PostgreSQL and Redis

### Install

```bash
pnpm install
```

### Configure Environment

```bash
# Copy the example env file and fill in your values
cp .env.example .env
```

See [Environment Variables](#environment-variables) for required fields.

### Start Infrastructure

```bash
# Start PostgreSQL + Redis via Docker
pnpm db:up

# Run database migrations
pnpm db:migrate

# Seed demo data (tenant, admin account, sample courses)
pnpm db:seed
```

### Run in Development

```bash
# Start all apps concurrently
pnpm dev
```

Access the apps:

| App            | URL                            |
| -------------- | ------------------------------ |
| Student Portal | http://localhost:3100          |
| Admin Portal   | http://localhost:3101          |
| Super Portal   | http://localhost:3102          |
| Sales Page     | http://localhost:3103          |
| API Server     | http://localhost:4000          |
| Swagger Docs   | http://localhost:4000/api/docs |

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable                       | Required | Description                               |
| ------------------------------ | -------- | ----------------------------------------- |
| `DATABASE_URL`                 | ✅       | PostgreSQL connection string              |
| `REDIS_URL`                    | ✅       | Redis connection string                   |
| `JWT_SECRET`                   | ✅       | Min 32 chars, used for access tokens      |
| `JWT_RESET_SECRET`             | ✅       | Separate secret for password reset tokens |
| `PORT`                         | ✅       | API server port (default: 4000)           |
| `CORS_ORIGINS`                 | ✅       | Comma-separated allowed origins           |
| `GOOGLE_CLIENT_ID`             | ⚠️       | Required for Google login                 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ⚠️       | Required on student frontend              |
| `AI_PROVIDER`                  | Optional | `off` (default), or configure AI gateway  |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | For Gemini-powered AI features            |
| `MCP_ENABLED`                  | Optional | Enable MCP server (default: `false`)      |
| `MAIL_ENABLED`                 | Optional | Enable email sending (default: `false`)   |

> **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm test --filter @repo/shared   # Test shared logic
pnpm test --filter @repo/ui       # Test UI components
```

### Integration Tests

```bash
pnpm --filter api-server test
```

### End-to-End Tests (Playwright)

```bash
# Install browsers (first time)
pnpm run playwright:install:chromium

# Run E2E tests for student portal
pnpm --filter web-student test:e2e
```

### Validate Before Committing

```bash
pnpm lint
pnpm run typecheck
pnpm run test
```

---

## Documentation

| Document                                        | Description                                |
| ----------------------------------------------- | ------------------------------------------ |
| [Architecture Overview](docs/ARCHITECTURE.md)   | System boundaries, tenant model, auth flow |
| [Tech Stack](docs/tech-stack.md)                | Detailed technology choices and rationale  |
| [API Documentation](docs/api-documentation.md)  | Standardized API contracts                 |
| [Database Guide](docs/guides/database-guide.md) | Prisma usage, migrations, seeding          |
| [Testing Guide](docs/guides/testing.md)         | Testing strategy and patterns              |
| [Feature List](docs/product/features.md)        | Complete feature inventory with status     |
| [Product Roadmap](docs/product/PLAN.md)         | Development phases and backlog             |
| [Deployment Guide](docs/ops/deployment.md)      | Production deployment with Docker          |
| [Quick Start](docs/quick-start.md)              | Fastest path to a running system           |
| [Contributing](CONTRIBUTING.md)                 | Code standards, PR workflow                |

---

## Security Notes

- **Secrets** are loaded from environment variables only — no hardcoded credentials in source code
- **`.env` is gitignored** — only `.env.example` (with placeholder values) is committed
- **Browser auth** uses `HttpOnly` cookies with CSRF protection — tokens are never in `localStorage`
- **Tenant headers** (`x-tenant-id`) are treated as dev hints only; production resolves tenant from verified domain/origin
- **Rate limiting** is enabled via Redis throttler — configure `THROTTLER_TTL` and `THROTTLER_LIMIT`
- **MCP server** is disabled by default (`MCP_ENABLED=false`) and requires a 32+ char API key when enabled
- **`ALLOW_TENANT_HEADER_IN_PRODUCTION`** must remain `false` in production deployments

---

## License

Private — All rights reserved.
