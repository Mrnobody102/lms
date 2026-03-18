---
name: LMS Database Operations
description: Safe procedures for Prisma schema changes, migrations, and seeding in the monorepo.
---

# LMS Database Operations Skill

Instructions for interacting with the Prisma layer in `packages/database`.

## 1. Schema Updates

- File: `packages/database/prisma/schema.prisma`.
- Command: `npx prisma generate` (from the package directory).
- Sync: Ensure all apps (`api-server`) are restarted after schema changes to pick up new types.

## 2. Migrations

- Use `npx prisma migrate dev --name <description>` for local development.
- Always check `.env` for `DATABASE_URL` before running.

## 3. Seeding

- File: `packages/database/prisma/seed.ts`.
- Command: `pnpm seed` (from the root or database package).
- Important: The seed creates a default tenant `trung-tam-demo`. Any subsequent logic should rely on this slug for consistent testing.

## 4. Model Patterns

- Most models require a `tenantId` (UUID).
- Use `id String @id @default(uuid())` for all IDs for consistency with the existing system.
