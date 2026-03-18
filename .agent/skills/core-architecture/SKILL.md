---
name: LMS Core Architecture
description: Guidelines and overview of the LMS Platform monorepo structure, multi-tenancy, and application boundaries.
---

# LMS Core Architecture Skill

This skill provides context and instructions for working within the LMS Platform monorepo.

## 1. Monorepo Structure

- `apps/api-server`: NestJS backend.
- `apps/web-admin`: Next.js 15 dashboard for center administrators.
- `apps/web-student`: Next.js 15 portal for students.
- `packages/database`: Shared Prisma schema and database client.
- `packages/ui`: Shared UI components and design tokens.
- `packages/shared`: Common types, constants, and utilities.

## 2. Multi-Tenancy (Tenant Isolation)

- **Identifier**: Tenants are identified by `slug` (e.g., `trung-tam-demo`).
- **Resolution**: `TenantMiddleware` in the backend resolves tenants from `x-tenant-id` header or subdomains.
- **Frontend Strategy**:
  - Always include `x-tenant-id` in Axios headers.
  - Store `tenantId` (UUID) in local storage after login if needed, but prefer slugs for routing.

## 3. Application Boundaries

- **Admin**: Should use `@/lib/course-api` for management tasks.
- **Student**: Should use its own `@/lib/course-api` (read-only where applicable) and `auth.store.ts`.

## 4. Coding Standards

- **Naming**: Use `fullName` for user names (matches backend `User` model).
- **Styling**: Vanilla CSS for flexibility, Tailwind for layouts.
- **Icons**: Always use `lucide-react`.
