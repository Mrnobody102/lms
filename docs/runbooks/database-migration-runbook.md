# Database Migration Runbook

This runbook defines the production-safe Prisma migration workflow for the LMS Platform.

## Rules

- Production uses `pnpm db:deploy` only.
- `db:push` is allowed only for local/dev prototyping.
- `db:reset` is never allowed against a shared or production database.
- Every schema change must include a committed migration folder under `packages/database/prisma/migrations`.
- Take a database backup before applying production migrations.

## Current Migration Chain

The repo currently expects these migrations to be applied in order:

1. `20260119185654_init`
2. `20260121105702_add_user_profile_fields`
3. `20260425000000_add_course_description`
4. `20260425001000_tenant_scoped_user_email`
5. `20260425002000_add_course_enrollments`
6. `20260425003000_align_learning_schema_integrity`

Before deploying, check status:

```bash
pnpm db:status
```

Apply pending migrations:

```bash
pnpm db:deploy
```

## Baseline Existing Production Databases

Use this only when the production database already has the schema but `_prisma_migrations` is empty because it was created by an older `db push` flow.

1. Point `DATABASE_URL` at the production database.
2. Take a backup or snapshot.
3. Verify the real production schema matches the initial migration.
4. Mark existing migrations as applied without running their SQL:

```bash
pnpm db:resolve -- --applied 20260119185654_init
pnpm db:resolve -- --applied 20260121105702_add_user_profile_fields
pnpm db:resolve -- --applied 20260425000000_add_course_description
pnpm db:resolve -- --applied 20260425001000_tenant_scoped_user_email
pnpm db:resolve -- --applied 20260425002000_add_course_enrollments
pnpm db:resolve -- --applied 20260425003000_align_learning_schema_integrity
```

5. Confirm:

```bash
pnpm db:status
```

After baseline is complete, future deploys must use:

```bash
pnpm db:deploy
```

## Tenant-Scoped Learning Integrity Migration

`20260425003000_align_learning_schema_integrity` adds database-level safeguards for the learning domain:

- composite tenant-scoped references for `Lesson`, `UserLessonProgress`, and `CourseEnrollment`
- composite unique keys on `User(id, tenantId)`, `Course(id, tenantId)`, and `Lesson(id, tenantId)`
- defensive creation of missing learning tables/columns for older environments that were previously created by `db push`

Before applying this migration to a long-lived environment, run a data preflight for orphaned or cross-tenant rows in `Lesson`, `UserLessonProgress`, and `CourseEnrollment`. The migration should fail rather than silently keep invalid cross-tenant data.

## Local Development Workflow

Create a migration locally:

```bash
pnpm db:migrate
```

Commit both files:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/<timestamp_name>/migration.sql`

`pnpm db:push` is guarded and refuses to run when `NODE_ENV=production` unless `ALLOW_PRODUCTION_DB_PUSH=true` is explicitly set for an approved emergency.

## Failed Migration Recovery

If `migrate deploy` fails:

1. Stop deploy.
2. Inspect logs and the failed row in `_prisma_migrations`.
3. Fix forward with a new migration whenever possible.
4. If the migration did not apply and must be retried, mark it rolled back:

```bash
pnpm db:resolve -- --rolled-back <migration_name>
```

5. Re-run:

```bash
pnpm db:deploy
```

## Full Rollback

If data integrity is broken:

1. Stop API traffic.
2. Restore the database from the pre-deploy snapshot.
3. Roll back the API image/code to the matching version.
4. Run `pnpm db:status` against the restored database.
5. Re-open traffic only after `/api/health/ready` returns `status: "ok"`.
