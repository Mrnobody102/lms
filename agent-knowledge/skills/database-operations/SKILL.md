# Database Operations

**Tier:** POWERFUL  
**Category:** Engineering / DevOps  
**Maintainer:** LMS Agent Team

---

## Overview

Guidelines for safe database operations using Prisma, Migrations, and Seeding in a monorepo environment.

## Core Capabilities

- **safe_migration_plan**: Planning schema changes without system disruption.
- **tenant_data_seeding**: Initializing sample data for new centers (Tenants).
- **cross_package_sync**: Synchronizing Prisma Client between the `database` package and the `apps`.

## Schema Change Workflow

1. Modify `packages/database/prisma/schema.prisma`.
2. Run `npx prisma generate` in the package directory to update types.
3. Run `npx prisma migrate dev` to apply changes and create migration files.

## Seeding

- Main file: `packages/database/prisma/seed.ts`.
- Always initialize `trung-tam-demo` (slug) as the standard test environment.
- Primary models (`User`, `Course`, `Lesson`) must be linked to a `tenantId` (UUID).

## Important Notes

- Never use `--force` in the production environment.
- Check for backward compatibility before deleting columns or tables.
