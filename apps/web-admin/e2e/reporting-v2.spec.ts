import { expect, Page, test } from '@playwright/test';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

const coursesResponse = {
  data: [{ id: 'course-1', title: 'HSK 1 Basics' }],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const cohortsResponse = [
  { id: 'cohort-1', name: 'Morning Cohort', isActive: true, _count: { memberships: 12 } },
  { id: 'cohort-2', name: 'Evening Cohort', isActive: true, _count: { memberships: 10 } },
];

async function installReportingV2Mocks(page: Page) {
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
      return json(200, adminUser);
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return json(200, { user: adminUser });
    }

    if (path.endsWith('/api/courses') && method === 'GET') {
      return json(200, coursesResponse);
    }

    if (path.endsWith('/api/cohorts') && method === 'GET') {
      return json(200, cohortsResponse);
    }

    if (path.endsWith('/api/admin/reports/risk-flags') && method === 'GET') {
      return json(200, {
        data: [
          {
            userId: 'student-1',
            fullName: 'Linh Tran',
            email: 'linh@example.com',
            courseId: 'course-1',
            courseTitle: 'HSK 1 Basics',
            cohortIds: ['cohort-1'],
            severity: 'HIGH',
            score: 75,
            flags: ['NO_ACTIVITY', 'OVERDUE_SRS'],
            reasons: [
              {
                flag: 'NO_ACTIVITY',
                message: 'No learning activity within threshold',
                value: 9,
                threshold: 7,
              },
            ],
            computedAt: '2026-05-24T00:00:00.000Z',
          },
        ],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/admin/reports/risk-flags/recompute') && method === 'POST') {
      return json(200, { computed: 1 });
    }

    if (path.endsWith('/api/admin/reports/cohort-comparison') && method === 'GET') {
      return json(200, {
        data: [
          {
            cohortId: 'cohort-1',
            cohortName: 'Morning Cohort',
            learnerCount: 12,
            completionRate: 72,
            activitySessions: 48,
            practiceAccuracy: 81,
            examAccuracy: 78,
            mastery: 74,
            overdueSrsCards: 6,
            rank: 1,
            deltaCompletion: 0,
          },
          {
            cohortId: 'cohort-2',
            cohortName: 'Evening Cohort',
            learnerCount: 10,
            completionRate: 58,
            activitySessions: 32,
            practiceAccuracy: 73,
            examAccuracy: 70,
            mastery: 66,
            overdueSrsCards: 14,
            rank: 2,
            deltaCompletion: -14,
          },
        ],
        filters: {},
      });
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });
}

test('admin can review risk flags and trigger recompute', async ({ page }) => {
  await installReportingV2Mocks(page);
  await page.goto('/en/reports/risk');

  await expect(page.getByRole('heading', { name: 'Risk flags' })).toBeVisible();
  await expect(page.getByText('Linh Tran')).toBeVisible();
  await expect(page.getByRole('table').getByText('Overdue SRS')).toBeVisible();

  await page.getByRole('button', { name: 'Recompute' }).click();
  await expect(page.getByText('No learning activity within threshold')).toBeVisible();
});

test('admin can compare cohorts with normalized metrics', async ({ page }) => {
  await installReportingV2Mocks(page);
  await page.goto('/en/reports/cohorts');

  await expect(page.getByRole('heading', { name: 'Cohort comparison' })).toBeVisible();
  await expect(page.getByText('Morning Cohort').first()).toBeVisible();
  await expect(page.getByText('Evening Cohort').first()).toBeVisible();
  await expect(page.getByText('-14%')).toBeVisible();
});
