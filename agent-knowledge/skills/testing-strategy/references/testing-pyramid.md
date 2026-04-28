# Testing Pyramid Reference

Deep-dive reference for the LMS testing pyramid: unit, integration, and E2E testing.

## Test Level Definitions

### Unit Tests

**Definition**: Tests a single function, method, or class in complete isolation from its dependencies.

**Scope**: Pure business logic, standalone services, utilities, individual React components.

**Tool**: Vitest for backend, shared packages, and UI package tests.

**Characteristics**:

- Fast (< 10ms per test)
- Deterministic and repeatable
- No external dependencies (database, network)
- Mock all collaborators
- One assertion concept per test

**Example - Service Unit Test**:

```typescript
describe('LessonService.findOne', () => {
  it('should throw NotFoundException when lesson does not exist', async () => {
    prismaService.lesson.findFirst.mockResolvedValue(null);
    await expect(service.findOne('invalid', 'tenant-1')).rejects.toThrow(NotFoundException);
  });
});
```

### Integration Tests

**Definition**: Tests the collaboration between multiple units (e.g., controller + service + Prisma), with real or mocked infrastructure at boundaries.

**Scope**: Controller + service boundary, service + database boundary, API endpoint contracts.

**Tool**: Vitest + Supertest (API), Vitest + Testing Library (React components).

**Characteristics**:

- Medium speed (< 100ms per test)
- Mocked Prisma client at service boundary
- Tests real HTTP request/response flow for API tests
- Verifies JSON response shapes

**Example - Controller Integration with Supertest**:

```typescript
describe('POST /lessons', () => {
  it('should return 201 with lesson data', async () => {
    const response = await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', `Bearer ${validToken}`)
      .set('x-tenant-id', 'tenant-1')
      .send({ title: 'New Lesson', courseId: 'course-1' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('New Lesson');
  });
});
```

### E2E Tests

**Definition**: Tests complete user journeys across the entire application stack in a real browser.

**Scope**: Login flow, course enrollment, lesson completion, admin dashboard workflows.

**Tool**: Playwright (planned).

**Characteristics**:

- Slowest (may take seconds per test)
- Real browser, real server, real database
- Tests the entire system as a user would experience it
- Fewest tests (most expensive to write and maintain)

## Coverage Targets by Layer

| Layer                              | Coverage Target        | Priority |
| ---------------------------------- | ---------------------- | -------- |
| Auth module (login, register, JWT) | 90%+ line, 95%+ branch | Critical |
| Tenant middleware and guards       | 95%+ line              | Critical |
| Validation DTOs (all decorators)   | 85%+ line              | High     |
| Controllers (all endpoints)        | 80%+ line              | High     |
| Services (all methods)             | 80%+ line              | High     |
| Frontend auth components           | 70%+ line              | Medium   |
| Frontend lesson components         | 60%+ line              | Medium   |
| i18n components                    | 50%+ line              | Low      |

## Test Organization Patterns

### File Placement

```
apps/api-server/src/
  lesson.controller.spec.ts    # Controller tests
  lesson.service.spec.ts       # Service unit tests
  auth/
    auth.controller.spec.ts
    auth.service.spec.ts
    dto/
      login.dto.spec.ts        # DTO validation tests

apps/web-student/src/
  __tests__/
    login-form.spec.tsx
  features/auth/
    login-form.spec.tsx

apps/web-admin/src/
  __tests__/
```

### Naming Convention

```
<subject>.<method>.should-<expected-behavior>
```

Examples:

- `LessonService.findOne should throw NotFoundException when lesson does not exist`
- `AuthController POST /auth/login should return 401 when password is incorrect`
- `LoginForm should display error message when login fails`

### Describe Block Structure

```typescript
describe('SubjectName', () => {
  describe('methodName or route', () => {
    describe('happy path', () => {
      it('should ...');
    });

    describe('auth failures', () => {
      it('should return 401 when no token provided');
      it('should return 401 when token is expired');
    });

    describe('validation failures', () => {
      it('should return 422 when field is missing');
      it('should return 422 when field has wrong type');
    });

    describe('business logic edge cases', () => {
      it('should handle empty list gracefully');
      it('should cap pagination at maximum page size');
    });
  });
});
```

