# Playwright Pro

**Tier:** POWERFUL
**Category:** Engineering / QA
**Domain:** End-to-End Testing / Browser Automation
**Maintainer:** LMS Agent Team

---

## Overview

Production-grade Playwright testing toolkit for the LMS Platform. Use when writing end-to-end tests, fixing flaky tests, generating test suites from user flows, or automating browser-based workflows. Supports cross-browser testing, CI/CD integration, and multi-tenant test isolation.

---

## Core Capabilities

- **Test generation**: generate E2E test scaffolds from user stories, page URLs, or component descriptions
- **Locator strategies**: resilient selectors that survive markup changes
- **Flaky test diagnosis**: automated root-cause analysis and repair suggestions
- **Cross-browser testing**: Chrome, Firefox, WebKit across desktop and mobile
- **CI/CD integration**: GitHub Actions workflows with retry, trace, and screenshot on failure
- **Multi-tenant test isolation**: clean tenant setup/teardown per test suite

---

## When to Use

Use when:

- Writing end-to-end tests for student enrollment, course playback, or admin workflows
- Debugging a failing browser-based user flow
- Generating regression tests for a new feature
- Setting up CI/CD to run E2E tests on every PR
- Migrating from manual testing to automated E2E

Skip when:

- Writing unit tests (use Vitest) or API integration tests (use Supertest)
- Testing pure backend logic without UI
- Quick one-off browser checks (use manual testing instead)

---

## Key Workflows

### 1. Initialize Playwright

```bash
cd apps/web-student
pnpm add -D @playwright/test
pnpm playwright install --with-deps chromium
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### 2. Write a Test

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Student Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    // Use /vi/ prefix since apps use localePrefix: "always"
    await page.goto('/vi/login');

    await page.getByLabel('Email').fill('student@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /login|đăng nhập/i }).click();

    await expect(page).toHaveURL(/\/vi\/(dashboard|courses)/);
    await expect(page.getByText(/welcome|chào mừng/i)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/vi/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /login|đăng nhập/i }).click();

    await expect(page.getByText(/invalid|không hợp lệ/i)).toBeVisible();
  });
});
```

### 3. Run Tests

```bash
# Local (headless)
pnpm playwright test

# Local (headed, for debugging)
pnpm playwright test --headed

# CI mode
pnpm playwright test --reporter=github
```

### 4. Debug Flaky Tests

```bash
# Show trace viewer for last run
pnpm playwright show-trace trace.zip

# Run single test with retries
pnpm playwright test login.spec.ts --retries=3 --trace=on

# Check for common issues
pnpm playwright test --list
```

---

## Locator Priority

```
1. getByRole()        — buttons, links, headings, form elements (most resilient)
2. getByLabel()       — form fields with visible labels
3. getByText()        — non-interactive visible text
4. getByPlaceholder() — inputs with placeholder text
5. getByTestId()      — explicit data-testid attributes (last resort)
6. page.locator()     — CSS/XPath selectors (avoid when possible)
```

---

## Golden Rules

1. `getByRole()` over CSS/XPath — resilient to markup changes
2. Never `page.waitForTimeout()` — use web-first assertions with auto-retry
3. `expect(locator)` auto-retries; `expect(await locator.textContent())` does not
4. Isolate every test — no shared state between tests; use `test.beforeEach` for setup
5. `baseURL` in config — zero hardcoded URLs
6. Retries: `2` in CI, `0` locally
7. Traces: `'on-first-retry'` — rich debugging without slowdown
8. Fixtures over globals — use Playwright's `test.extend()` for shared state
9. One behavior per test — multiple assertions per test are fine
10. Mock external services only — never mock the LMS app itself

---

## Common Pitfalls

| Pitfall                             | Fix                                                     |
| ----------------------------------- | ------------------------------------------------------- |
| `page.waitForTimeout(1000)`         | Replace with `await expect(locator).toBeVisible()`      |
| CSS selectors like `.btn-primary`   | Use `getByRole('button', { name: 'Submit' })` instead   |
| Shared test state causing flakiness | Use `test.beforeEach` to reset state per test           |
| Hardcoded `localhost:3000`          | Use `baseURL` from config; access via `page.url()`      |
| Not handling multi-tenant isolation | Set `x-tenant-id` header in a project-level `beforeAll` |
| Forgetting to wait for navigation   | Use `await page.waitForURL()` after clicks              |
| Testing implementation details      | Only test visible behavior and DOM state                |

---

## Best Practices

1. **Page Object Model (POM)**: create `pages/` objects that encapsulate page-specific selectors and actions
2. **Multi-language support**: use regex in `getByRole` names (`/login|đăng nhập/i`) for i18n tests
3. **Test data factories**: create helper functions for generating test users, courses, enrollments
4. **Screenshot on failure**: always enable `screenshot: 'only-on-failure'` in CI
5. **Trace for debugging**: enable `trace: 'on-first-retry'` to get full DOM snapshots
6. **CI environment variables**: pass `BASE_URL`, tenant IDs, and test credentials via secrets
7. **Parallel-safe**: never run tests that modify the same database record simultaneously

---

## Related Skills

| Skill              | Use When                                                 |
| ------------------ | -------------------------------------------------------- |
| testing-strategy   | Overall testing pyramid and strategy                     |
| test-suite-builder | API-level test generation (unit + integration)           |
| auth-standards     | Understanding login flow for E2E test setup              |
| senior-frontend    | Understanding frontend patterns to write better locators |

---

## Reference Documentation

See `references/` directory for:

- **golden-rules.md**: The 10 non-negotiable rules for Playwright tests
- **locators.md**: Complete locator priority with cheat sheet
- **assertions.md**: Web-first assertions reference
- **fixtures.md**: Custom fixtures, storageState, and multi-tenant setup
- **common-pitfalls.md**: Top 10 mistakes and fixes
- **flaky-tests.md**: Diagnosis commands and quick fixes
- **template-index.md**: Test templates for LMS-specific flows (login, enrollment, course playback, admin CRUD)
