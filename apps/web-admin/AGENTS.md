# Web Admin — Agent Guide

Read the root `AGENTS.md` first. This file adds context specific to `apps/web-admin`.

## Quick Reference

- **Framework**: Next.js 16 (App Router)
- **Port**: 3001
- **i18n**: `next-intl` with `[locale]` routing (Vietnamese + English)
- **State**: Zustand (auth), React Query v5 (server state)

## Structure

Same layout as `web-student`. Admin-specific features include course management, lesson CRUD, user management, and reporting dashboards.

## Rules

- Same rules as `web-student` (see root `AGENTS.md`).
- Admin mutations require proper role checks (`ADMIN` or `SUPER_ADMIN`).
- Dashboard components should handle empty states gracefully.
- Table/list views should support pagination.

## Key Skills

- `agent-knowledge/skills/senior-frontend/SKILL.md`
- `agent-knowledge/skills/nextjs-standards/SKILL.md`
- `agent-knowledge/skills/i18n-workflow/SKILL.md`

## Validation

```bash
pnpm --filter web-admin typecheck
pnpm --filter web-admin test:e2e
```