## Mocking Strategies for Prisma

### Strategy 1: Full PrismaService Mock (Preferred for Unit)

```typescript
const prismaServiceMock = {
  lesson: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  course: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

// Register in module
providers: [{ provide: PrismaService, useValue: prismaServiceMock }];
```

### Strategy 2: Partial Mock Per Test

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prismaService.lesson.findFirst).mockResolvedValue({ id: '1', title: 'Test' });
});

it('should return lesson when found', async () => {
  const result = await service.findOne('1', 'tenant-1');
  expect(result.id).toBe('1');
});
```

### Strategy 3: Real Test Database (Integration/E2E)

```typescript
// Use a separate test database URL
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

beforeAll(async () => {
  await prisma.$connect();
  await prisma.$executeRaw`TRUNCATE TABLE "Lesson" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Course" CASCADE`;
});

beforeEach(async () => {
  await prisma.lesson.create({
    data: { id: 'test-1', title: 'Test', courseId: 'course-1', tenantId: 'tenant-1' },
  });
});

afterEach(async () => {
  await prisma.lesson.deleteMany();
});

afterAll(async () => {
  await prisma.lesson.deleteMany();
  await prisma.$disconnect();
});
```

### What to Mock vs. What to Use Real

| Dependency     | Mock in Unit | Use Real in Integration   |
| -------------- | ------------ | ------------------------- |
| PrismaService  | Yes          | No (mock instead)         |
| External APIs  | Yes          | Yes                       |
| Email service  | Yes          | No                        |
| File storage   | Yes          | No                        |
| JWT library    | No           | No                        |
| ValidationPipe | No           | No (test via integration) |

## Frontend Testing Patterns

### React Component with Vitest

```typescript
// login-form.spec.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../login-form";
import { useAuthStore } from "../auth.store";

vi.mock("../auth.store", () => ({
  useAuthStore: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render email and password inputs", () => {
    vi.mocked(useAuthStore).mockReturnValue({ login: vi.fn(), loading: false, error: null } as any);
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("example@email.com")).toBeInTheDocument();
  });

  it("should call login when form is submitted", async () => {
    const loginMock = vi.fn().mockResolvedValue(true);
    vi.mocked(useAuthStore).mockReturnValue({ login: loginMock, loading: false, error: null } as any);
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
  });

  it("should display error message when login fails", () => {
    vi.mocked(useAuthStore).mockReturnValue({ login: vi.fn(), loading: false, error: "Invalid credentials" } as any);
    render(<LoginForm />);
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });
});
```

## Test Data Factories

Create reusable factory functions for consistent test data:

```typescript
// test/factories/lesson.factory.ts
export const createMockLesson = (overrides = {}) => ({
  id: 'lesson-1',
  title: 'Test Lesson',
  type: 'text',
  content: 'Lesson content',
  videoUrl: null,
  duration: 10,
  order: 1,
  courseId: 'course-1',
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  fullName: 'John Doe',
  role: 'STUDENT',
  tenantId: 'tenant-1',
  ...overrides,
});
```

## CI/CD Test Execution

```bash
# Unit tests (fastest)
pnpm --filter api-server vitest run

# Integration tests
pnpm --filter api-server vitest run --config vitest.config.integration.ts

# Frontend unit tests
pnpm --filter web-student test
pnpm --filter web-admin test
```

## Common Test Patterns

### Testing Error Throws

```typescript
// Async throws
await expect(service.method(invalidInput)).rejects.toThrow(NotFoundException);

// Sync throws
expect(() => validator.validate(invalidInput)).toThrow(ValidationException);
```

### Testing Response Shape

```typescript
expect(response.body).toMatchObject({
  success: true,
  data: expect.objectContaining({ id: expect.any(String) }),
});
```

### Testing Pagination Meta

```typescript
expect(response.body.meta).toEqual({
  page: 1,
  limit: 10,
  total: 25,
  totalPages: 3,
});
```
