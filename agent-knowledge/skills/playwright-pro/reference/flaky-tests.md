# Playwright Reference: Flaky Tests

## Diagnosis Workflow

When a test fails intermittently, follow this diagnosis workflow:

### Step 1: Run with Trace

```bash
# Enable full trace on every run
PLAYWRIGHT_TRACES=1 pnpm playwright test --retries=0

# Then open the trace
pnpm playwright show-trace trace.zip
```

### Step 2: Run with Screenshots

```bash
# Capture screenshot on every failure
pnpm playwright test --screenshot=on

# For headed debugging
pnpm playwright test --headed --timeout=30000
```

### Step 3: Check for Common Causes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Test times out on `expect().toBeVisible()` | Element not loading, wrong selector | Use trace to find actual element state |
| Login test fails randomly | Race condition in auth | Add `waitForURL` after login click |
| Count assertion fails | Data not updated yet | Use `expect.poll()` for async updates |
| Network-dependent test fails | API not ready | Use `page.waitForResponse()` |
| i18n text not found | Wrong locale or regex | Check `page.url()` for locale segment |

### Step 4: Use expect.poll() for Unstable Conditions

```typescript
// Bad — fails if element not there immediately
await expect(page.locator('.count')).toHaveText('5');

// Good — polls until condition is met
await expect.poll(async () => {
  const text = await page.locator('.count').textContent();
  return text?.trim();
}, { timeout: 5000 }).toBe('5');
```

### Step 5: Use Retry Config

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  expect: {
    timeout: 5000, // per assertion timeout
  },
});
```

## Common Flaky Patterns and Fixes

### Race Condition: Click and Check

```typescript
// Flaky
await page.getByRole('button').click();
await expect(page.getByText('Success')).toBeVisible();

// Fixed
await page.getByRole('button').click();
await expect(page.getByRole('status')).toHaveText(/success|thành công/i);

// Even better — wait for the network response
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/courses')),
  page.getByRole('button').click(),
]);
expect(response.status()).toBe(200);
```

### Unstable Count Assertions

```typescript
// Flaky — element not updated yet
await expect(page.getByRole('listitem')).toHaveCount(5);

// Fixed
await expect(page.getByRole('listitem')).toHaveCount({ minimum: 1 });
await expect.poll(async () => {
  const count = await page.getByRole('listitem').count();
  return count;
}, { timeout: 10000 }).toBe(5);
```

### Dynamic Content Timing

```typescript
// Flaky — skeleton might match initially
await expect(page.getByText('Course Title')).toBeVisible();

// Fixed — wait for loading to finish
await page.waitForLoadState('networkidle');
await expect(page.getByText('Course Title')).toBeVisible();
```

### Slow Navigation

```typescript
// Flaky — might navigate before content loads
await page.goto('/courses');
await expect(page.getByRole('heading')).toHaveText('Courses');

// Fixed — wait for specific content
await page.goto('/courses');
await page.waitForURL(/\/courses/);
await expect(page.getByRole('heading')).toBeVisible();
```

## CI-Specific Debugging

```bash
# Run failed tests only
pnpm playwright test --retry-only

# Run with GitHub Actions annotations
pnpm playwright test --reporter=github

# Debug a specific test
pnpm playwright test tests/auth/login.spec.ts:10 --headed --timeout=60000
```

## Recording Screenshots and Traces on CI

```yaml
# .github/workflows/e2e.yml
- name: Run Playwright tests
  run: pnpm playwright test
  env:
    BASE_URL: ${{ env.BASE_URL }}

- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-traces
    path: test-results/**/trace.zip
    retention-days: 14
```
