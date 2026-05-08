# Database Package — Agent Guide

Read the root `AGENTS.md` first. This file adds context specific to `packages/database`.

## Quick Reference

- **ORM**: Prisma
- **Schema**: `prisma/schema.prisma`
- **Generated Client**: consumed by `apps/api-server` and other packages

## Schema Conventions

- UUID primary keys: `@id @default(uuid())`
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Tenant scoping: `tenantId String` + `@relation` to Tenant on all tenant models
- Indexes: `@@index` on foreign keys and frequently filtered columns
- Relations: defined on both sides

## Commands

```bash
pnpm --filter @repo/database generate     # Regenerate Prisma Client
pnpm --filter @repo/database db:migrate   # Create and apply migration
pnpm --filter @repo/database db:push      # Push schema (dev only, no migration file)
pnpm --filter @repo/database db:seed      # Seed database
pnpm --filter @repo/database db:studio    # Open Prisma Studio
```

## Safety Rules

- Always run `generate` after schema changes.
- Use `db:migrate` for committed changes, `db:push` only for throwaway prototyping.
- Never use `--force` in production migrations.
- Review generated SQL before applying to non-dev environments.
- Backup before destructive migrations.

## Key Skills

- `agent-knowledge/skills/db-intelligence/SKILL.md`
- `agent-knowledge/skills/database-operations/SKILL.md`
