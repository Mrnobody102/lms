# Engineering Planning

**Tier:** POWERFUL
**Category:** Engineering / Planning
**Domain:** Feature Planning and Implementation Strategy
**Maintainer:** LMS Agent Team

---

## Overview

Systematic approach to breaking down LMS features into technical tasks, designing API contracts, planning database changes, and managing implementation rollout across the monorepo.

## Core Capabilities

- **feature_breakdown**: Decomposing high-level requirements into concrete technical tasks organized by component.
- **implementation_planning**: Designing the "how" before writing code, covering API endpoints, DTOs, Prisma schema, and Next.js page structure.
- **risk_assessment**: Identifying breaking changes, migration complexity, and cross-app dependencies early.
- **walkthrough_management**: Tracking milestones and verifying completed features against acceptance criteria.

## When to Use

Use when:
- Starting a new feature (e.g., Quiz System, Payment Integration, Progress Tracking)
- Planning database schema changes that affect multiple apps
- Designing new API endpoints or modifying existing ones
- Adding a new role permission or access control rule

Skip when:
- Making a small, isolated bug fix that does not touch multiple components
- Updating i18n strings or documentation

## Key Workflows

### Feature Planning

1. **Understand the requirement**: Clarify the "why" and "what" with concrete acceptance criteria.
2. **Audit existing patterns**: Review similar features for conventions (DTO structure, service patterns, page layouts).
3. **Design the data model**: Add or modify Prisma schema in `apps/api-server/prisma/schema.prisma`.
4. **Design the API contract**: Define endpoints, request/response DTOs, and HTTP methods.
5. **Plan the frontend**: Identify which Next.js app(s) need changes (web-student, web-admin, super-portal).
6. **Write the implementation plan**: Document tasks, dependencies, and verification steps.

### Implementation Order

Follow this order to minimize breaking changes:

1. **Database**: Prisma schema migration (`prisma migrate dev`)
2. **API Server**: Module, Service, Controller, DTOs, Swagger decorators
3. **API Tests**: Unit and integration tests with Vitest
4. **Frontend**: Pages, API client hooks, UI components
5. **i18n**: Add/update translation keys in `vi.json` and `en.json`

### Walkthrough Template

When a feature is complete, document it in a `walkthrough.md` at the project root or feature branch:

- Feature name and description
- Key decisions made during implementation
- How to verify the feature works
- Any known limitations

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Designing API before checking existing endpoints | Always review existing controllers for conventions first |
| Forgetting Prisma migrations | Run `prisma migrate dev` and commit the migration file |
| Not updating i18n for new UI strings | Add keys to both `vi.json` and `en.json` before marking done |
| Skipping tests for new API endpoints | Use Vitest with `supertest` for integration test coverage |
| Modifying shared packages without checking dependents | Run `pnpm turbo build` to verify no breaking changes |

## Best Practices

1. **Start with the data model**: Schema changes cascade everywhere. Get them right first.
2. **Keep DTOs flat and explicit**: Avoid nested objects in API contracts; use flat structures with clear field names.
3. **Group tasks by app**: List API tasks, web-student tasks, web-admin tasks, and super-portal tasks separately.
4. **Mark dependencies explicitly**: e.g., "Task 3 depends on Task 1 (migration must exist)".
5. **Define "done" criteria**: Each task should have a concrete verification step (test passes, page renders, etc.).

## Related Skills

| Skill | Use When |
|---|---|
| deployment-ops | Planning includes deployment steps or environment config |
| i18n-workflow | Feature has user-facing strings requiring translation |

## Reference Documentation

- See `references/planning-templates.md` for implementation plan templates, task breakdown examples, and walkthrough structure.
