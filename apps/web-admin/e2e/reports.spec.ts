import { expect, Page, test } from '@playwright/test';

const adminUser = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

async function installAdminReportsApiMocks(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3101',
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
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    if (path.endsWith('/api/users/me') && method === 'GET') {
      return json(200, adminUser);
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return json(200, { user: adminUser });
    }

    if (path.endsWith('/api/cohorts') && method === 'GET') {
      return json(200, [
        { id: 'cohort-1', name: 'Cohort Alpha' },
        { id: 'cohort-2', name: 'Cohort Beta' },
      ]);
    }

    if (path.endsWith('/api/reports/programs') && method === 'GET') {
      return json(200, {
        programs: [
          {
            id: 'prog-1',
            title: 'Foundations of UI',
            levelCount: 2,
            courseCount: 5,
            enrollmentCount: 100,
            completionRate: 50,
            practiceAccuracy: 80,
            examAccuracy: 75,
          },
        ],
        unassigned: {
          id: null,
          title: 'Unassigned',
          levelCount: 0,
          courseCount: 2,
          enrollmentCount: 20,
          completionRate: 30,
          practiceAccuracy: 60,
          examAccuracy: 55,
        },
      });
    }

    if (path.endsWith('/api/reports/trend') && method === 'GET') {
      return json(200, {
        trend: [
          { date: 'Mon', listening: 40, speaking: 50 },
          { date: 'Tue', listening: 45, speaking: 55 },
          { date: 'Wed', listening: 50, speaking: 60 },
          { date: 'Thu', listening: 60, speaking: 70 },
          { date: 'Fri', listening: 70, speaking: 80 },
          { date: 'Sat', listening: 75, speaking: 85 },
          { date: 'Sun', listening: 80, speaking: 90 },
        ],
      });
    }

    if (path.endsWith('/api/reports/activity') && method === 'GET') {
      return json(200, {
        activeUsers: 150,
        completedLessons: 450,
        practiceAttempts: 320,
        activityTrend: [
          { date: 'Mon', count: 10 },
          { date: 'Tue', count: 20 },
          { date: 'Wed', count: 50 },
          { date: 'Thu', count: 30 },
          { date: 'Fri', count: 40 },
          { date: 'Sat', count: 60 },
          { date: 'Sun', count: 90 },
        ],
      });
    }

    if (path.endsWith('/api/reports/skills') && method === 'GET') {
      return json(200, [
        { skillCode: 'listening', skillName: 'Listening', accuracy: 80, attemptCount: 100 },
        { skillCode: 'speaking', skillName: 'Speaking', accuracy: 90, attemptCount: 80 },
      ]);
    }

    return route.continue();
  });
}

test('admin can view reports dashboard and see time-series charts', async ({ page }) => {
  await installAdminReportsApiMocks(page);

  // Login
  await page.goto('/en/login');
  await page.locator('form[data-hydrated="true"]').waitFor();
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  // Navigate to Reports
  await page.goto('/en/reports');

  // Verify Dashboard elements
  await expect(page.getByRole('heading', { name: 'Program Performance' })).toBeVisible();

  // Verify Time-Series Reporting (Feature 2 / Batch 3)
  await expect(page.getByRole('heading', { name: 'Skill Mastery Trend' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learning Activity Trend' })).toBeVisible();

  // Verify Cohort Filter
  const cohortSelect = page.locator('select');
  await cohortSelect.waitFor();
  await expect(cohortSelect).toBeVisible();
  await cohortSelect.selectOption({ label: 'Cohort Alpha' });

  // Verify Program Rows
  await expect(page.getByText('Foundations of UI')).toBeVisible();
  await expect(page.getByText('Unassigned')).toBeVisible();
});
