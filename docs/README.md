# LMS Platform Docs

This folder is intentionally small. Use this page as the docs index and avoid
adding new planning files unless they become a durable source of truth.

## Read First

Start with the dashboard, then jump only to the reference you need.

| Need                               | Read                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| What is being worked on now        | [product/CURRENT-WORK.md](product/CURRENT-WORK.md)                   |
| Product roadmap and current phase  | [product/PLAN.md](product/PLAN.md)                                   |
| Long-term AI strategy              | [product/AI-NATIVE-LMS-ROADMAP.md](product/AI-NATIVE-LMS-ROADMAP.md) |
| System boundaries and tenant model | [ARCHITECTURE.md](ARCHITECTURE.md)                                   |
| API contracts                      | [api-documentation.md](api-documentation.md)                         |
| Agent workflow                     | [ai-agent/SOP.md](ai-agent/SOP.md)                                   |
| Release validation                 | [ops/release-check.md](ops/release-check.md)                         |

## Docs Map

```text
docs/
├── README.md                         # This index
├── ARCHITECTURE.md                   # System architecture and tenant model
├── api-documentation.md              # API contract reference
├── quick-start.md                    # Fast local setup
├── tech-stack.md                     # Stack choices
├── troubleshooting.md                # Common failures and fixes
├── product/
│   ├── CURRENT-WORK.md               # Active task, batch, checklist
│   ├── PLAN.md                       # Product roadmap source of truth
│   └── AI-NATIVE-LMS-ROADMAP.md      # Long-term AI direction
├── ai-agent/
│   ├── SOP.md                        # Agent operating procedure
│   └── prompts/                      # Reusable prompt templates
├── guides/
│   ├── database-guide.md
│   └── testing.md
├── ops/
│   ├── deployment.md
│   ├── monitoring.md
│   ├── release-check.md
│   └── super-portal-operator-guide.md
└── runbooks/
    └── database-migration-runbook.md
```

## Documentation Rules

- Keep active planning in [product/CURRENT-WORK.md](product/CURRENT-WORK.md).
- Keep durable roadmap decisions in [product/PLAN.md](product/PLAN.md).
- Keep agent process rules in [ai-agent/SOP.md](ai-agent/SOP.md) or `AGENTS.md`.
- Put visual status at the top: tables, checklists, and ASCII progress bars before long prose.
- Prefer updating an existing source-of-truth file over creating a new one.
- Delete stale planning/audit notes once their useful decisions are merged.
- If a rule must always be enforced, prefer a script/check over prose only.
- Use git history for old audits and batch notes; do not keep outdated docs in
  the active docs tree.

## Agent Workflow

AI coding agents should load context progressively:

1. `AGENTS.md`
2. [product/CURRENT-WORK.md](product/CURRENT-WORK.md) for current scope
3. [ai-agent/SOP.md](ai-agent/SOP.md) for workflow
4. Relevant skill files under `agent-knowledge/skills/`
5. Nearby source files and tests

This follows the same shape as mature developer hubs: short entrypoints,
task-oriented docs, and deeper references only when needed.
