# Monorepo Navigator

**Tier:** POWERFUL
**Category:** Engineering
**Domain:** Monorepo Architecture / Build Systems
**Maintainer:** LMS Agent Team

---

## Overview

Navigate, manage, and optimize the LMS Platform monorepo. Covers pnpm workspaces, Turborepo, and Changesets. Enables cross-package impact analysis, selective builds/tests on affected packages only, remote caching, and dependency graph visualization.

---

## Core Capabilities

- **Cross-package impact analysis**: determine which apps break when a shared package changes
- **Selective commands**: run tests/builds only for affected packages (not everything)
- **Dependency graph**: visualize package relationships
- **Build optimization**: remote caching via Turborepo, incremental builds, parallel execution
- **Publishing**: changesets for versioning, pre-release channels, npm publish workflows
- **Workspace-aware**: Claude Opus configuration for per-package development

---

## When to Use

Use when:
- Modifying shared packages (`packages/database`, `packages/ui`, `packages/shared`)
- Build times are slow because everything rebuilds when anything changes
- Running tests or builds across the monorepo
- Need to publish packages to npm with coordinated versioning
- Teams work across multiple apps and need unified tooling

Skip when:
- Working exclusively within a single app (`apps/api-server` or `apps/web-admin`)
- No shared code changes involved
- Simple single-file edits within one package

---

## Key Workflows

### 1. Cross-Package Impact Check

Before merging shared package changes:

```bash
# From repo root
pnpm turbo run build --filter=./packages/shared... --dry-run
pnpm turbo run test --filter=./apps...
```

### 2. Selective Build/Test

Run only affected packages:

```bash
# Build only changed packages and their dependents
pnpm turbo run build --filter="...[origin/main]"

# Test only apps that depend on the changed package
pnpm turbo run test --filter="./apps/web-admin...^./packages/database"
```

### 3. Add a New Package

```bash
# Create package in packages/
mkdir packages/my-package
cd packages/my-package
pnpm init

# Add to pnpm-workspace.yaml if not auto-detected
echo "- packages/*" > pnpm-workspace.yaml

# Add to turbo.json pipeline if needed
```

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Running `turbo run build` without `--filter` on every PR | Always use `--filter=...[origin/main]` in CI |
| All packages rebuild when unrelated file changes | Tune `inputs` in turbo.json to exclude docs, config files |
| Shared tsconfig causes one package to break all type-checks | Each package extends root tsconfig but overrides `rootDir` / `outDir` |
| Changeset missing when publishing | Run `pnpm changeset` before every publish |
| Remote cache not working in CI | Check `TURBO_TOKEN` and `TURBO_TEAM` env vars |
| CLAUDE.md too generic — Claude modifies wrong package | Add explicit "When working on X, only touch files in apps/X" rules |

---

## Best Practices

1. **Root `turbo.json` defines the pipeline** — document each task (`build`, `test`, `lint`) per package
2. **Per-package context** — use `--filter` to scope commands to the relevant package
3. **Remote cache is essential** — without it, monorepo CI is slower than polyrepo CI
4. **Changesets over manual versioning** — never hand-edit `package.json` versions
5. **Shared configs in root** — `tsconfig.base.json`, `.eslintrc.base.js`, `jest.base.config.js`
6. **Impact analysis before merging shared package changes** — run affected check and communicate blast radius
7. **Keep packages/types as pure TypeScript** — no runtime code, no external dependencies, fast to build

---

## Related Skills

| Skill | Use When |
|---|---|
| architecture-core | Understanding the LMS monorepo structure |
| deployment-ops | Dockerizing the monorepo for production |
| testing-strategy | Running tests across packages |

---

## Reference Documentation

→ See `references/` directory for tooling reference and patterns.
