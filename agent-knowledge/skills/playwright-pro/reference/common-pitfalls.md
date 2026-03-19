# Playwright Reference: Common Pitfalls

## Top 10 Mistakes and Fixes

### 1. Using waitForTimeout()

```typescript
// Bad — hardcoded, unreliable
await page.waitForTimeout(2000);

// Good — wait for actual condition
await expect(page.getByRole('button')).toBeVisible();
await page.waitForResponse(response => response.url().includes('/api/'));
await page.waitForLoadState('networkidle');
```

### 2. CSS/XPath Selectors Instead of Semantic Locators

```typescript
// Bad — brittle
await page.locator('.btn-primary').first().click();
await page.locator('div[class*="course"]').nth(2).click();

// Good — resilient
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByTestId(`course-card-${index}`).click();
```

### 3. Shared State Between Tests

```typescript
// Bad — test B depends on test A creating this
let courseId: string;

test('create course', async ({ adminPage }) => {
  courseId = await createCourse(adminPage);
});

test('edit course', async ({ adminPage }) => {
  await adminPage.goto(`/admin/courses/${courseId}/edit`); // race condition
});

// Good — each test creates its own data
test('edit course', async ({ adminPage }) => {
  const courseId = await createCourse(adminPage); // fresh data
  await adminPage.goto(`/admin/courses/${courseId}/edit`);
});
```

### 4. Hardcoded URLs

```typescript
// Bad
await page.goto('http://localhost:3000/courses');

// Good
await page.goto('/courses'); // uses baseURL from config
```

### 5. Testing Implementation Details

```typescript
// Bad — testing internal state
const count = await page.evaluate(() => window.__store.state.count);
expect(count).toBe(5);

// Good — testing visible behavior
await expect(page.getByText('5 items')).toBeVisible();
```

### 6. Not Handling i18n

```typescript
// Bad — English only
await page.getByRole('button', { name: 'Login' }).click(); // fails on Vietnamese

// Good — regex for both languages
await page.getByRole('button', { name: /login|đăng nhập/i }).click();
```

### 7. Forgetting Multi-Tenant Isolation

```typescript
// Bad — no tenant context
await page.goto('/courses'); // might hit wrong tenant

// Good — set tenant header via request context
await context.route('**/api/**', async (route) => {
  await route.continue({ headers: { ...route.request().headers(), 'x-tenant-id': 'trung-tam-demo' } });
});
```

### 8. Not Waiting for Navigation

```typescript
// Bad — click and immediately check URL
await page.getByRole('link', { name: 'Courses' }).click();
expect(page.url()).toContain('/courses');

// Good — wait for URL change
await page.getByRole('link', { name: 'Courses' }).click();
await page.waitForURL(/\/courses/);
```

### 9. Ignoring Auto-Retry on unwrapped Values

```typescript
// Bad — auto-retry disabled
expect(await page.locator('.status').textContent()).toBe('Active');

// Good — auto-retry enabled
await expect(page.locator('.status')).toHaveText('Active');
```

### 10. Not Cleaning Up Test Data

```typescript
// Bad — creates orphaned records
test('create and delete course', async ({ adminPage }) => {
  await createCourse(adminPage); // no cleanup
  await deleteCourse(adminPage);
});

// Good — cleanup in afterEach or fixture
test('create and delete course', async ({ adminPage }) => {
  const course = await createCourse(adminPage);
  await deleteCourse(adminPage, course.id);
});
```
