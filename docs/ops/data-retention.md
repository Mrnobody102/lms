# Data Integrity, Retention, And Privacy Policy

This policy is the Batch 17 baseline for launch/early-production operations.

## Release Gate

Every production release candidate must run:

```bash
pnpm run check:data-integrity
```

The check is read-only and must not repair production data automatically.

## Retention Defaults

- Learner profile, enrollment, progress, practice, exam, SRS, and certificate records: retain while the tenant account is active.
- Audit logs for sensitive admin/super-admin actions: retain for at least 365 days.
- Billing and usage ledger records: retain for at least 7 years where applicable.
- Uploaded media: retain while referenced by active course/lesson/practice/exam content, then follow tenant deletion policy.
- Temporary reset/session/security tokens: expire according to token TTL and are not long-term records.

## Export And Deletion

- Tenant data export must include users, enrollments, learning progress, attempts, certificates, media metadata, and audit logs.
- Deletion requests should prefer soft-deactivation where legal/business records must remain.
- Hard deletion of learner PII requires a runbook entry, operator approval, and a post-delete integrity check.
- Certificates should preserve verify code integrity; if learner PII must be redacted, the public certificate view must show a revoked/redacted status rather than mismatched data.

## Audit Coverage

Sensitive operations must have audit trail coverage or a documented exception:

- tenant activation/deactivation/restore
- user role/status changes
- enrollment bulk changes
- course publish/unpublish
- certificate issue/revoke
- billing/payment/admin plan changes
- media upload status changes for tenant-owned assets

## Operational Rules

- Do not use `db:push` on production.
- Do not run automatic repair scripts against production without a backup and written recovery note.
- Data integrity failures block release until triaged as a real defect or a documented false positive.
