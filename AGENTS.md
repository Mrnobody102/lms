# LMS Platform Agent Guide

<!-- last-updated: 2026-05-14 -->
<!-- schema-version: 2.2 -->

This file is the root instruction entrypoint for **ANY** AI coding agent (Cursor, Claude Code, Gemini, GPT) working in this repository.

## 🚀 AI Governance & Master Rules

Every AI agent MUST follow these "Hard Rules" to maintain monorepo integrity:

1.  **Standardized API Responses**: ALL `api-server` endpoints must return data wrapped by `TransformInterceptor`: `{ success: true, data: ..., timestamp: ... }`.
    - **Exceptions**: Health checks (`/health`), Metrics (`/metrics`), and Binary streams (PDF, Video) should bypass wrapping.
2.  **Tenant Isolation**: Every tenant-scoped Prisma read/write MUST include `tenantId` context. Use `LearningAccessService` for enrollment checks.
3.  **Clean Test Lifecycle**: Every integration test (`.spec.ts`) MUST ensure `app.close()` is called in `afterAll` or `afterEach` and database state is deterministic.
4.  **No `any` Policy**: Do not use `any`. Define interfaces or use `unknown` with type guards.
5.  **Middleware vs Proxy**: Use `middleware.ts` for all Next.js portals. `proxy.ts` is deprecated.
6.  **Strict Linting**: Follow `unused-imports` and `import-sorting` rules. Run `pnpm lint` before finishing.
7.  **i18n Sync**: Always update both `vi.json` and `en.json` when adding UI text.

## 📁 Rule System Structure

1.  **Global Standards**: `AGENTS.md` (this file) and `CONTRIBUTING.md`.
2.  **Cursor Rules**: `.cursor/rules/*.mdc` (Auto-attaches based on file patterns).
3.  **Technical Skills**: Deep-dive patterns in `agent-knowledge/skills/`.

## 🛠️ Skill Routing

| Task                   | Read Skill File                                       |
| :--------------------- | :---------------------------------------------------- |
| **Backend / NestJS**   | `agent-knowledge/skills/nestjs-standards/SKILL.md`    |
| **Frontend / Next.js** | `agent-knowledge/skills/nextjs-standards/SKILL.md`    |
| **API Design**         | `agent-knowledge/skills/api-design-reviewer/SKILL.md` |
| **Database / Prisma**  | `agent-knowledge/skills/db-intelligence/SKILL.md`     |
| **i18n Workflow**      | `agent-knowledge/skills/i18n-workflow/SKILL.md`       |
| **Testing**            | `agent-knowledge/skills/testing-strategy/SKILL.md`    |

## 🏗️ Project Snapshot

- **Monorepo**: pnpm 9 + Turborepo.
- **Apps**: `api-server` (4000), `web-student` (3000), `web-admin` (3001), `super-portal` (3002).
- **Core Stack**: NestJS, Next.js (App Router), Prisma, Tailwind CSS, Zustand, React Query v5.

## ✅ Validation Gate

Before handoff, run:

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File ./scripts/validate-ai-work.ps1
```

Or manually:

```bash
pnpm lint
pnpm run typecheck
pnpm run test
```

## 📝 Documentation Map

- `docs/ARCHITECTURE.md`: System boundaries and tenant model.
- `docs/api-documentation.md`: Standardized API contracts.
- `docs/product/PLAN.md`: Overall roadmap and current phase status.
- `docs/ai-agent/SOP.md`: Working procedure for agents.
