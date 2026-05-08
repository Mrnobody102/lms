# API Server — Agent Guide

Read the root `AGENTS.md` first. This file adds context specific to `apps/api-server`.

## Quick Reference

- **Framework**: NestJS with TypeScript
- **Port**: 4000
- **Entry**: `src/main.ts`
- **Modules**: Feature-based flat structure under `src/`

## Module Layout

```
src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts    # Thin — routing, guards, Swagger
  <feature>.service.ts       # Thick — business logic, Prisma
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
```

## Rules

- Business logic in services, never in controllers.
- Every DTO: `class-validator` decorators + `@ApiProperty()`.
- Every controller method: `@ApiOperation()` + `@ApiResponse()`.
- Every tenant-scoped query: `where: { tenantId }`.
- Error responses: use `HttpException` subclasses (`NotFoundException`, `BadRequestException`).
- Auth endpoints: apply `@Throttle()` with stricter `auth` tier (10 req/min).
- Return explicit response contracts — do not rely on global response wrappers.

## Key Skills

- `agent-knowledge/skills/senior-backend/SKILL.md`
- `agent-knowledge/skills/nestjs-standards/SKILL.md`
- `agent-knowledge/skills/api-design-reviewer/SKILL.md`
- `agent-knowledge/skills/auth-standards/SKILL.md`

## Validation

```bash
pnpm --filter api-server test
pnpm --filter api-server typecheck
```
