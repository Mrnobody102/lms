import { expect, Page, test } from '@playwright/test';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

const editableCourse = {
  id: 'course-1',
  title: 'IELTS Foundations',
  description: 'Intro course',
  levelId: null,
  aiSettings: {
    enabled: true,
    prompt: 'Give concise feedback.',
  },
  units: [
    {
      id: 'unit-1',
      title: 'Pronunciation',
      description: null,
      order: 1,
      courseId: 'course-1',
    },
  ],
  lessons: [
    {
      id: 'lesson-1',
      title: 'Lesson 1: Skills intro',
      type: 'video',
      content: '',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      aiPrompt: null,
      duration: 12,
      order: 1,
      courseId: 'course-1',
      unitId: 'unit-1',
    },
    {
      id: 'lesson-2',
      title: 'Lesson 2: Greetings',
      type: 'text',
      content: 'Practice greetings.',
      videoUrl: null,
      aiPrompt: null,
      duration: 8,
      order: 2,
      courseId: 'course-1',
      unitId: 'unit-1',
    },
  ],
  enrollments: [],
  _count: { lessons: 2 },
};

async function installAdminApiMocks(page: Page) {
  let currentUser: typeof adminUser | null = null;
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3101',
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
      return currentUser
        ? json(200, currentUser)
        : json(401, { statusCode: 401, message: 'Unauthorized' });
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      currentUser = { ...adminUser };
      return json(200, { user: currentUser });
    }

    if (path.endsWith('/api/admin/overview') && method === 'GET') {
      return json(200, {
        totals: {
          totalStudents: 24,
          newStudents7d: 3,
          inactiveStudents: 2,
          activeCourses: 4,
          activeEnrollments: 18,
          trackedSessions: 12,
          completionRate: 72,
        },
        reporting: {
          activityCalendar: [
            { date: '2026-05-02', sessions: 0, completedLessons: 0, timeSpentSeconds: 0 },
            { date: '2026-05-03', sessions: 1, completedLessons: 0, timeSpentSeconds: 300 },
            { date: '2026-05-04', sessions: 2, completedLessons: 1, timeSpentSeconds: 480 },
            { date: '2026-05-05', sessions: 1, completedLessons: 1, timeSpentSeconds: 360 },
            { date: '2026-05-06', sessions: 3, completedLessons: 1, timeSpentSeconds: 720 },
            { date: '2026-05-07', sessions: 2, completedLessons: 0, timeSpentSeconds: 420 },
            { date: '2026-05-08', sessions: 4, completedLessons: 2, timeSpentSeconds: 960 },
          ],
          practiceAccuracy: {
            attempts: 12,
            score: 86,
            totalPoints: 100,
            accuracy: 86,
          },
          examAccuracy: {
            attempts: 4,
            score: 31,
            totalPoints: 40,
            accuracy: 78,
          },
        },
        recentRegistrations: [
          {
            id: 'student-1',
            email: 'learner@example.com',
            fullName: 'Learner One',
            isActive: true,
            createdAt: '2026-04-21T12:00:00.000Z',
            latestCourseTitle: 'IELTS Foundations',
          },
        ],
      });
    }

    if (path.endsWith('/api/courses') && method === 'GET') {
      return json(200, {
        data: [editableCourse],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/courses/course-1') && method === 'GET') {
      return json(200, editableCourse);
    }

    if (path.endsWith('/api/courses/course-1') && method === 'PATCH') {
      return json(200, { ...editableCourse, ...request.postDataJSON() });
    }

    if (path.endsWith('/api/courses/course-1/report') && method === 'GET') {
      return json(200, {
        course: { id: editableCourse.id, title: editableCourse.title },
        totals: {
          enrolledStudents: 0,
          completedStudents: 0,
          inProgressStudents: 0,
          notStartedStudents: 0,
          totalLessons: editableCourse.lessons.length,
          completedLessons: 0,
          activitySessions: 0,
          totalTimeSpentSeconds: 0,
          averageCompletionPercentage: 0,
          completionRate: 0,
        },
        students: [],
      });
    }

    if (path.endsWith('/api/programs') && method === 'GET') {
      return json(200, [
        {
          id: 'program-1',
          title: 'IELTS',
          slug: 'ielts',
          description: 'IELTS program',
          isActive: true,
          levels: [
            {
              id: 'level-1',
              title: 'IELTS Foundations',
              description: null,
              order: 1,
              isActive: true,
              programId: 'program-1',
            },
          ],
        },
      ]);
    }

    if (path.endsWith('/api/admin/users') && method === 'GET') {
      return json(200, {
        data: [],
        meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
      });
    }

    return route.continue();
  });
}

test('admin can login and view dashboard overview', async ({ page }) => {
  await installAdminApiMocks(page);

  await page.goto('/en/login');
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  await expect(page).toHaveURL(/\/en$/, { timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Learner One')).toBeVisible();
  await expect(page.getByText('IELTS Foundations')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learning reports' })).toBeVisible();
});

test('admin can open course editor without i18n or lesson-table layout regressions', async ({
  page,
}) => {
  await installAdminApiMocks(page);

  await page.goto('/en/login');
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/, { timeout: 60000 });

  await page.goto('/en/courses/course-1/edit');

  await expect(page.locator('input[value="IELTS Foundations"]')).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Curriculum' })).toBeVisible();
  await expect(page.getByText('Pronunciation')).toBeVisible();
  await expect(page.getByText('Lesson 1: Skills intro')).toBeVisible();
  await expect(page.getByText('Lesson 2: Greetings')).toBeVisible();
  await expect(page.getByText(/MISSING_MESSAGE|FORMATTING_ERROR|Could not resolve/)).toHaveCount(0);

  const titleBox = await page.getByText('Lesson 1: Skills intro').boundingBox();
  const durationBox = await page.getByText('12m').boundingBox();
  const editorBox = await page.locator('main').boundingBox();

  expect(titleBox).not.toBeNull();
  expect(durationBox).not.toBeNull();
  expect(editorBox).not.toBeNull();
  expect(durationBox!.x).toBeGreaterThan(titleBox!.x + 120);
  expect(durationBox!.x + durationBox!.width).toBeLessThan(editorBox!.x + editorBox!.width);
});
