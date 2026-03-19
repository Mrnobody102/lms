# Testing Strategy

**Tier:** POWERFUL
**Category:** Engineering / Quality Assurance
**Domain:** LMS Platform Testing
**Maintainer:** LMS Agent Team

---

## Overview

Testing strategy for the LMS Platform monorepo: Jest for unit tests, Supertest for API integration tests, and Playwright for E2E (future). The API uses Vitest (not Jest) for controller/service tests; the frontend apps use Jest for component tests.

## Core Capabilities

- **unit_testing**: Fast, isolated tests for services, utilities, and components using Jest/Vitest.
- **integration_testing**: Testing NestJS module boundaries with mocked Prisma client using Vitest + Supertest.
- **e2e_testing**: End-to-end user journeys across web portals (Playwright, future work).
- **prisma_mocking**: Strategies for mocking the Prisma service in unit and integration tests.
- **coverage_targets**: Defined coverage thresholds for critical paths.

## Test Levels

### Unit Tests

- **Scope**: Pure business logic, standalone services, utilities, React components.
- **Tool**: Jest (frontend), Vitest (backend unit).
- **Speed**: < 10ms per test.
- **Mock**: Mock external dependencies (email, external APIs). Use real Prisma for data layer.

```typescript
// Service unit test (Vitest)
describe("LessonService", () => {
  it("should throw NotFoundException when lesson does not exist", async () => {
    prismaService.lesson.findFirst.mockResolvedValue(null);
    await expect(service.findOne("invalid-id", "tenant-1")).rejects.toThrow(NotFoundException);
  });
});
```

### Integration Tests

- **Scope**: NestJS controller + service + Prisma boundary.
- **Tool**: Vitest + Supertest (API), Jest + `@testing-library/react` (frontend).
- **Speed**: < 100ms per test.
- **Mock**: Mock PrismaService at the module level; use `Test.createTestingModule`.

### E2E Tests (Future)

- **Scope**: Full user journeys across browser (Playwright).
- **Speed**: < 1s per test (may be slower).
- **Mock**: Real backend, real database (test environment).

## Test Organization

```
apps/api-server/src/
  lesson.controller.spec.ts    # Controller tests (Vitest + mock service)
  lesson.service.spec.ts       # Service unit tests (Vitest + mock Prisma)

apps/web-student/src/
  __tests__/                    # Jest component tests
  features/auth/
    login-form.spec.tsx

apps/web-admin/src/
  __tests__/
```

## Coverage Targets

| Layer | Target |
|---|---|
| Auth Service (login, register, JWT) | 90%+ line coverage |
| Tenant middleware | 95%+ line coverage |
| Validation DTOs | 80%+ line coverage |
| Controllers (happy + error paths) | 80%+ line coverage |
| Frontend components (critical flows) | 70%+ line coverage |

## Mocking Prisma in Tests

### Option 1: Mock the entire PrismaService

```typescript
const prismaServiceMock = {
  lesson: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  course: { findFirst: vi.fn() },
};

// In Test.createTestingModule:
providers: [{ provide: PrismaService, useValue: prismaServiceMock }]
```

### Option 2: Mock individual Prisma methods per test

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  prismaService.lesson.findFirst.mockResolvedValue({ id: "1", title: "Test" });
});
```

### Option 3: Real test database (integration)

For E2E and deep integration tests, use a separate test database:

```typescript
beforeAll(async () => {
  await prisma.$connect();
  await prisma.lesson.deleteMany();
});
afterAll(async () => {
  await prisma.lesson.deleteMany();
  await prisma.$disconnect();
});
```

## Test Naming Convention

Tests should read as natural language specifications:

```typescript
describe("AuthService", () => {
  describe("register", () => {
    it("should create a new user and return token when email is unique");
    it("should throw ConflictException when email already exists");
    it("should throw ValidationException when password is too short");
  });
});
```

## Jest/Vitest Configuration

- **Vitest** (API): configured in `apps/api-server/vitest.config.ts`, uses `environment: "node"`.
- **Jest** (Frontend): configured in `apps/web-admin/jest.config.ts` and `apps/web-student/jest.config.ts`, uses `testEnvironment: "jsdom"`.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Testing implementation details | Test behavior and public API, not internal method calls |
| Over-mocking | Only mock external dependencies; real Prisma is preferred for data layer |
| Shared mutable state | Reset mocks and test database state in `beforeEach` / `afterEach` |
| Slow tests from real DB | Use mock Prisma for unit tests; real DB only for E2E |
| Not covering error paths | Always test the failure cases (404, 401, 422, 500) |
| Flaky async tests | Always `await` or use `waitFor` from testing-library |

## Best Practices

1. Follow the testing pyramid: many unit tests, fewer integration tests, fewest E2E tests.
2. Unit tests should be fast and deterministic; integration tests can be slower but must be reliable.
3. Use `vi.clearAllMocks()` in `beforeEach` to prevent state leakage.
4. Test the response shape and status, not the implementation.
5. For auth tests, cover all rows in the auth test matrix.
6. Keep test data minimal and focused on what's being tested.
7. Name tests to describe the expected behavior, not the action taken.

## Related Skills

| Skill | Use When |
|---|---|
| test-suite-builder | Writing specific API test suites |
| nestjs-standards | Understanding controller/service patterns to test |
| nextjs-standards | Understanding frontend patterns to test |

## Reference Documentation

-> See `references/testing-pyramid.md` for deep-dive documentation on unit vs integration vs E2E definitions, coverage targets, test organization patterns, and mocking strategies for Prisma.
