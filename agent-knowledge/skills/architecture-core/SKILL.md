# Architecture Core

**Tier:** POWERFUL
**Category:** Engineering / Architecture
**Domain:** Monorepo & Multi-Tenancy
**Maintainer:** LMS Agent Team

---

## Overview

This skill provides a comprehensive understanding of the LMS Platform monorepo structure, multi-tenancy mechanisms, and application boundaries. It is the foundation for all NestJS and Next.js development across the platform.

## Core Capabilities

- **monorepo_navigation**: Locate services within the pnpm + Turborepo workspace.
- **multi_tenant_isolation**: Ensure tenant-scoped data isolation via `tenantId` and `slug`.
- **cross_repo_standards**: Enforce consistent naming, styling, and architecture across apps.
- **package_boundaries**: Understand what lives in shared packages vs. app-specific code.

## When to Use

Use when:
- Creating new NestJS modules, controllers, or services in the API server
- Adding pages, components, or API routes in web-admin or web-student
- Introducing shared utilities, types, or UI components
- Implementing multi-tenant features requiring tenant isolation
- Planning cross-cutting changes that affect multiple apps

Skip when:
- Working on a single isolated feature with no shared code impact
- Editing only static assets (images, fonts) with no code involvement

## Key Workflows

### Navigate the Monorepo

1. Identify the target app: `apps/api-server` (NestJS), `apps/web-admin`, or `apps/web-student`
2. Check `packages/database` for Prisma schema changes
3. Check `packages/ui` before creating new shared components
4. Run affected apps with `pnpm --filter <app> dev`

### Implement a New API Feature

1. Create module directory under `apps/api-server/src/modules/<feature>/`
2. Follow the existing module pattern: `module`, `controller`, `service`, `dto/`, `entities/`
3. Register the module in `apps/api-server/src/app.module.ts`
4. Add Prisma schema fields in `packages/database/prisma/schema.prisma`
5. Generate migration: `pnpm --filter @lms/database prisma:migrate`
6. Regenerate client: `pnpm --filter @lms/database prisma:generate`

### Implement a New Frontend Feature

1. Identify the correct app (`web-admin` or `web-student`)
2. Use shared components from `packages/ui` when available
3. Prefer Vanilla CSS for component styles; use Tailwind for page layouts
4. Use `lucide-react` for all icons
5. Add API client calls via the shared API client pattern (axios interceptors)

### Add Multi-Tenant Feature

1. Ensure the tenant context is available (slug from URL or `x-tenant-id` header)
2. Apply `tenantId` filtering in Prisma queries: `where: { tenantId: ctx.tenant.id }`
3. Set `tenantId` automatically on create operations via middleware/interceptor
4. Validate tenant access in guards before data operations

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Hardcoding user names instead of using `fullName` | Always use the `fullName` field from the User model |
| Creating duplicate components instead of reusing from `packages/ui` | Check `packages/ui/src` before creating new components |
| Missing `tenantId` in Prisma create/update operations | Always set `tenantId` via middleware or service layer |
| Using mixed icon libraries | Only use `lucide-react` throughout the project |
| Putting business logic in Next.js route handlers or NestJS controllers | Keep services for logic; controllers/routes only handle HTTP |
| Forgetting to regenerate Prisma client after schema changes | Run `pnpm --filter @lms/database prisma:generate` after every schema change |

## Best Practices

1. Always check `packages/ui` and `packages/database` before creating new files
2. Use `fullName` (not `firstName`/`lastName`) for user-facing name fields
3. Apply `tenantId` scoping to every Prisma query that reads or writes tenant data
4. Prefer Vanilla CSS for isolated components; use Tailwind for layout and utility classes
5. Use `lucide-react` exclusively for icons; do not mix with other icon libraries
6. Keep NestJS business logic in services, never in controllers
7. Use Turborepo's `--filter` flag to run commands on specific apps only

## Monorepo Structure

| Path | Description |
|---|---|
| `apps/api-server` | NestJS backend with modular structure under `src/modules/` |
| `apps/web-admin` | Next.js 15 admin dashboard |
| `apps/web-student` | Next.js 15 student learning portal |
| `apps/super-portal` | Next.js 15 public/marketing portal |
| `packages/database` | Prisma schema and generated client |
| `packages/ui` | Shared React components, theme, language toggles |
| `packages/shared` | Shared types, constants, and utilities |
| `packages/validation` | Shared Zod/class-validator schemas |

## Related Skills

| Skill | Use When |
|---|---|
| api-design-reviewer | Designing new API endpoints within the correct module structure |
| code-architecture | Deep-diving into service layer patterns and module design |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
