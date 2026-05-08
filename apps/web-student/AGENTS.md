# Web Student — Agent Guide

Read the root `AGENTS.md` first. This file adds context specific to `apps/web-student`.

## Quick Reference

- **Framework**: Next.js 16 (App Router)
- **Port**: 3000
- **i18n**: `next-intl` with `[locale]` routing (Vietnamese + English)
- **State**: Zustand (auth), React Query v5 (server state)

## Structure

```
src/
  app/[locale]/          # Pages with locale segment
  features/              # Feature-based modules
    auth/
      auth.store.ts      # Shared auth store from @repo/shared
      components/
  components/            # Shared app-level components
  lib/
    api.ts               # Shared API client from @repo/api-client
  messages/
    vi.json              # Vietnamese translations
    en.json              # English translations
  navigation.ts          # i18n-aware Link, useRouter, usePathname
```

## Rules

- Default to Server Components. Add `'use client'` only when needed.
- Use `@repo/api-client` for all API calls — never create custom axios instances.
- Use `@repo/shared` auth store — never create custom auth stores.
- Import `Link` from `src/navigation.ts`, not `next/link`.
- All user-facing strings in `vi.json` AND `en.json`.
- Add `loading.tsx` + `error.tsx` for all main route segments.
- Use `lucide-react` for icons, `next/image` for images.

## Key Skills

- `agent-knowledge/skills/senior-frontend/SKILL.md`
- `agent-knowledge/skills/nextjs-standards/SKILL.md`
- `agent-knowledge/skills/i18n-workflow/SKILL.md`

## Validation

```bash
pnpm --filter web-student typecheck
pnpm --filter web-student test:e2e
```
