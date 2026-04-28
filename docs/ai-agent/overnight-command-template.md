# Long-Running Agent Task Template

Use this template when asking an AI coding agent to work for an extended period.
Prefer bounded tasks with clear acceptance criteria over open-ended "work overnight" instructions.

## Prompt Template

```text
You are working in the LMS Platform repo.

Read first:
- AGENTS.md
- docs/ai-agent/SOP.md
- agent-knowledge/lms-platform/CONTEXT.md
- Relevant skill files for this task

Goal:
[Describe the concrete outcome.]

Scope:
- Allowed paths: [list paths]
- Do not touch: [list paths or behaviors]

Acceptance criteria:
1. [Expected behavior]
2. [Tests/docs/commands required]
3. [Compatibility or migration requirement]

Validation:
- Run focused checks while iterating.
- Before handoff, run:
  pnpm install --frozen-lockfile
  pnpm run typecheck
  pnpm run lint
  pnpm run test
  pnpm run build

Safety:
- Do not push unless explicitly asked.
- Do not run destructive database commands.
- Do not rewrite git history.
- Stop and report if the task requires a security, data-loss, public API, or migration decision.

Handoff:
- Summarize changes.
- List commands run.
- List skipped commands and why.
- List remaining risks and recommended next task.
```

## Good Use Cases

- Add a focused API feature with tests.
- Improve one production-readiness area.
- Build E2E coverage for one app.
- Refactor one module with a clear public behavior boundary.

## Avoid

- "Fix everything" prompts without acceptance criteria.
- Multi-domain changes that touch API, database, all frontends, deployment, and docs at once.
- Auto-push workflows without human review.
- Tasks that require production credentials or real user data.
