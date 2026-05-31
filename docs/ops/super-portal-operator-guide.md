# Super Portal Operator Guide

Last updated: 2026-05-31

## Purpose

Super Portal is the platform operations console for `SUPER_ADMIN` users. It must show real data only. If an operation is not backed by an API/database source, the UI should display an empty or unavailable state instead of fabricated rows.

## Data Flow

- Tenant list and tenant edit: `GET/POST/PUT/DELETE /api/admin/tenants`.
- Tenant operations overview: `GET /api/admin/tenants/:id/overview`.
- Usage and storage: `GET /api/admin/platform/usage`, backed by `MediaAsset`, `UsageLedger`, and in-memory request metrics.
- Billing: `GET /api/admin/platform/billing`, backed by `BillingPlan`, `TenantSubscription`, `Invoice`, and `Payment`.
- Domains: `GET /api/admin/platform/domains`, backed by `Tenant.domain` and `tenant.settings.domain`.
- Feature flags: `GET /api/admin/platform/feature-flags` and `PATCH /api/admin/platform/feature-flags/:tenantId`, persisted to `tenant.settings.featureFlags`.
- Audit logs: `GET /api/admin/platform/audit-logs`, backed by `AuditLog`.
- Incidents: `GET /api/admin/platform/incidents`, derived from real audit failures and request metrics.

## Operating Rules

- Use tenant detail before making changes: verify active status, domain, subscription, usage, and recent audit logs.
- Feature flag changes are effective after the tenant portal reads refreshed settings/API policy.
- Subscription quota updates must be treated as production changes and verified in audit logs.
- Domain status is only `configured` or `missing` until real DNS/SSL verification is implemented.
- Incident rows are derived signals, not a full incident-management system.

## Release Checks

Run before releasing Super Portal changes:

```bash
pnpm --filter api-server run test
pnpm --filter super-portal run lint
pnpm --filter super-portal run typecheck
pnpm --filter super-portal test:e2e -- --project=chromium
pnpm run check:contracts
```

## Rollback Notes

- UI-only Super Portal failures can roll back the `super-portal` deployment.
- API contract failures require rolling back `api-server` and `super-portal` together if the frontend depends on new endpoints.
- No database migration is required for the current real-ops implementation; feature flags use existing tenant JSON settings.
