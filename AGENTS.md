# LMS Platform Agent Guide

<!-- last-updated: 2026-05-09 -->
<!-- schema-version: 2.1 -->

This file is the root instruction entrypoint for AI coding agents working in this repository.
Keep it short, operational, and consistent with the repo's CI.

Per-app `AGENTS.md` files exist in `apps/*/` and `packages/database/` for scoped context.

## AI Governance & Automation

This project uses a tiered rule system to ensure consistency across AI agent sessions:

1. **Global Standards**: Defined in `CLAUDE.md` and `CURSOR.md` at the root. Always followed.
2. **Automated Rules**: Located in `.cursor/rules/*.mdc`. These rules automatically attach to your context based on the files you are editing:
   - `api-server.mdc`: Backend standards (NestJS, Security).
   - `web-portals.mdc`: Frontend standards (Next.js, i18n, UI).
   - `monorepo.mdc`: Cross-package integrity.
   - `database.mdc`: Prisma and migration safety.
3. **Skill Knowledge**: Deep-dive patterns in `agent-knowledge/skills/`.

## Project Snapshot

- Monorepo: pnpm 9 + Turborepo.
- Apps:
  - `apps/api-server`: NestJS REST API on port 4000.
  - `apps/web-student`: Next.js student portal on port 3000.
  - `apps/web-admin`: Next.js admin portal on port 3001.
  - `apps/super-portal`: Next.js super admin portal on port 3002.
- Shared packages:
  - `packages/database`: Prisma schema, migrations, generated client.
  - `packages/shared`: shared constants, auth store, security helpers.
  - `packages/api-client`: shared API client.
  - `packages/ui`: shared UI components.

## First Files To Read

1. `README.md` for project setup.
2. `docs/ARCHITECTURE.md` for system boundaries and tenant model.
3. `docs/README.md` for documentation map.
4. `agent-knowledge/lms-platform/CONTEXT.md` for domain context.
5. `docs/ai-agent/SOP.md` for the working procedure.

Load only the skill files relevant to the task from `agent-knowledge/skills/`.

## Skill Routing

Use these skills as task-specific context:

| Task                           | Read                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture or cross-app work | `agent-knowledge/skills/architecture-core/SKILL.md`, `agent-knowledge/skills/monorepo-navigator/SKILL.md`                                                   |
| Backend/API                    | `agent-knowledge/skills/senior-backend/SKILL.md`, `agent-knowledge/skills/nestjs-standards/SKILL.md`, `agent-knowledge/skills/api-design-reviewer/SKILL.md` |
| Auth/security                  | `agent-knowledge/skills/auth-standards/SKILL.md`, `agent-knowledge/skills/senior-backend/references/security-practices.md`                                  |
| Database/Prisma                | `agent-knowledge/skills/db-intelligence/SKILL.md`, `agent-knowledge/skills/database-operations/SKILL.md`                                                    |
| Frontend/UI                    | `agent-knowledge/skills/senior-frontend/SKILL.md`, `agent-knowledge/skills/nextjs-standards/SKILL.md`                                                       |
| i18n                           | `agent-knowledge/skills/i18n-workflow/SKILL.md`                                                                                                             |
| Testing                        | `agent-knowledge/skills/testing-strategy/SKILL.md`, `agent-knowledge/skills/test-suite-builder/SKILL.md`, `agent-knowledge/skills/playwright-pro/SKILL.md`  |
| Deployment/CI                  | `agent-knowledge/skills/deployment-ops/SKILL.md`, `docs/ops/deployment.md`                                                                                  |
| Code review / codebase audit   | `agent-knowledge/skills/code-review/SKILL.md` (cross-cutting — loads other skills as needed)                                                                |
| Security audit                 | `agent-knowledge/skills/code-review/SKILL.md`, `agent-knowledge/skills/auth-standards/SKILL.md`                                                             |

## Working Rules

- Preserve tenant isolation. Every tenant-scoped Prisma read/write must include tenant context.
- Do not expose internal error messages or stack traces to clients.
- Prefer existing patterns over new abstractions.
- Keep edits scoped. Do not refactor unrelated code.
- Do not commit generated outputs such as `.next`, `dist`, coverage, or `*.tsbuildinfo`.
- Do not modify `.env` or secrets. Use `.env.example` for documented variables.
- Update both `vi.json` and `en.json` when adding user-facing text.
- For shared package changes, check dependents with typecheck/build.
- If a command needs Docker and Docker is unavailable, record that explicitly.

## Validation Gates

Use the smallest meaningful gate while iterating, then run the final gate before handoff.

Fast focused checks:

```bash
pnpm --filter api-server test
pnpm --filter api-server typecheck
pnpm --filter @repo/ui typecheck
```

Full handoff checks:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Windows helper:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/validate-ai-work.ps1
```

## Handoff Format

When finishing, report:

- What changed.
- Tests/commands run and whether they passed.
- Any command not run and why.
- Remaining risks or recommended next task.
