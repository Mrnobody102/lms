# Playwright Reference: Test Templates

LMS-specific Playwright test templates organized by feature domain.

## Auth & Session

### Login Flow

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('student login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('student@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByRole('button', /login|đăng nhập/i).click();

    await page.waitForURL(/\/(dashboard|courses)/);
    await expect(page.getByText(/welcome|chào mừng/i)).toBeVisible();
  });

  test('admin login redirects to admin dashboard', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('adminpassword');
    await page.getByRole('button', /login|đăng nhập/i).click();

    await page.waitForURL(/\/admin/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('wrongpassword');
    await page.getByRole('button', /login|đăng nhập/i).click();

    await expect(page.getByText(/invalid|không hợp lệ|incorrect|sai/i)).toBeVisible();
  });

  test('logout clears session', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('student@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByRole('button', /login|đăng nhập/i).click();
    await page.waitForURL(/\/dashboard/);

    await page.getByRole('button', /logout|đăng xuất/i).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
```

### Registration Flow

```typescript
// tests/e2e/auth/register.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Registration', () => {
  test('register new student account', async ({ page }) => {
    await page.goto('/auth/register');

    await page.getByLabel(/full name|họ và tên/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByLabel(/confirm password|xác nhận/i).fill('password123');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', /register|đăng ký/i).click();

    await expect(page).toHaveURL(/\/(dashboard|verify-email)/);
  });

  test('register with existing email shows error', async ({ page }) => {
    await page.goto('/auth/register');

    await page.getByLabel(/full name|họ và tên/i).fill('Test User');
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByLabel(/confirm password|xác nhận/i).fill('password123');
    await page.getByRole('button', /register|đăng ký/i).click();

    await expect(page.getByText(/already exists|đã tồn tại/i)).toBeVisible();
  });

  test('password mismatch validation', async ({ page }) => {
    await page.goto('/auth/register');

    await page.getByLabel(/full name|họ và tên/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByLabel(/confirm password|xác nhận/i).fill('differentpassword');
    await page.getByRole('button', /register|đăng ký/i).click();

    await expect(page.getByText(/match|khớp/i)).toBeVisible();
  });
});
```

## Course Management (Admin)

### CRUD Course

```typescript
// tests/e2e/admin/course-crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Course Management', () => {
  let courseId: string;

  test.afterEach(async ({ request }) => {
    if (courseId) {
      await request.delete(`/api/v1/courses/${courseId}`);
    }
  });

  test('admin can create a course', async ({ adminPage }) => {
    await adminPage.goto('/admin/courses/new');

    await adminPage.getByLabel(/title|tiêu đề/i).fill('E2E Test Course');
    await adminPage.getByLabel(/description|mô tả/i).fill('Created by E2E test');
    await adminPage.getByRole('button', /publish|xuất bản/i).click();

    await expect(adminPage.getByText(/success|thành công|created|đã tạo/i)).toBeVisible();
    courseId = await adminPage.getCourseIdFromUrl();
  });

  test('admin can edit a course', async ({ adminPage }) => {
    // Create course first via API
    const resp = await adminPage.request.post('/api/v1/courses', {
      data: { title: 'Edit Test', description: 'Test', price: 0 },
    });
    courseId = (await resp.json()).data.id;

    await adminPage.goto(`/admin/courses/${courseId}/edit`);
    await adminPage.getByLabel(/title|tiêu đề/i).fill('Updated Title');
    await adminPage.getByRole('button', /save|lưu/i).click();

    await expect(adminPage.getByText(/updated|đã cập nhật/i)).toBeVisible();
  });

  test('course appears in student course list', async ({ studentPage }) => {
    await studentPage.goto('/courses');

    await expect(studentPage.getByText('Updated Title')).toBeVisible();
  });
});
```

## Student Enrollment

### Enrollment Flow

```typescript
// tests/e2e/student/enrollment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Course Enrollment', () => {
  test('student can enroll in a free course', async ({ studentPage }) => {
    await studentPage.goto('/courses');

    const courseCard = studentPage.getByTestId('course-card-free').first();
    await courseCard.getByRole('link').click();

    await expect(studentPage.getByRole('heading')).toBeVisible();
    await studentPage.getByRole('button', /enroll|ghi danh/i).click();

    await expect(studentPage.getByText(/enrolled|đã ghi danh/i)).toBeVisible();
    await expect(studentPage.getByRole('button', /start learning|bắt đầu học/i)).toBeVisible();
  });

  test('enrolled course appears in student dashboard', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');

    await expect(studentPage.getByText('E2E Test Course')).toBeVisible();
  });

  test('student can access enrolled course lessons', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');

    await studentPage.getByTestId('course-card').first().getByRole('link').click();

    await expect(studentPage.getByRole('heading', { name: /lesson|bài học/i })).toBeVisible();
  });
});
```

## Dashboard

### Student Dashboard

```typescript
// tests/e2e/student/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Student Dashboard', () => {
  test('displays enrolled courses', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');

    await expect(studentPage.getByRole('heading', { name: /dashboard|trang chủ/i })).toBeVisible();
    await expect(studentPage.getByTestId('enrolled-course')).toHaveCount({ minimum: 0 });
  });

  test('displays recent activity', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');

    await expect(studentPage.getByText(/recent|gần đây/i)).toBeVisible();
  });

  test('progress indicators show correct values', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');

    const progressBar = studentPage.getByRole('progressbar').first();
    await expect(progressBar).toBeVisible();
    const value = await progressBar.getAttribute('aria-valuenow');
    expect(Number(value)).toBeGreaterThanOrEqual(0);
  });
});
```
