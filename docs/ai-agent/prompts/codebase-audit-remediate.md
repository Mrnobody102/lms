# Codebase Audit + Remediation — Copy Prompt

```text
You are performing a comprehensive production-readiness audit of the LMS Platform codebase, then implementing approved fixes.

## Context Loading (Required)

Read these files first in order:
1. AGENTS.md
2. CLAUDE.md
3. agent-knowledge/lms-platform/CONTEXT.md
4. docs/ARCHITECTURE.md
5. docs/ai-agent/SOP.md

Then load ALL of these skill files (cross-cutting full-system audit):
- agent-knowledge/skills/code-review/SKILL.md
- agent-knowledge/skills/architecture-core/SKILL.md
- agent-knowledge/skills/senior-backend/SKILL.md
- agent-knowledge/skills/senior-frontend/SKILL.md
- agent-knowledge/skills/auth-standards/SKILL.md
- agent-knowledge/skills/nestjs-standards/SKILL.md
- agent-knowledge/skills/nextjs-standards/SKILL.md
- agent-knowledge/skills/db-intelligence/SKILL.md
- agent-knowledge/skills/api-design-reviewer/SKILL.md
- agent-knowledge/skills/testing-strategy/SKILL.md
- agent-knowledge/skills/deployment-ops/SKILL.md
- agent-knowledge/skills/monorepo-navigator/SKILL.md
- agent-knowledge/skills/i18n-workflow/SKILL.md

## Phase 1 — Audit

Perform a thorough expert-level audit across architecture, backend, security, frontend, database, testing, DX, performance, observability, and CI/CD.

### Required Method
1. Build inventory map of apps/packages.
2. Audit end-to-end with exact file + line references.
3. Separate verified issues from assumptions.
4. Prioritize high-signal findings.

### Required Output
- Executive summary + overall score (0-100)
- Scorecard by dimension
- Detailed findings with IDs (AUDIT-XXX), severity, impact, fix
- Prioritized remediation plan
- Baseline validation results from:
  - pnpm run typecheck
  - pnpm run lint
  - pnpm run test

## Phase 2 — Remediation (Implement Immediately)

After finishing Phase 1, start fixing findings in this order:
1. 🔴 Critical
2. 🟠 High
3. 🟡 Medium quick wins

### Implementation Rules
- Apply minimal, surgical changes only.
- Preserve tenant isolation and security decorators/patterns.
- If changing user-facing text, update both en.json and vi.json.
- Do not broad-refactor unless required to safely fix a finding.

### For Each Fix, Report
- Finding ID(s) fixed
- Files changed
- What changed
- Why the fix resolves root cause

### Re-Validation (Required)
Run again after fixes:
- pnpm run typecheck
- pnpm run lint
- pnpm run test

### Final Output
Return an “Audit + Remediation Summary” containing:
- Fixed findings (IDs)
- Deferred findings (with reason)
- Remaining risks
- Updated production readiness verdict

## Safety Rules

- Do NOT run destructive commands (delete/drop/reset/force-push).
- Do NOT expose secret values in output.
- If uncertain, mark "Needs human confirmation".
- Do NOT commit/push unless explicitly requested.
```
