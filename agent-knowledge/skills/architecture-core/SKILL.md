# Architecture Core

**Tier:** POWERFUL  
**Category:** Engineering / Architecture  
**Maintainer:** LMS Agent Team

---

## Overview

This skill provides a comprehensive understanding of the LMS Platform monorepo structure, multi-tenancy mechanisms, and application boundaries.

## Core Capabilities

- **monorepo_navigation**: Deep understanding of service locations (`api-server`), web apps (`admin`, `student`), and shared packages.
- **multi_tenant_isolation**: Mastery of `tenantId` and `slug` handling to ensure data isolation between centers.
- **cross_repo_standards**: Enforcing consistent naming conventions (e.g., `fullName`) and architecture across dynamic services.

## Monorepo Structure

- `apps/api-server`: Centralized NestJS backend.
- `apps/web-admin`: Dashboard for center administrators (Next.js 15).
- `apps/web-student`: Learning portal for students (Next.js 15).
- `packages/database`: Shared Prisma schema and database client.
- `packages/ui`: Shared UI components (Theme, Language toggles).

## Multi-Tenancy

- **Identification**: Based on URL `slug` or `x-tenant-id` header.
- **Mechanism**: Backend middleware automatically attaches `tenantId` to the request context.
- **Frontend**: Always include the necessary headers in Axios interceptors.

## Coding Standards

- **User Model**: Always use `fullName` (matching the backend `User` model).
- **Styling**: Prefer Vanilla CSS for components and Tailwind for layouts.
- **Icons**: Exclusively use `lucide-react`.
