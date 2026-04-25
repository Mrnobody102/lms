# Database And Migration Guide

This guide is for day-to-day database work. The production procedure is defined in [database-migration-runbook.md](../runbooks/database-migration-runbook.md).

## Local Services

Start PostgreSQL and Redis:

```bash
pnpm db:up
```

Stop them:

```bash
pnpm db:down
```

## Common Commands

| Command                                    | Use                                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `pnpm db:migrate`                          | Create and apply a local Prisma migration.                       |
| `pnpm db:deploy`                           | Apply committed migrations. This is the production-safe command. |
| `pnpm db:status`                           | Inspect migration state.                                         |
| `pnpm db:resolve -- --applied <migration>` | Mark an existing migration as already applied during baseline.   |
| `pnpm db:seed`                             | Seed demo tenant, admin, student, courses, and lessons.          |
| `pnpm db:studio`                           | Open Prisma Studio.                                              |
| `pnpm db:push`                             | Local/dev prototype only. Guarded against `NODE_ENV=production`. |

## Local Migration Workflow

1. Edit `packages/database/prisma/schema.prisma`.
2. Generate a migration:

```bash
pnpm db:migrate
```

3. Review the generated SQL under `packages/database/prisma/migrations`.
4. Run tests/build that cover the changed schema.
5. Commit both schema and migration files.

## Production Rule

Production deploys must use:

```bash
pnpm db:deploy
```

Never use `db:push` or `db:reset` against production.

## Connection String

Local default:

```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5433/lms_platform?schema=public"
```

## Troubleshooting

- `P1001` or connection refused: verify Docker is running and port `5433` is free.
- Migration drift: run `pnpm db:status`, then follow the production runbook before changing shared databases.
- Failed production migration: stop deploy and follow the recovery section in the runbook.
