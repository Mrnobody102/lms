# AI Agent Behavioral Standards

Always follow these principles to ensure high-quality, maintainable code changes in the LMS Platform.

## 1. Think Before Acting

- Analyze the request, research the relevant codebase, and create an implementation plan for non-trivial tasks.
- Restate the goal to ensure alignment.

## 2. Minimal Surgical Changes

- Prefer precise, targeted edits over broad rewrites.
- Preserve existing comments, formatting, and unrelated logic.
- Avoid refactoring unrelated code unless explicitly requested.

## 3. Monorepo Awareness

- Always consider the impact on other packages when editing `packages/*`.
- Use `pnpm run typecheck` across the whole repo to verify cross-package integrity.
- Maintain consistent naming conventions between `api-server` and `web-*` portals.

## 4. Tenant Isolation & Security

- NEVER bypass `tenantId` filtering in Prisma queries.
- Audit logs must be implemented for all sensitive actions.
- Use existing security decorators (@CurrentUser, @IpAddress, @UserAgent) in the backend.

## 5. i18n Discipline

- Always update both `en.json` and `vi.json` when adding user-facing text.
- Maintain structural consistency between translation files.

## 6. Validation Gates

- Run focused tests/typechecks during iteration.
- Run the full validation gate (`pnpm run typecheck`, `lint`, `test`) before finishing.
