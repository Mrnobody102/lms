# Playwright Reference: Locators

## Locator Priority (Strongest to Weakest)

| Priority | Locator              | When to Use                             | Example                                        |
| -------- | -------------------- | --------------------------------------- | ---------------------------------------------- |
| 1        | `getByRole()`        | Buttons, links, headings, form elements | `page.getByRole('button', { name: 'Submit' })` |
| 2        | `getByLabel()`       | Form fields with visible `<label>`      | `page.getByLabel('Email address')`             |
| 3        | `getByText()`        | Non-interactive visible text            | `page.getByText('Welcome back')`               |
| 4        | `getByPlaceholder()` | Inputs with placeholder text            | `page.getByPlaceholder('Search courses...')`   |
| 5        | `getByTestId()`      | Explicit `data-testid` attributes       | `page.getByTestId('course-card-1')`            |
| 6        | `getByTitle()`       | Elements with `title` attribute         | `page.getByTitle('Open menu')`                 |
| 7        | `getByAltText()`     | Images with alt text                    | `page.getByAltText('Course thumbnail')`        |
| 8        | `page.locator()`     | CSS or XPath (last resort)              | `page.locator('.btn.primary')`                 |

## Common Examples for LMS

```typescript
// Navigation
await page.getByRole('link', { name: /courses|khóa học/i }).click();
await page.getByRole('navigation').getByRole('link', { name: 'Dashboard' });

// Forms
await page.getByLabel('Email').fill('student@example.com');
await page.getByLabel('Password').fill('password123');
await page.getByLabel(/full name|họ và tên/i).fill('Nguyen Van A');

// Buttons
await page.getByRole('button', { name: /login|đăng nhập/i }).click();
await page.getByRole('button', { name: /register|đăng ký/i }).click();
await page.getByRole('button', { name: 'Enroll Now' }).click();

// Content
await page.getByText('Welcome to your course').isVisible();
await page.getByRole('heading', { name: 'Course Details' });

// Table rows
await page.getByRole('row', { name: /course-1|khóa học 1/i });

// Checkbox/Radio
await page.getByRole('checkbox', { name: 'Remember me' }).check();
await page.getByRole('radio', { name: 'Male' }).click();
```

## Regex Matching

Use regex for multi-language support (LMS supports Vietnamese and English):

```typescript
// Match both languages
await page.getByRole('button', { name: /logout|đăng xuất/i }).click();
await page.getByText(/loading|đang tải/i);

// Case-insensitive
await page.getByRole('heading', { name: /course.*details/i });
```

## i18n Aware Testing

```typescript
// For i18n pages, always use regex
async loginAsStudent(page: Page, locale: 'vi' | 'en' = 'vi') {
  await page.goto(`/${locale}/auth/login`);

  const labels = locale === 'vi'
    ? { email: 'Email', password: 'Mật khẩu', submit: /đăng nhập/i }
    : { email: 'Email', password: 'Password', submit: /login/i };

  await page.getByLabel(labels.email).fill('student@example.com');
  await page.getByLabel(labels.password).fill('password123');
  await page.getByRole('button', labels.submit).click();
}
```

## Test IDs for Complex UI

Add `data-testid` for components that are hard to target semantically:

```tsx
// In your component
<div data-testid="course-card" className="course-card">
  <h3>{course.title}</h3>
</div>;

// In test
await page.getByTestId('course-card').first().click();
```

## XPath / CSS (Last Resort)

```typescript
// Only use when no semantic option exists
page.locator('table tbody tr:nth-child(2) td:nth-child(3)');
page.locator('svg.icon-close').first();

// XPath with text
page.locator('xpath=//button[contains(text(), "Submit")]');
```
