import { expect, Page, test } from '@playwright/test';

const studentUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

const course = {
  id: 'course-1',
  title: 'HSK 1 Basics',
  totalDuration: 30,
  lessons: [
    {
      id: 'lesson-1',
      title: 'Lesson 1',
      type: 'text',
      duration: 10,
      order: 1,
      courseId: 'course-1',
      content: 'Intro lesson content',
    },
  ],
};

async function installStudentApiMocks(page: Page) {
  let currentUser: typeof studentUser | null = null;
  let progress = [] as Array<{
    id: string;
    lessonId: string;
    status: 'COMPLETED';
    updatedAt: string;
  }>;
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3100',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
    }

    if (path.endsWith('/api/users/me') && method === 'GET') {
      if (!currentUser) {
        return json(401, {
          statusCode: 401,
          message: 'Invalid or missing authentication token',
        });
      }

      return json(200, currentUser);
    }

    if (path.endsWith('/api/auth/register') && method === 'POST') {
      const payload = request.postDataJSON() as {
        email: string;
        fullName: string;
      };

      currentUser = {
        ...studentUser,
        email: payload.email,
        fullName: payload.fullName,
      };

      return json(201, { user: currentUser });
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      currentUser = { ...studentUser };
      return json(200, { user: currentUser });
    }

    if (path.endsWith('/api/auth/logout') && method === 'POST') {
      currentUser = null;
      progress = [];

      return json(200, {
        success: true,
        message: 'Logged out successfully',
      });
    }

    if (path.endsWith('/api/courses') && method === 'GET') {
      return json(200, [course]);
    }

    if (path.endsWith('/api/courses/course-1') && method === 'GET') {
      return json(200, course);
    }

    if (path.endsWith('/api/lessons/lesson-1') && method === 'GET') {
      return json(200, course.lessons[0]);
    }

    if (path.endsWith('/api/progress/course/course-1') && method === 'GET') {
      return json(200, progress);
    }

    if (path.endsWith('/api/progress/update') && method === 'POST') {
      progress = [
        {
          id: 'progress-1',
          lessonId: 'lesson-1',
          status: 'COMPLETED',
          updatedAt: '2026-04-21T12:00:00.000Z',
        },
      ];

      return json(200, progress[0]);
    }

    return route.continue();
  });
}

async function openLessonPage(page: Page) {
  await page.getByRole('link', { name: 'Start Now' }).click();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await expect(page).toHaveURL(/\/en\/lessons\/lesson-1$/, { timeout: 20000 });

    const notFoundHeading = page.getByRole('heading', { name: '404' });
    if (!(await notFoundHeading.isVisible().catch(() => false))) {
      return;
    }

    await page.goto('/en/lessons/lesson-1');
  }
}

test('student can register, land on courses, and logout', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/register');
  await page.locator('input[type="text"]').fill('Student User');
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Create Learning Account' }).click();

  await expect(page).toHaveURL(/\/en\/courses$/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'All Courses' })).toBeVisible();
  await expect(page.getByText('Student User')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('student can login, open a lesson, and mark it completed', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/login');
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await expect(page).toHaveURL(/\/en\/courses$/, { timeout: 15000 });
  await openLessonPage(page);
  await expect(page.getByRole('button', { name: 'Mark as Complete' })).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole('button', { name: 'Mark as Complete' }).click();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled();
});
