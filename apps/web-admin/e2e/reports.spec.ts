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

    if (path.endsWith('/api/admin/reports/programs') && method === 'GET') {
      return json(200, {
        programs: [
          {
            id: 'prog-1',
            title: 'Foundations of UI',
            levelCount: 2,
            courseCount: 5,
            enrollmentCount: 100,
            lessonCount: 24,
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
          lessonCount: 8,
          completionRate: 30,
          practiceAccuracy: 60,
          examAccuracy: 55,
        },
      });
    }

    if (path.endsWith('/api/admin/reports/mastery-trend') && method === 'GET') {
      return json(200, {
        series: [
          {
            cohortId: 'all',
            cohortName: 'All learners',
            trend: [
              { date: '2026-05-22', listening: 72, speaking: 68 },
              { date: '2026-05-23', listening: 75, speaking: 70 },
            ],
          },
        ],
      });
    }

    if (path.endsWith('/api/admin/reports/activity-trend') && method === 'GET') {
      return json(200, {
        series: [
          {
            cohortId: 'all',
            cohortName: 'All learners',
            trend: [
              { date: '2026-05-22', opened: 12, completed: 8 },
              { date: '2026-05-23', opened: 18, completed: 11 },
            ],
          },
        ],
      });
    }

    if (path.endsWith('/api/admin/reports/skills') && method === 'GET') {
      return json(200, {
        accuracyByUnit: [],
        accuracyBySkill: [
          { skill: 'listening', accuracy: 80, totalQuestions: 100 },
          { skill: 'speaking', accuracy: 90, totalQuestions: 80 },
        ],
        filters: {},
      });
    }

    return route.continue();
  });
}

test('admin can view reports dashboard and see time-series charts', async ({ page }) => {
  await installAdminReportsApiMocks(page);

  // Login
  await page.goto('/en/login');
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  // Navigate to Reports
  await page.goto('/en/reports');

  // Verify Dashboard elements
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();

  // Verify Time-Series Reporting (Feature 2 / Batch 3)
  await expect(page.getByRole('heading', { name: 'Skill mastery trend' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learning activity' })).toBeVisible();

  // Verify Cohort Filter
  const cohortSelect = page.locator('select').first();
  await cohortSelect.waitFor();
  await expect(cohortSelect).toBeVisible();
  await cohortSelect.selectOption({ label: 'Cohort Alpha' });

  // Verify Program Rows
  await expect(page.getByText('Foundations of UI')).toBeVisible();
  await expect(page.getByText('Unassigned')).toBeVisible();
});
