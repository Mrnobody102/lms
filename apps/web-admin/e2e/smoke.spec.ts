import { expect, Page, test } from '@playwright/test';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
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
        recentRegistrations: [
          {
            id: 'student-1',
            email: 'learner@example.com',
            fullName: 'Learner One',
            isActive: true,
            createdAt: '2026-04-21T12:00:00.000Z',
            latestCourseTitle: 'HSK 1 Basics',
          },
        ],
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
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/en$/, { timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Learner One')).toBeVisible();
  await expect(page.getByText('HSK 1 Basics')).toBeVisible();
});
