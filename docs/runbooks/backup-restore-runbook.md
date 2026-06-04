# Backup, Restore, And Rollback Runbook

This runbook covers launch/early-production operations for the LMS Platform.

## Minimum Backup Policy

- PostgreSQL: take automated daily snapshots plus a manual pre-deploy snapshot before production migrations.
- PostgreSQL retention: keep at least 7 daily snapshots and 4 weekly snapshots unless the tenant contract requires longer.
- Object storage/media: use provider durability plus versioning or daily bucket replication for uploaded audio, video, PDFs, and certificate assets.
- Redis: treat cache/session/queue state as recoverable unless a queue is explicitly documented as requiring replay. Critical side effects must be idempotent in the database.

## PostgreSQL Backup

Managed database platforms should use platform snapshots. For self-hosted compose, run dumps from a trusted host with `DATABASE_URL` pointed at production:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file "backup-$(date +%Y%m%d%H%M%S).dump"
```

Store backup files outside the application host, encrypted at rest.

## PostgreSQL Restore Drill

Run this in staging before production launch and after major schema changes:

1. Create a fresh staging database.
2. Restore the latest production-like dump:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$STAGING_DATABASE_URL" backup.dump
```

3. Point staging API at the restored database.
4. Run:

```bash
pnpm db:status
pnpm run check:data-integrity
pnpm smoke:deploy -- -ApiUrl https://api-staging.example.com -WebStudentUrl https://student-staging.example.com -WebAdminUrl https://admin-staging.example.com -SuperPortalUrl https://portal-staging.example.com
```

5. Record date, source snapshot id, restore duration, and validation result in release notes.

## Object Storage And Media

- Use object storage versioning or replication for the media bucket.
- Confirm restore can recover at least one uploaded audio/video/PDF object and that `MediaAsset` database rows still point to valid keys.
- If a file is missing but the database row exists, mark the asset unavailable and notify the tenant operator; do not silently serve a broken signed URL.

## Redis And Queue Recovery

- Redis may be flushed/restored from provider backup for cache/session recovery.
- User-facing durable state must live in PostgreSQL, not Redis.
- If queue jobs are added later, jobs that call external providers or send notifications must have database idempotency keys before replay.

## Rollback Decision Tree

- Code-only regression, no migration applied: redeploy the previous API/web images and run smoke.
- Migration failed before applying data changes: stop deploy, follow `database-migration-runbook.md`, fix forward or mark migration rolled back.
- Migration applied and data integrity is broken: stop public traffic at Caddy, restore the pre-deploy database snapshot, redeploy matching previous images, then run readiness and data integrity checks.
- Object storage regression: roll back code, keep database unchanged unless media metadata was corrupted.

Traffic can reopen only after:

```bash
pnpm run check:data-integrity
pnpm smoke:deploy -- -ApiUrl <api-url> -WebStudentUrl <student-url> -WebAdminUrl <admin-url> -SuperPortalUrl <portal-url>
```
