# Senior Backend Engineer

**Tier:** POWERFUL
**Category:** Engineering / Backend
**Domain:** NestJS / Node.js / PostgreSQL
**Maintainer:** LMS Agent Team

---

## Overview

Backend development skill for the LMS Platform. Covers NestJS REST API development, Prisma ORM, PostgreSQL optimization, JWT authentication, multi-tenancy, Swagger documentation, and API security hardening. Use when building API endpoints, designing DTOs, implementing business logic, or optimizing database queries.

---

## Core Capabilities

- **NestJS modular architecture**: structuring features into isolated modules (AuthModule, UserModule, CourseModule)
- **DTO validation**: enforcing strict input validation using `class-validator` and global `ValidationPipe`
- **Prisma integration**: schema-first development with type-safe database access
- **Multi-tenancy**: `tenantId` injection via middleware for data isolation
- **Swagger documentation**: `@ApiOperation`, `@ApiResponse`, `@ApiProperty` decorators on every endpoint
- **Security patterns**: JWT Bearer tokens, role-based guards, rate limiting, input sanitization

---

## When to Use

Use when:

- Building or modifying API endpoints in `apps/api-server`
- Creating or updating DTOs, Services, Controllers, Modules
- Adding database models or running Prisma migrations
- Implementing authentication/authorization logic
- Reviewing backend code quality or API design

Skip when:

- Working on the Next.js frontend (`apps/web-admin`, `apps/web-student`)
- Writing React components or page layouts
- Only modifying CSS or styling

---

## Key Workflows

### 1. Create a New Feature Module

```bash
# Structure (flat under src/, not nested under features/)
src/course/
├── course.module.ts
├── course.controller.ts
├── course.service.ts
└── dto/
    ├── create-course.dto.ts
    └── update-course.dto.ts
```

1. Define Prisma model in `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @repo/database generate` to generate client
3. Create DTOs with `class-validator` decorators and `@ApiProperty`
4. Write Service with business logic (not in Controller)
5. Write Controller with proper HTTP methods and Swagger decorators
6. Register module in `app.module.ts`

### 2. Add a New API Endpoint

1. Define the resource and HTTP method
2. Create or update DTO with validation decorators
3. Add Swagger decorators: `@ApiOperation({ summary: '...' })` and `@ApiResponse({ status: 200, ... })`
4. Implement in Service (not Controller)
5. Guard with appropriate roles (`@Roles(Role.ADMIN)`, `@UseGuards(RolesGuard, JwtAuthGuard)`)
6. Return typed responses; throw `NotFoundException`, `BadRequestException` for errors

### 3. Database Optimization

1. Identify slow queries via logs or `EXPLAIN ANALYZE`
2. Check for missing indexes on filter/join columns
3. Add `@@index` in `schema.prisma`
4. Run `pnpm --filter @repo/database db:migrate -- --name add_course_indexes`
5. Verify with `EXPLAIN ANALYZE` again

---

## Common Pitfalls

| Pitfall                           | Fix                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Business logic in Controllers     | Always move logic to Services; Controllers should only route                     |
| Missing Swagger decorators        | Every method needs `@ApiOperation`; every DTO field needs `@ApiProperty`         |
| No validation on DTOs             | Use `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true` |
| Missing `tenantId` on new queries | Every Prisma query on tenant-scoped models must include `where: { tenantId }`    |
| Returning raw error messages      | Use `HttpException` subclasses; never expose stack traces                        |
| Exposing internal IDs             | Use UUIDs for all resource IDs; never expose sequential integers                 |
| N+1 queries                       | Use `include` in Prisma to eager-load related data                               |

---

## Best Practices

1. **Modules are the boundary**: each feature gets its own module with clear imports/exports
2. **Services handle logic**: Controllers delegate to Services; no business logic in Controllers
3. **DTOs for input validation**: never accept `any` or plain objects as request bodies
4. **Type-safe Prisma**: use generated types, not manual casting
5. **Multi-tenant queries**: always filter by `tenantId` on tenant-scoped models
6. **Consistent error responses**: use `HttpException` with structured error payloads
7. **Swagger-first**: document while building, not after
8. **Test service logic**: write unit tests for Services with mocked Prisma clients

---

## Related Skills

| Skill               | Use When                                       |
| ------------------- | ---------------------------------------------- |
| nestjs-standards    | Detailed NestJS patterns and module structure  |
| database-operations | Running Prisma migrations and seeding          |
| db-intelligence     | Planning schema changes and data safety        |
| auth-standards      | JWT flow, guards, and role-based access        |
| api-design-reviewer | Reviewing API design before implementation     |
| testing-strategy    | Writing unit and integration tests for the API |

---

## Reference Documentation

→ See `references/` directory for API design patterns, database optimization guide, and security practices.
