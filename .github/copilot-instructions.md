# GitHub Copilot Project Instructions

Read `AGENTS.md` first. It is the canonical project-level instruction file for all AI coding agents in this repo.

## Key References

- Domain context: `agent-knowledge/lms-platform/CONTEXT.md`
- Agent SOP: `docs/ai-agent/SOP.md`
- Architecture: `docs/ARCHITECTURE.md`
- Skill routing: `agent-knowledge/lms-platform/SKILL.md`
- Deployment: `docs/ops/deployment.md`

## Critical Rules

- Preserve tenant isolation — every tenant-scoped Prisma query must include `tenantId`.
- Keep changes scoped — do not refactor unrelated code.
- Update both `vi.json` and `en.json` when adding user-facing text.
- Do not commit generated outputs (`.next`, `dist`, coverage, `*.tsbuildinfo`).
- Do not modify `.env` or secrets. Use `.env.example` for documented variables.
- Run the validation gate that matches the size of the change before handoff.
