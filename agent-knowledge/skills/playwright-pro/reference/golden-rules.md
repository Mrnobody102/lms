# Playwright Reference: Golden Rules

The 10 non-negotiable rules for writing reliable Playwright tests.

## Rule 1: Use getByRole() Over CSS/XPath

CSS and XPath selectors are brittle. Semantic locators survive markup changes.

```typescript
// Bad
await page.locator('.btn-primary').click();
await page.locator('div[class*="submit"]').first().click();

// Good
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('link', { name: 'View Course' }).click();
```

## Rule 2: Never Use page.waitForTimeout()

Hardcoded delays are fragile and slow.

```typescript
// Bad
await page.waitForTimeout(2000);

// Good
await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
await page.waitForURL('**/dashboard');
```

## Rule 3: Understand expect() Auto-Retry

Playwright's `expect(locator)` auto-retries. Unwrapping breaks auto-retry.

```typescript
// Bad — auto-retry disabled
expect(await page.locator('.status').textContent()).toBe('Active');

// Good — auto-retry enabled
await expect(page.locator('.status')).toHaveText('Active');
```

## Rule 4: Isolate Every Test

Tests must not depend on each other. Use `test.beforeEach` for setup.

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Reset state per test
});
```

## Rule 5: Never Hardcode URLs

Use `baseURL` from the config.

```typescript
// playwright.config.ts
export default defineConfig({
  use: { baseURL: 'http://localhost:3000' },
});

// test
await page.goto('/auth/login');
```

## Rule 6: Configure Retries Properly

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
});
```

## Rule 7: Use Traces on First Retry

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

View traces:

```bash
pnpm playwright show-trace
```

## Rule 8: Use Playwright Fixtures Over Globals

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('student@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button').click();
    await use(page);
  },
});

export const { expect } = test;
```

## Rule 9: One Behavior Per Test

```typescript
// Good: one assertion focus per test
test('shows validation error on empty email');
test('navigates to dashboard after login');

// Bad: testing multiple things
test('login flow works and shows dashboard and allows logout');
```

## Rule 10: Mock External Services, Not Your App

```typescript
// Mock a payment gateway
await page.route('https://api.stripe.com/**', (route) => {
  route.fulfill({ status: 200, body: '{}' });
});

// But never mock your own LMS API when testing LMS features
```
