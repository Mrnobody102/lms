import { expect, Page, test } from '@playwright/test';

const superAdminUser = {
  id: 'super-admin-1',
  email: 'super@example.com',
  fullName: 'Super Admin',
  role: 'SUPER_ADMIN',
  tenantId: 'system',
};

async function installSuperPortalApiMocks(page: Page) {
  let currentUser: typeof superAdminUser | null = null;
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3102',
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
      currentUser = { ...superAdminUser };
      return json(200, { user: currentUser });
    }

    if (path.endsWith('/api/admin/tenants') && method === 'GET') {
      return json(200, [
        {
          id: 'tenant-1',
          name: 'North Campus',
          slug: 'north-campus',
          domain: 'north.example.com',
          settings: {},
          isActive: true,
          createdAt: '2026-04-21T12:00:00.000Z',
        },
      ]);
    }

    return route.continue();
  });
}

test('super admin can login and view tenants', async ({ page }) => {
  await installSuperPortalApiMocks(page);

  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'Super Portal' })).toBeVisible();
  await page.locator('input[type="email"]').fill('super@example.com');
  await page.locator('input[type="password"]').fill('Super@123');
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByText('North Campus')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('north.example.com')).toBeVisible();
  await expect(page.getByText('Super Portal').first()).toBeVisible();
});
