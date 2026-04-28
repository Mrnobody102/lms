# Database Operations

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Database Management / Prisma
**Maintainer:** LMS Agent Team

---

## Overview

Guidelines for safe database operations using Prisma in the LMS monorepo. All Prisma schema and migrations live in `packages/database`. The shared Prisma Client is generated once and consumed by `apps/api-server` and any other packages that need database access.

## Core Capabilities

- **safe_migration_planning**: Planning schema changes with proper review steps before execution.
- **tenant_data_seeding**: Initializing sample data for new tenant centers.
- **cross_package_sync**: Generating Prisma Client so all packages in the pnpm workspace share the same types.
- **schema_push_dev**: Using `prisma db push` for rapid iteration in development without migration files.

## When to Use

Use when:

- Running migrations locally or in CI/CD.
- Seeding the database with initial or test data.
- Generating the Prisma Client after schema changes.
- Using `prisma db push` vs `prisma migrate dev` and understanding the trade-offs.

Skip when:

- Making read-only queries (use `db-intelligence` skill for schema analysis).
- The API server is running and you need to add a new query endpoint (use `nestjs-standards`).

## Key Workflows

### Development Workflow

1. Modify `packages/database/prisma/schema.prisma`.
2. Run `pnpm --filter @repo/database generate` to update types.
3. Run `pnpm --filter @repo/database db:migrate` for committed schema changes.
4. Use `pnpm db:push` only for local throwaway prototyping when you explicitly do not need a migration file.
5. Restart the API server to pick up the new Prisma Client.

### Production Migration Workflow

1. Review the migration file before applying.
2. Run `prisma migrate deploy` (not `migrate dev`) in production.
3. Always take a database backup before applying migrations in staging/production.
4. See `references/prisma-workflow.md` for the full checklist.

### Seeding

1. Edit `packages/database/prisma/seed.ts`.
2. Always include `trung-tam-demo` (slug) as the standard test tenant.
3. Link primary models (`User`, `Course`, `Lesson`) to a `tenantId` (UUID).
4. Run seed with `pnpm --filter @repo/database db:seed`.

## Common Pitfalls

| Pitfall                                                     | Fix                                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Using `--force` in production migrations                    | Never use `--force` or `--skip-generate` in production. Always run full migrations with backup.             |
| Forgetting to regenerate Prisma Client after schema changes | Always run `pnpm --filter @repo/database generate` after any schema change, even if not running migrations. |
| Mixing `db push` and `migrate dev` on the same schema       | Use `db push` for dev iteration, `migrate dev` only when you want to create a migration file.               |
| Seeding without a tenantId                                  | Always link seed data to a valid `tenantId` -- foreign key constraints will fail otherwise.                 |
| Running migrations without reviewing the SQL first          | Use `prisma migrate diff` or inspect the migration file before applying.                                    |

## Best Practices

1. **Use `prisma generate`** after every schema change -- even for `db push`, the client types may be stale.
2. **Create named migrations** with `prisma migrate dev --name descriptive_name` instead of unnamed auto-generated ones.
3. **Test migrations locally first** -- apply to a local database, verify data integrity, then deploy.
4. **Keep the seed file idempotent** -- use `upsert` patterns or clear-and-recreate logic so it can be run multiple times safely.
5. **Backup before any destructive migration** -- dropping columns, tables, or changing types can cause data loss.
6. **Review generated SQL** before applying migrations in non-dev environments.

## Related Skills

| Skill            | Use When                                                                    |
| ---------------- | --------------------------------------------------------------------------- |
| db-intelligence  | Analyzing schema structure, planning model changes, reviewing relationships |
| nestjs-standards | Using Prisma in NestJS services, integrating with modules                   |
| testing-strategy | Writing database integration tests with Prisma                              |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
