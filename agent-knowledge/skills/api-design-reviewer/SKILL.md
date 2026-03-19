# API Design Reviewer

**Tier:** POWERFUL
**Category:** Engineering / Architecture
**Domain:** API Design & Review
**Maintainer:** LMS Agent Team

---

## Overview

The API Design Reviewer skill provides comprehensive analysis and review of API designs for the LMS NestJS backend. It enforces REST conventions, best practices, breaking change detection, and design quality standards aligned with NestJS + Prisma patterns.

## Core Capabilities

- **api_linting**: Validates resource naming (kebab-case), HTTP methods, URL structure, status codes, and error response formats.
- **breaking_change_detection**: Detects removed endpoints, response shape changes, field removals, type changes, and status code modifications.
- **api_design_scoring**: Evaluates consistency (30%), documentation (20%), security (20%), usability (15%), and performance (15%).
- **nestjs_compliance**: Ensures Swagger decorators, class-validator DTOs, proper DI separation, and consistent error handling.
- **schema_validation**: Enforces Prisma-integrated DTO patterns with IsString, IsEmail, IsUUID, and other decorators.

## When to Use

Use when:
- Designing new REST endpoints for the LMS API server
- Reviewing pull requests that add or modify API endpoints
- Auditing existing endpoints for consistency and best practices
- Adding or changing DTOs and response shapes
- Planning API versioning for new feature releases

Skip when:
- Single-app project with no shared packages
- Working exclusively on UI components with no backend changes
- Making cosmetic UI changes with no API impact

## Key Workflows

### Design New Endpoint

1. Define the resource path with kebab-case and version prefix `/api/v1/`
2. Choose the correct HTTP method (GET/POST/PUT/PATCH/DELETE)
3. Create the DTO with class-validator decorators and Swagger @ApiProperty
4. Add @ApiOperation and @ApiResponse decorators to the controller method
5. Implement business logic in the service layer (never in controllers)
6. Register the route and verify the Swagger docs render correctly

### Review API PR

1. Run through the API Design Scoring rubric (consistency, docs, security, usability, performance)
2. Check NestJS compliance: Swagger decorators, ValidationPipe, DI separation, HttpException usage
3. Scan for breaking changes against the existing OpenAPI spec
4. Verify error response structure matches the standard LMS format
5. Flag pagination patterns for list endpoints and cursor/offset consistency

### Add Pagination

1. For stable, filterable lists: use offset-based `{ offset, limit, total, hasMore }`
2. For infinite scroll / time-ordered feeds: use cursor-based `{ nextCursor, hasMore }`
3. Apply the same pattern consistently across all list endpoints in the same resource

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Missing @ApiOperation/@ApiResponse decorators | Add Swagger decorators to every controller method |
| Using raw errors or throwing plain strings | Wrap in HttpException (e.g., NotFoundException, BadRequestException) |
| Business logic in controllers | Move all logic to service methods; controllers only handle HTTP |
| Missing ValidationPipe | Ensure app bootstrap uses `app.useGlobalPipes(new ValidationPipe())` |
| Inconsistent resource naming (snake vs kebab) | Enforce kebab-case: `/user-profiles`, not `/user_profiles` |
| Returning different error shapes per endpoint | Standardize on `{ error: { code, message, details, requestId, timestamp } }` |
| Adding required fields to existing DTOs | Mark new fields optional; add them as additive only |

## Best Practices

1. Always prefix endpoints with version: `/api/v1/`, `/api/v2/`
2. Use kebab-case for multi-word resources: `/user-profiles`, not `/userProfiles`
3. Keep DTOs focused: separate Request DTOs from Response DTOs
4. Validate all input with class-validator at the DTO layer, never manually
5. Return structured errors with machine-readable codes, never raw messages
6. Document every endpoint with @ApiOperation summary and @ApiResponse decorators
7. Use cursor-based pagination for large or time-ordered datasets; offset for small, filterable lists

## Related Skills

| Skill | Use When |
|---|---|
| architecture-core | Understanding project structure before designing APIs |
| code-architecture | Designing service layer patterns and module boundaries |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
