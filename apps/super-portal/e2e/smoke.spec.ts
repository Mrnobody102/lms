import { expect, Page, test } from '@playwright/test';

const superAdminUser = {
  id: 'super-admin-1',
  email: 'super@example.com',
  fullName: 'Super Admin',
  role: 'SUPER_ADMIN',
  tenantId: 'system',
};

const tenantRecords = [
  {
    id: 'tenant-1',
    name: 'North Campus',
    slug: 'north-campus',
    domain: 'north.example.com',
    settings: {
      branding: {
        brandName: 'North Academy',
        primaryColor: '#0f766e',
      },
      localization: {
        defaultLocale: 'en',
      },
      support: {
        email: 'support@north.example.com',
      },
      limits: {
        maxStudents: 500,
        maxCourses: 40,
      },
      features: {
        aiTutorEnabled: true,
        activationCodesEnabled: true,
      },
    },
    isActive: true,
    createdAt: '2026-04-21T12:00:00.000Z',
  },
  {
    id: 'tenant-2',
    name: 'South Campus',
    slug: 'south-campus',
    domain: null,
    settings: {
      features: {
        aiTutorEnabled: false,
        activationCodesEnabled: true,
      },
    },
    isActive: false,
    createdAt: '2026-05-01T12:00:00.000Z',
  },
];

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
      return json(200, tenantRecords);
    }

    const tenantMatch = path.match(/\/api\/admin\/tenants\/([^/]+)$/);
    if (tenantMatch && method === 'GET') {
      const tenant = tenantRecords.find((item) => item.id === tenantMatch[1]);
      return tenant
        ? json(200, tenant)
        : json(404, { statusCode: 404, message: 'Tenant not found' });
    }

    if (tenantMatch && method === 'PUT') {
      const tenant = tenantRecords.find((item) => item.id === tenantMatch[1]);
      const payload = request.postDataJSON() as Partial<(typeof tenantRecords)[number]>;
      return tenant
        ? json(200, { ...tenant, ...payload })
        : json(404, { statusCode: 404, message: 'Tenant not found' });
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
  await expect(page.getByText('South Campus')).toBeVisible();
  await page.getByRole('button', { name: 'Inactive' }).click();
  await expect(page.getByText('South Campus')).toBeVisible();
  await expect(page.getByText('North Campus')).toHaveCount(0);
  await expect(page.getByText('Super Portal').first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByText('North Campus')).toBeVisible({ timeout: 15000 });
});

test('super admin can review and edit tenant settings', async ({ page }) => {
  await installSuperPortalApiMocks(page);

  await page.goto('/en');
  await page.locator('input[type="email"]').fill('super@example.com');
  await page.locator('input[type="password"]').fill('Super@123');
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByText('North Campus')).toBeVisible({ timeout: 15000 });
  await page.getByLabel('View details').first().click();

  await expect(page).toHaveURL(/\/en\/tenants\/tenant-1$/);
  await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
  await expect(page.getByText('support@north.example.com')).toBeVisible();
  await expect(page.getByText('Portal preview')).toBeVisible();

  await page.getByRole('button', { name: 'Branding' }).click();
  const brandNameInput = page.locator('input[type="text"]').first();
  await expect(brandNameInput).toHaveValue('North Academy');
  await brandNameInput.fill('North Academy Pro');
  await expect(page.getByRole('button', { name: 'Reset changes' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Save settings' })).toBeEnabled();
});
