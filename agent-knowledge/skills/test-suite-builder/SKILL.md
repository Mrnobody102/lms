# Test Suite Builder

**Tier:** POWERFUL
**Category:** Engineering / Quality Assurance
**Domain:** LMS API Testing
**Maintainer:** LMS Agent Team

---

## Overview

Generates comprehensive test suites for the LMS NestJS API (`apps/api-server`) using Vitest + Supertest. Covers auth, input validation, error codes, pagination, and tenant isolation. Tests live alongside source files as `*.spec.ts`.

## Core Capabilities

- **auth_coverage**: Valid/invalid/expired JWT, missing auth, wrong role.
- **validation_matrix**: Empty body, missing fields, wrong types, boundary values, injection attempts.
- **error_code_matrix**: 400/401/403/404/422/500 per endpoint.
- **pagination_patterns**: First, last, empty, oversized pages.
- **tenant_isolation**: Tests verify tenant-scoped queries via `x-tenant-id` header.
- **nestjs_testing_module**: Uses `@nestjs/testing` `Test.createTestingModule()`.

## When to Use

Use when:
- Adding a new endpoint or DTO to the NestJS API.
- Writing TDD: scaffold tests before implementation.
- Generating regression tests for existing endpoints.
- Reviewing API contract coverage.

Skip when:
- Writing unit tests for pure service logic (use `testing-strategy`).
- Writing E2E tests (Playwright, future work).

## NestJS Testing Module Setup

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonController } from "./lesson.controller";
import { LessonService } from "./lesson.service";

describe("LessonController", () => {
  let controller: LessonController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: vi.fn().mockResolvedValue({ id: "1", title: "Test Lesson" }),
      findAll: vi.fn().mockResolvedValue([{ id: "1", title: "Test Lesson" }]),
      findOne: vi.fn().mockResolvedValue({ id: "1", title: "Test Lesson" }),
      update: vi.fn().mockResolvedValue({ id: "1", title: "Updated Lesson" }),
      remove: vi.fn().mockResolvedValue({ id: "1" }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [{ provide: LessonService, useValue: service }],
    }).compile();

    controller = module.get<LessonController>(LessonController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
```

## Auth Test Matrix

For every authenticated endpoint:

| Test Case | Expected Status |
|---|---|
| No Authorization header | 401 |
| Invalid token format | 401 |
| Valid token, wrong user role | 403 |
| Expired JWT token | 401 |
| Valid token, correct role | 2xx |
| Token from deleted user | 401 |
| Missing `x-tenant-id` header | 400 |

## Validation Test Matrix

For every POST/PUT/PATCH endpoint:

| Test Case | Expected Status |
|---|---|
| Empty body `{}` | 400 or 422 |
| Missing required fields | 400 or 422 |
| Wrong type (string where UUID expected) | 400 or 422 |
| Too short (password < 8 chars) | 422 |
| Too long (string exceeds max) | 422 |
| Valid payload | 201 or 200 |
| SQL injection attempt | 400 or 422 |
| XSS attempt | 400 or 422 |

## Pagination Test Patterns

For GET list endpoints with pagination:

| Test Case | Expected Behavior |
|---|---|
| Default page (no params) | Returns page 1, default limit |
| `?page=1&limit=10` | Returns first 10 items |
| `?page=2&limit=5` | Returns items 6-10 |
| `?page=999&limit=10` (oversized) | Returns empty array with meta |
| `?limit=0` (boundary) | Returns 400 or uses default |
| `?limit=1000` (max cap) | Caps at max (e.g., 100) |

## Tenant Isolation Test Patterns

```typescript
it("should only return lessons for the correct tenant", async () => {
  const req = { tenantId: "tenant-1" };
  await controller.findAll("course-1", req);
  expect(service.findAll).toHaveBeenCalledWith("course-1", "tenant-1");
});

it("should throw error when tenant ID is missing", async () => {
  const req = {};
  await expect(controller.create(dto, req)).rejects.toThrow(BadRequestException);
});
```

## Test Naming Convention

Follow the specification-style naming:

```typescript
describe("AuthController", () => {
  describe("POST /auth/login", () => {
    it("should return 200 with token when credentials are valid");
    it("should return 401 when email is not found");
    it("should return 401 when password is incorrect");
    it("should return 422 when email format is invalid");
    it("should return 422 when password is shorter than 8 characters");
    it("should return 429 when rate limit is exceeded");
  });
});
```

## Generating Tests from Route Scan

1. Read the controller file to identify all endpoints and their HTTP methods.
2. Read the DTO files to identify validation rules and field types.
3. Identify auth requirements (which endpoints use `@UseGuards(JwtAuthGuard)`).
4. Generate one `describe` block per endpoint.
5. Cover: happy path, auth failures, validation failures, tenant isolation.
6. Use `vi.fn()` to mock the service layer; focus on controller behavior.
7. For integration tests with Supertest, use `app.init()` and `request(app)` instead.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Testing only happy paths | Always add auth failure and validation failure cases |
| Hardcoded test data IDs | Use factory functions or constants |
| Shared state between tests | Use `beforeEach` to reset mocks |
| Forgetting tenantId in mock request | Always include `req.tenantId` in test request object |
| Not covering rate limiting | Add at least one test for `@Throttle` behavior |
| Testing implementation instead of behavior | Assert on response shape, not internal mock call counts |

## Best Practices

1. One `describe` block per controller, nested `describe` per endpoint.
2. Use `vi.fn().mockResolvedValue()` for service method mocks.
3. Assert response status AND response body shape.
4. Test sensitive field exclusion (password should never be in response).
5. Group tests by type: auth -> validation -> tenant -> happy path.
6. Keep tests deterministic; avoid time-dependent assertions.
7. Use descriptive test names that read as specifications.

## Related Skills

| Skill | Use When |
|---|---|
| testing-strategy | Planning overall test coverage and pyramid |
| nestjs-standards | Understanding controller/service patterns |
| auth-standards | Understanding JWT and role-based auth |

## Reference Documentation

-> See `references/test-patterns.md` for deep-dive documentation on NestJS testing module setup, auth test matrix, validation test matrix, and pagination test patterns.
