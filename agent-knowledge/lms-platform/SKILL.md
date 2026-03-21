# LMS Platform

**Tier:** OVERVIEW
**Category:** Project Context
**Maintainer:** LMS Agent Team

---

## Overview

LMS Platform is a multi-tenant Learning Management System built as a TypeScript monorepo using pnpm workspaces, Turborepo, NestJS, and Next.js 15. This overview skill provides context about the project structure, conventions, and cross-cutting concerns that all other skills should reference.

---

## Project Architecture

### Monorepo Structure

```
lms-platform/
├── apps/
│   ├── api-server/          # NestJS backend (REST API)
│   ├── web-admin/           # Next.js 15 admin dashboard
│   └── web-student/         # Next.js 15 student portal
├── packages/
│   ├── database/            # Prisma schema and client
│   ├── ui/                 # Shared UI components
│   └── shared/             # Common types, constants, utils
├── agent-knowledge/         # This directory
│   ├── lms-platform/       # Project overview (this file)
│   └── skills/             # Domain-specific skills
├── turbo.json               # Turborepo pipeline config
└── pnpm-workspace.yaml      # pnpm workspace definition
```

### Technology Stack

| Layer           | Technology               | Notes                                             |
| --------------- | ------------------------ | ------------------------------------------------- |
| Backend         | NestJS                   | TypeScript, Prisma, class-validator, Swagger      |
| Frontend        | Next.js 15               | App Router, React Server Components, Tailwind CSS |
| Database        | PostgreSQL               | Prisma ORM, multi-tenant via `tenantId`           |
| State (Client)  | Zustand + React Query v5 | Auth via Zustand, server state via TanStack Query |
| i18n            | next-intl                | Vietnamese and English                            |
| Package Manager | pnpm                     | Workspaces                                        |
| Build Tool      | Turborepo                | Remote caching, selective builds                  |

---

## Multi-Tenancy

- **Identifier**: `slug` (URL-friendly string, e.g., `trung-tam-demo`) for routing.
- **Database**: `tenantId` (UUID) links all tenant-scoped records.
- **Backend**: `TenantMiddleware` extracts `x-tenant-id` header and injects into request context.
- **Frontend**: Always include `x-tenant-id` in Axios request headers.

---

## Naming Conventions

| Entity           | Convention | Example                            |
| ---------------- | ---------- | ---------------------------------- |
| User name field  | `fullName` | `{ "fullName": "Nguyen Van A" }`   |
| File naming      | kebab-case | `auth-store.ts`, `course-card.tsx` |
| Component naming | PascalCase | `CourseCard`, `LessonSidebar`      |
| API route naming | kebab-case | `/api/v1/user-profiles`            |
| DTO property     | camelCase  | `{ "createdAt": "..." }`           |

---

## Coding Standards

- **Backend logic** lives in Services, not Controllers.
- **Validation** via `class-validator` decorators. Global `ValidationPipe` with `whitelist: true`.
- **Swagger docs** on every endpoint: `@ApiOperation` + `@ApiResponse` decorators.
- **Styling**: Vanilla CSS for component-level styles; Tailwind for layout and page-level.
- **Icons**: `lucide-react` exclusively.
- **Images**: `next/image` for all images (auto-optimization).
- **Server vs Client**: Prefer React Server Components. Add `'use client'` only when needed.

---

## Shared Patterns

### API Client Configuration

```typescript
// apps/web-admin/src/lib/api.ts
import { createApiClient } from '@repo/api-client';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  onUnauthorized: () => {
    /* redirect to login */
  },
});
```

All apps use `createApiClient` from `@repo/api-client` which handles token injection, tenant headers, and 401 redirects automatically.

### i18n (next-intl)

```typescript
// Client component
import { useTranslations } from 'next-intl';
const t = useTranslations('Course');

// Server component
import { getMessages } from '@/lib/i18n';
const t = await getMessages();
```

---

## Environment Variables

| Variable              | Where                        | Description                  |
| --------------------- | ---------------------------- | ---------------------------- |
| `DATABASE_URL`        | api-server, database package | PostgreSQL connection string |
| `JWT_SECRET`          | api-server                   | JWT signing secret           |
| `NEXT_PUBLIC_API_URL` | web-admin, web-student       | Backend API base URL         |
| `NEXT_PUBLIC_APP_URL` | web-admin, web-student       | Frontend base URL            |

---

## Related Skills

| Skill                | Use When                                         |
| -------------------- | ------------------------------------------------ |
| architecture-core    | Understanding app boundaries and monorepo layout |
| auth-standards       | Implementing login, registration, JWT flow       |
| database-operations  | Running migrations, seeding, Prisma changes      |
| db-intelligence      | Planning schema changes safely                   |
| nestjs-standards     | Building API endpoints with NestJS               |
| nextjs-standards     | Building frontend pages and components           |
| i18n-workflow        | Adding or updating translations                  |
| testing-strategy     | Writing unit and integration tests               |
| test-suite-builder   | Generating API test scaffolds                    |
| engineering-planning | Planning new features or refactors               |
| deployment-ops       | Dockerizing or setting up CI/CD                  |
| api-design-reviewer  | Designing or reviewing API endpoints             |
| mcp-server-builder   | Building MCP tools from API contracts            |

---

## Reference Documentation

→ See `skills/*/references/` for domain-specific deep-dive documentation.
