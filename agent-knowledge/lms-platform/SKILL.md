# LMS Platform Skill Index

**Tier:** Skill index
**Maintainer:** LMS Platform team

This file maps user requests to the local skills in `agent-knowledge/skills/`.
For the complete operating procedure, read `AGENTS.md` and `docs/ai-agent/SOP.md`.

## Required Startup Context

1. `AGENTS.md`
2. `agent-knowledge/lms-platform/CONTEXT.md`
3. Relevant skill files only
4. Nearest source files and tests

Do not load the whole `agent-knowledge/skills/` tree by default.

## Skill Map

| User intent                                              | Skill files                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| Architecture review, shared boundaries, tenant isolation | `architecture-core`, `monorepo-navigator`                   |
| Feature planning, task breakdown                         | `engineering-planning`                                      |
| API endpoint, service, DTO, guard                        | `senior-backend`, `nestjs-standards`, `api-design-reviewer` |
| Auth, cookie, JWT, role behavior                         | `auth-standards`, `senior-backend`                          |
| Prisma schema, migration, data safety                    | `db-intelligence`, `database-operations`                    |
| Next.js page/component/UI                                | `senior-frontend`, `nextjs-standards`                       |
| Translation/i18n                                         | `i18n-workflow`                                             |
| Unit/integration/E2E testing                             | `testing-strategy`, `test-suite-builder`, `playwright-pro`  |
| Docker, CI, production deploy                            | `deployment-ops`                                            |
| MCP tool design                                          | `mcp-server-builder`                                        |

## Project Rules For Every Skill

- Preserve tenant isolation.
- Keep changes scoped to the request.
- Reuse existing project patterns first.
- Add focused tests for risky behavior changes.
- Run the validation gate listed in `AGENTS.md`.

## Quick References

- API docs: `docs/api-documentation.md`
- Architecture: `docs/ARCHITECTURE.md`
- Operations: `docs/ops/deployment.md`
- Testing: `docs/guides/testing.md`
- Project structure: `PROJECT_STRUCTURE.md`
