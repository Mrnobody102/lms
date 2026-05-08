# Super Portal — Agent Guide

Read the root `AGENTS.md` first. This file adds context specific to `apps/super-portal`.

## Quick Reference

- **Framework**: Next.js 16 (App Router)
- **Port**: 3002
- **i18n**: `next-intl` with `[locale]` routing (Vietnamese + English)
- **Role**: `SUPER_ADMIN` only — manages tenants, platform settings, and cross-tenant operations.

## Rules

- Same frontend rules as `web-student` and `web-admin`.
- Super portal is **not tenant-scoped** — it operates across tenants.
- Tenant CRUD and platform management are the primary features.
- Must validate `SUPER_ADMIN` role before rendering admin features.

## Key Skills

- `agent-knowledge/skills/senior-frontend/SKILL.md`
- `agent-knowledge/skills/nextjs-standards/SKILL.md`

## Validation

```bash
pnpm --filter super-portal typecheck
pnpm --filter super-portal test:e2e
```
