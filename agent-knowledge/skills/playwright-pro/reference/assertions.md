# Playwright Reference: Assertions

## Web-First Assertions (Preferred)

Playwright's auto-retrying assertions wait for conditions naturally.

```typescript
import { expect } from '@playwright/test';

// Text content
await expect(page.getByRole('heading')).toHaveText('Course Title');
await expect(page.getByText('Welcome')).toContainText('welcome back');

// Visibility
await expect(page.getByRole('button')).toBeVisible();
await expect(page.getByRole('alert')).toBeHidden();

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);
await expect(page.locator('.course-card')).toHaveCount({ minimum: 1 });

// Input values
await expect(page.getByLabel('Email')).toHaveValue('user@example.com');

// Attributes
await expect(page.getByRole('link')).toHaveAttribute('href', '/courses');
await expect(page.getByRole('img')).toHaveAttribute('alt', /course thumbnail/i);

// State
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(page.getByRole('button')).toBeDisabled();

// URL and Title
await expect(page).toHaveURL(/\/dashboard/);
await expect(page).toHaveTitle(/Dashboard/);

// Network (wait for response)
await expect(page.getByRole('status')).toHaveText('Published', { timeout: 5000 });
```

## Non-Auto-Retrying Assertions

These do NOT retry. Use only for values that are already known to be present.

```typescript
// These do NOT auto-retry — use with caution
expect(await page.locator('.count').textContent()).toBe('10');
const title = await page.title();
expect(title).toContain('Dashboard');
```

## Locator Assertions (Auto-Retry)

All assertions on `expect(locator)` auto-retry:

```typescript
// Auto-retries until condition is met or timeout
await expect(page.getByRole('status')).toHaveText('Success');

// Timeout override
await expect(page.getByRole('status')).toHaveText('Success', { timeout: 10000 });
```

## Negated Assertions

```typescript
await expect(page.getByText('Error')).not.toBeVisible();
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('dialog')).not.toBeAttached();
```

## Custom Matchers

```typescript
// Using expect with toPass/not.toPass for flaky conditions
await expect(async () => {
  const counter = await page.locator('.count').textContent();
  expect(Number(counter)).toBeGreaterThan(0);
}).toPass({ intervals: [1_000, 2_000, 5_000], timeout: 30_000 });

// Screenshot comparison
await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
```

## Soft Assertions (Collect All Failures)

```typescript
// Continue checking even if one assertion fails
await expect.soft(page.getByRole('heading')).toHaveText('Dashboard');
await expect.soft(page.getByRole('button')).toHaveCount(3);
await expect.soft(page.getByText('Welcome')).toBeVisible();

// Report all failures at once
```

## LMS-Specific Assertions

```typescript
// Course enrolled status
await expect(page.getByRole('status', { name: /enrolled|đã ghi danh/i })).toBeVisible();

// Lesson progress
await expect(page.getByText(/progress|tiến độ/i)).toBeVisible();
await expect(page.getByRole('progressbar')).toHaveValue(/\d+/);

// Lesson navigation
await expect(page.getByRole('button', { name: /next|bài tiếp/i })).toBeEnabled();
await expect(page.getByRole('button', { name: /previous|bài trước/i })).toBeDisabled();
```
