# Playwright Reference: Fixtures

## Custom Fixtures for LMS

### Base Fixtures

```typescript
// fixtures/base.ts
import { test as base, Page, BrowserContext } from '@playwright/test';

export type BaseFixtures = {
  tenantId: string;
  apiBaseUrl: string;
};

export const baseTest = base.extend<BaseFixtures>({
  tenantId: 'trung-tam-demo', // default test tenant
  apiBaseUrl: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000',
});
```

### Auth Fixtures

```typescript
// fixtures/auth.ts
import { baseTest, BaseFixtures } from './base';
import { APIRequestContext, Page, request } from '@playwright/test';

type AuthFixtures = {
  studentPage: Page;
  adminPage: Page;
  studentApi: APIRequestContext;
};

export const test = baseTest.extend<AuthFixtures>({
  studentPage: async ({ page, tenantId }, use) => {
    await page.goto('/auth/login');

    // Multi-tenant login
    await page.getByLabel(/email/i).fill('student@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByRole('button', /login|đăng nhập/i).click();
    await page.waitForURL(/\/(dashboard|courses)/);

    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('adminpassword');
    await page.getByRole('button', /login|đăng nhập/i).click();
    await page.waitForURL(/\/admin/);

    await use(page);
  },

  studentApi: async ({ browser: pwBrowser }, use) => {
    const ctx = await request.newContext({
      baseURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000',
      extraHTTPHeaders: {
        'x-tenant-id': 'trung-tam-demo',
      },
    });

    const resp = await ctx.post('/api/auth/login', {
      data: { email: 'student@example.com', password: 'password123' },
    });

    if (!resp.ok()) {
      throw new Error(`API login failed with status ${resp.status()}`);
    }

    await use(ctx);
  },
});

export { expect } from '@playwright/test';
```

For browser E2E, authenticate through the UI or seed cookies with Playwright storage state. Do not set app auth by writing JWTs or tenant IDs into localStorage. For API-only fixtures, read `csrf_token` from `storageState()` and pass `x-csrf-token` per state-changing request. Bearer headers are acceptable only for fixtures that intentionally bypass browser cookie behavior.

### Data Fixtures

```typescript
// fixtures/data.ts
import { test, request } from '@playwright/test';

type DataFixtures = {
  testCourse: { id: string; title: string };
  testTenantId: string;
};

export const dataTest = test.extend<DataFixtures>({
  testTenantId: 'trung-tam-demo',

  testCourse: async ({ request }, use) => {
    // Create a test course via API
    const resp = await request.post('/api/v1/courses', {
      headers: { 'x-tenant-id': 'trung-tam-demo' },
      data: {
        title: `Test Course ${Date.now()}`,
        description: 'E2E test course',
        price: 0,
      },
    });

    const course = (await resp.json()).data;

    await use(course);

    // Cleanup
    await request.delete(`/api/v1/courses/${course.id}`, {
      headers: { 'x-tenant-id': 'trung-tam-demo' },
    });
  },
});
```

### Usage in Tests

```typescript
// tests/e2e/courses/student-enrollment.spec.ts
import { test, expect } from '../fixtures/auth';
import { dataTest } from '../fixtures/data';

dataTest('student can enroll in a course', async ({ studentPage, testCourse }) => {
  await studentPage.goto(`/courses/${testCourse.id}`);

  await expect(studentPage.getByRole('heading')).toHaveText(testCourse.title);
  await studentPage.getByRole('button', { name: /enroll|ghi danh/i }).click();

  await expect(
    studentPage.getByText(/enrolled successfully|đã ghi danh thành công/i),
  ).toBeVisible();
});
```

### StorageState (Session Persistence)

```typescript
// Login once, reuse session
test('admin workflow', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button').click();
  await page.waitForURL('/admin/**');

  // Save state
  await context.storageState({ path: './storage-state/admin.json' });

  await context.close();

  // Reuse in another test
  const ctx2 = await browser.newContext();
  await ctx2.addCookies((await import('./storage-state/admin.json')).cookies);
  const page2 = await ctx2.newPage();
});
```
