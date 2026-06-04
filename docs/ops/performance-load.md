# Performance And Load Baseline

Batch 17 requires load evidence before claiming production readiness beyond a small launch.

## Baseline Command

Public health-only baseline:

```bash
LMS_LOAD_API_URL=https://api.example.com \
pnpm run load:baseline -- --duration-seconds 60 --concurrency 8
```

Public catalog baseline with tenant resolved from origin/domain:

```bash
LMS_LOAD_API_URL=https://api.example.com \
LMS_LOAD_ORIGIN=https://courses.example.com \
pnpm run load:baseline -- --duration-seconds 60 --concurrency 8
```

Authenticated baseline for course, practice, exam, and reports:

```bash
LMS_LOAD_API_URL=https://api.example.com \
LMS_LOAD_ORIGIN=https://courses.example.com \
LMS_LOAD_AUTH_COOKIE='<staging-auth-cookie>' \
pnpm run load:baseline -- --duration-seconds 120 --concurrency 16
```

The script prints JSON with request count, status counts, failure rate, average latency, p95, and p99 by scenario.

## Scenarios Covered

- `health-ready`: API readiness.
- `public-catalog`: published course list for a tenant.
- `course-list`: authenticated course list.
- `practice-sets`: authenticated practice set list.
- `exam-list`: authenticated exam list.
- `reports-risk-flags`: authenticated admin reporting list.

Authenticated scenarios are skipped unless `LMS_LOAD_AUTH_COOKIE` is provided. Public catalog is skipped unless `LMS_LOAD_ORIGIN` is provided.

## Acceptance For Launch

- Failure rate is 0 for all included scenarios.
- p95 and p99 are recorded in release notes.
- Any endpoint above the agreed target is triaged with query plan/index review before claiming 10k-100k readiness.
- Large admin/reporting lists must remain paginated or bounded.

## Evidence Storage

Store output in release notes or an ops evidence folder outside the app runtime. Include:

- git commit SHA
- staging domain set
- duration and concurrency
- database size or seed profile
- p95/p99 JSON output
- known skipped scenarios and why
