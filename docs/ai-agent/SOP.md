# AI Agent SOP

This SOP defines how humans and AI agents should work in the LMS Platform repo.
It is intentionally practical: use it as the default operating procedure, then adapt only when the task clearly requires it.

## 1. Intake

1. Restate the goal in concrete terms.
2. Identify the touched area: API, database, frontend, shared package, CI/deploy, docs.
3. Read the minimum context needed:
   - `AGENTS.md`
   - `agent-knowledge/lms-platform/CONTEXT.md`
   - relevant skill files from `agent-knowledge/skills/`
   - nearest source files and tests
4. Check `git status --short --branch` before editing.

## 2. Plan

Use a short plan for non-trivial work:

1. Find existing patterns.
2. Make the smallest safe change.
3. Add or update focused tests.
4. Run focused validation.
5. Run full validation before handoff or commit.

Avoid broad rewrites unless the user explicitly asks for a refactor.

## 3. Implementation Rules

- Keep changes close to the requested behavior.
- Use existing modules, DTO patterns, Prisma access patterns, and UI conventions.
- Preserve tenant scoping in every data access path.
- Keep controllers thin; put business logic in services.
- Avoid storing secrets or tokens in documentation examples except clearly fake values.
- Do not commit generated output: `.next`, `dist`, coverage, `*.tsbuildinfo`, Playwright reports.
- If a generated file is already tracked and causes churn, remove it from tracking in a dedicated cleanup.

## 4. Validation

Run focused checks while iterating:

```bash
pnpm --filter api-server test
pnpm --filter api-server typecheck
pnpm --filter web-student typecheck
pnpm --filter @repo/ui typecheck
```

Run final checks before handoff:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Use the PowerShell helper on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/validate-ai-work.ps1
```

## 5. Commit And Push

Only commit when the user asks for it.

1. Re-check `git status --short --branch`.
2. Review staged files with `git diff --cached --stat`.
3. Run at least `pnpm run typecheck`; for production-facing changes, run the full gate.
4. Use conventional commit style:
   - `feat: ...`
   - `fix: ...`
   - `chore: ...`
   - `docs: ...`
   - `test: ...`
5. Push only after the commit succeeds and the working tree is clean.

## 6. Human Handoff

End with:

- Summary of changes.
- Commands run.
- Commands skipped and why.
- Remaining risks.
- Suggested next task.

## 7. Overnight Or Long-Running Work

Long-running autonomous work must have guardrails:

- Use a written task list with acceptance criteria.
- Stay inside the repository.
- Do not drop or reset databases.
- Do not run destructive git commands.
- Do not push unless the user explicitly asked for push.
- Stop and report if a decision affects data loss, security posture, public API compatibility, or migration strategy.
