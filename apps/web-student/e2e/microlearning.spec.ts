import { expect, Page, test } from '@playwright/test';

const studentUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

const lesson = {
  id: 'lesson-1',
  title: 'Greeting micro-cards',
  type: 'micro_card',
  content: JSON.stringify({
    cards: [
      {
        id: 'card-1',
        front: '你好',
        pinyin: 'ni3 hao3',
        back: 'hello',
        example: '你好，我叫 Linh。',
      },
    ],
  }),
  duration: 5,
  order: 1,
  courseId: 'course-1',
  unitId: 'unit-1',
};

const course = {
  id: 'course-1',
  title: 'HSK 1 Basics',
  lessons: [lesson],
  units: [{ id: 'unit-1', title: 'Greetings', order: 1, courseId: 'course-1', lessons: [lesson] }],
  _count: { lessons: 1 },
};

async function installMicrolearningMocks(page: Page) {
  let addToReviewCount = 0;
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3100',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    if (path.endsWith('/api/users/me') && method === 'GET') {
      return json(200, studentUser);
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return json(200, { user: studentUser });
    }

    if (path.endsWith('/api/lessons/lesson-1') && method === 'GET') {
      return json(200, lesson);
    }

    if (path.endsWith('/api/courses/course-1') && method === 'GET') {
      return json(200, course);
    }

    if (path.endsWith('/api/progress/course/course-1') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/progress/activity') && method === 'POST') {
      return json(201, { id: 'activity-1' });
    }

    if (path.endsWith('/api/progress/update') && method === 'POST') {
      return json(200, { id: 'progress-1', lessonId: 'lesson-1', status: 'COMPLETED' });
    }

    if (path.endsWith('/api/certificates/course/course-1') && method === 'GET') {
      return json(200, {
        eligible: false,
        certificate: null,
        progress: {
          course: { id: 'course-1', title: 'HSK 1 Basics' },
          totalLessons: 1,
          completedLessons: 0,
          completionPercentage: 0,
          isComplete: false,
        },
      });
    }

    if (path.endsWith('/api/discussions') && method === 'GET') {
      return json(200, {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }

    if (path.endsWith('/api/lessons/lesson-1/micro-card-events') && method === 'POST') {
      return json(201, { id: 'micro-activity-1' });
    }

    if (
      path.endsWith('/api/lessons/lesson-1/micro-cards/card-1/add-to-review') &&
      method === 'POST'
    ) {
      addToReviewCount += 1;
      return json(201, { id: 'review-card-1' });
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });

  return {
    getAddToReviewCount: () => addToReviewCount,
  };
}

test('student can complete a micro-card and save it to SRS', async ({ page }) => {
  const mocks = await installMicrolearningMocks(page);

  await page.goto('/en/login');
  await page.locator('form[data-hydrated="true"]').waitFor();
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await page.goto('/en/lessons/lesson-1');
  await expect(page.getByText('你好')).toBeVisible();

  await page.getByText('你好').click();
  await expect(page.getByText('hello')).toBeVisible();

  await page.getByLabel('Add to review').click();
  await expect.poll(() => mocks.getAddToReviewCount()).toBe(1);
});
