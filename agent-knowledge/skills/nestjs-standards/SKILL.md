# NestJS Standards

**Tier:** POWERFUL
**Category:** Engineering / Backend
**Domain:** LMS API Server
**Maintainer:** LMS Agent Team

---

## Overview

Standards and patterns for the `apps/api-server` NestJS application. The API serves the LMS web-admin and web-student portals with JWT authentication, Prisma ORM, Swagger documentation, multi-tenancy, and rate limiting.

## Core Capabilities

- **modular_architecture**: Feature-based modules (Auth, User, Admin, Course, Lesson, Progress) with global PrismaModule.
- **dto_validation**: Strict input validation via `class-validator` + `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`.
- **swagger_documentation**: All endpoints decorated with `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`.
- **response_wrapping**: `ResponseInterceptor` wraps all responses as `{ success, data }`, skips already-wrapped or paginated responses.
- **exception_filtering**: `HttpExceptionFilter` returns `{ success, message, statusCode, timestamp }`.
- **auth_guards**: `JwtAuthGuard` via `@nestjs/passport`, `RolesGuard` via `@Reflector`.
- **multi_tenancy**: `TenantMiddleware` extracts `tenantId` from `x-tenant-id` header or subdomain. All services accept `tenantId` for data isolation.
- **rate_limiting**: `AppThrottlerGuard` (extends `ThrottlerGuard`) with two tiers: `default` (100 req/min) and `auth` (10 req/min, applied via `@Throttle`).

## When to Use

Use when:
- Creating a new NestJS module, controller, service, or DTO in the API server.
- Adding validation decorators, Swagger docs, or guards.
- Implementing tenant-aware queries.

Skip when:
- Working purely on Next.js frontend apps (use `nextjs-standards`).
- Writing tests (use `test-suite-builder` or `testing-strategy`).

## Module Structure

Every feature module lives under `apps/api-server/src/<feature>/` with:

```
<feature>/
  <feature>.controller.ts   # Thin: routing, guard application, Swagger decorators
  <feature>.service.ts      # Thick: business logic, Prisma queries, tenant isolation
  <feature>.module.ts       # Module wiring
  guards/
    jwt-auth.guard.ts        # extends AuthGuard('jwt')
    roles.guard.ts           # Role-based access via @Roles() decorator
  dto/
    create-<feature>.dto.ts  # @IsString, @IsEmail, @IsUUID, @ApiProperty, etc.
    update-<feature>.dto.ts  # All fields optional
```

## DTO Validation Patterns

All DTOs must use `class-validator` decorators AND `@ApiProperty()`:

```typescript
export class CreateLessonDto {
  @ApiProperty({ example: "Bai 1: Gioi thieu", description: "Lesson title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: "video" })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: "uuid-of-course" })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
```

Use `ValidationPipe` globally in `main.ts` with `whitelist: true, forbidNonWhitelisted: true, transform: true`.

## Controller Patterns

```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags("lessons")
@Controller("lessons")
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @ApiOperation({ summary: "Tạo bài học mới" })
  create(@Body() createDto: CreateLessonDto, @Request() req: any) {
    return this.lessonService.create({ ...createDto, tenantId: req.tenantId });
  }

  @Get()
  @ApiQuery({ name: "courseId", required: true })
  findAll(@Query("courseId") courseId: string, @Request() req: any) {
    return this.lessonService.findAll(courseId, req.tenantId);
  }
}
```

## Service Patterns

- Inject `PrismaService` via constructor.
- Always pass `tenantId` to Prisma `where` clauses for multi-tenancy.
- Throw `NotFoundException` when entity not found (with tenant context in message).
- Return raw Prisma results; let `ResponseInterceptor` handle wrapping.

```typescript
@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string, tenantId: string) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id, tenantId } });
    if (!lesson) throw new NotFoundException(`Lesson with ID ${id} not found in this tenant`);
    return lesson;
  }
}
```

## Guards

- `JwtAuthGuard`: applied at controller level for all routes.
- `RolesGuard`: used with `@Roles(Role.ADMIN)` decorator on specific handlers.
- Rate limit guard (`AppThrottlerGuard`) is globally registered via `APP_GUARD`.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Missing `@ApiBearerAuth` on protected routes | Add decorator so Swagger shows the auth lock icon |
| Forgetting `tenantId` in Prisma `where` | Always extract from `req.tenantId` and pass to service |
| Returning nested `{ success, data }` objects | Service should return raw data; interceptor handles wrapping |
| Not excluding auth routes from TenantMiddleware | Already excluded in `app.module.ts` for `/auth/*` and `/admin/tenants/*` |
| Using `req.user` without type | Cast `req` as `any` or define `AuthenticatedRequest` interface |

## Best Practices

1. Keep controllers thin - only routing, guards, and DTO validation.
2. All business logic lives in services; Prisma queries only in services.
3. Use `PaginationPipe` or manual `skip/take` for paginated endpoints.
4. Use `@ApiProperty({ example: "..." })` for all DTO fields to populate Swagger examples.
5. Apply `@Throttle` on sensitive endpoints (login, register) to use the stricter `auth` limit.
6. Always validate tenant ownership before mutations (e.g., check course belongs to tenant before creating a lesson).

## Related Skills

| Skill | Use When |
|---|---|
| testing-strategy | Planning overall test coverage for the API |
| test-suite-builder | Writing Vitest + Supertest for NestJS endpoints |
| auth-standards | Understanding JWT flow and token structure |
| database-operations | Prisma schema and query patterns |

## Reference Documentation

-> See `references/nestjs-patterns.md` for deep-dive documentation on module structure, DTO validation, exception filters, interceptors, and Swagger decorators catalog.
