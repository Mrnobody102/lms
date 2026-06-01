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
  let featureFlags = {
    aiTutorEnabled: true,
    activationCodesEnabled: true,
    roleplayEnabled: false,
    marketplaceEnabled: false,
    billingEnabled: true,
    mediaUploadEnabled: true,
  };
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

    if (path.endsWith('/api/auth/refresh') && method === 'POST') {
      return currentUser
        ? json(200, { user: currentUser })
        : json(401, { statusCode: 401, message: 'Unauthorized' });
    }

    if (path.endsWith('/api/admin/tenants') && method === 'GET') {
      return json(200, tenantRecords);
    }

    if (path.endsWith('/api/admin/system/telemetry') && method === 'GET') {
      return json(200, {
        overview: {
          totalTenants: 2,
          activeTenants: 1,
          totalUsers: 42,
          activeUsers: 30,
          totalCourses: 8,
          totalEnrollments: 35,
          totalLearningActivities: 120,
        },
        runtime: {
          process: { pid: 123, uptimeSeconds: 3600 },
          cpu: { cores: 4, loadAverage1m: 0.2, loadAverage5m: 0.3, loadAverage15m: 0.4 },
          memory: { rssMb: 256, heapUsedMb: 100, heapTotalMb: 180, externalMb: 12 },
          prisma: { activeConnections: 3 },
        },
        requestMetrics: {
          generatedAt: '2026-05-31T00:00:00.000Z',
          uptimeSeconds: 3600,
          totalRequests: 500,
          totalErrors: 2,
          groups: {
            api: {
              count: 500,
              errorCount: 2,
              averageDurationMs: 45,
              maxDurationMs: 250,
              statusCounts: { '2xx': 498, '5xx': 2 },
            },
          },
          tenantTraffic: [
            {
              tenantId: 'tenant-1',
              count: 240,
              errorCount: 1,
              averageDurationMs: 40,
              maxDurationMs: 120,
              lastSeenAt: '2026-05-31T00:00:00.000Z',
            },
          ],
        },
        alerts: [],
        prometheus: { endpoint: '/api/health/metrics/prometheus' },
        recentTenants: tenantRecords,
      });
    }

    if (path.endsWith('/api/admin/platform/usage') && method === 'GET') {
      return json(200, [
        {
          tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
          mediaAssets: 3,
          mediaStorageBytes: 1048576,
          ledger: [{ type: 'MEDIA_UPLOAD', unit: 'bytes', quantity: '1048576' }],
          requestMetrics: {
            count: 240,
            errorCount: 1,
            averageDurationMs: 40,
            maxDurationMs: 120,
            lastSeenAt: '2026-05-31T00:00:00.000Z',
          },
        },
      ]);
    }

    if (path.endsWith('/api/admin/platform/billing') && method === 'GET') {
      return json(200, {
        plans: [],
        subscriptions: [
          {
            id: 'sub-1',
            tenantId: 'tenant-1',
            tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus' },
            plan: { id: 'plan-1', name: 'Pro', code: 'pro' },
            status: 'ACTIVE',
            storageQuotaBytes: '1073741824',
            aiRequestQuota: 1000,
          },
        ],
        invoices: [],
        payments: [],
      });
    }

    if (path.endsWith('/api/admin/platform/domains') && method === 'GET') {
      return json(200, [
        {
          tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
          domain: 'north.example.com',
          status: 'configured',
          metadata: {},
        },
      ]);
    }

    if (path.endsWith('/api/admin/platform/feature-flags') && method === 'GET') {
      return json(200, [
        {
          tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
          featureFlags,
        },
      ]);
    }

    if (path.endsWith('/api/admin/platform/feature-flags/tenant-1') && method === 'PATCH') {
      featureFlags = {
        ...featureFlags,
        ...(request.postDataJSON() as Partial<typeof featureFlags>),
      };
      return json(200, {
        tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
        featureFlags,
      });
    }

    if (path.endsWith('/api/admin/platform/audit-logs') && method === 'GET') {
      return json(200, [
        {
          id: 'audit-1',
          tenantId: 'tenant-1',
          action: 'PLATFORM_FEATURE_FLAGS_UPDATE',
          status: 'SUCCESS',
          userId: 'super-admin-1',
          createdAt: '2026-05-31T00:00:00.000Z',
          user: superAdminUser,
        },
      ]);
    }

    if (path.endsWith('/api/admin/platform/incidents') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/admin/platform/ai-status') && method === 'GET') {
      return json(200, {
        mode: 'env-managed',
        provider: 'groq',
        configured: true,
        model: 'llama-3.1-8b-instant',
        dynamicConfigEnabled: false,
        keyStorage: 'render-env',
        keyMasked: 'configured',
        frontendExposureAllowed: false,
      });
    }

    const overviewMatch = path.match(/\/api\/admin\/tenants\/([^/]+)\/overview$/);
    if (overviewMatch && method === 'GET') {
      const tenant = tenantRecords.find((item) => item.id === overviewMatch[1]);
      return tenant
        ? json(200, {
            tenant,
            counts: {
              users: 10,
              activeUsers: 8,
              courses: 4,
              enrollments: 9,
              lessons: 20,
              mediaAssets: 3,
              mediaStorageBytes: 1048576,
            },
            subscription: {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: { id: 'plan-1', name: 'Pro', code: 'pro' },
              storageQuotaBytes: '1073741824',
              aiRequestQuota: 1000,
            },
            readiness: {
              hasDomain: true,
              hasActiveSubscription: true,
              hasStorageQuota: true,
              hasAiQuota: true,
              featureFlags,
            },
            recentAuditLogs: [],
          })
        : json(404, { statusCode: 404, message: 'Tenant not found' });
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

  await page.goto('/en/tenants');
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

  await page.goto('/en/tenants');
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

test('super admin can inspect real operations pages and toggle a feature flag', async ({
  page,
}) => {
  await installSuperPortalApiMocks(page);

  await page.goto('/en');
  await page.locator('input[type="email"]').fill('super@example.com');
  await page.locator('input[type="password"]').fill('Super@123');
  await page.locator('form button[type="submit"]').click();

  await page.goto('/en/tenants');
  await expect(page.getByText('North Campus')).toBeVisible({ timeout: 15000 });

  await page.goto('/en/plans-billing');
  await expect(page.getByText('Tenant subscriptions')).toBeVisible();
  await expect(page.getByText('Pro')).toBeVisible();

  await page.goto('/en/usage-storage');
  await expect(page.getByText('Usage by tenant')).toBeVisible();
  await expect(page.getByText('North Campus')).toBeVisible();

  await page.goto('/en/feature-flags');
  await expect(page.getByText('North Campus')).toBeVisible();
  await page.getByRole('button', { name: 'Roleplay' }).click();
  await expect(page.getByText('Feature flags updated.')).toBeVisible();

  await page.goto('/en/audit-logs');
  await expect(page.getByText('PLATFORM_FEATURE_FLAGS_UPDATE')).toBeVisible();

  await page.goto('/en/ai-settings');
  await expect(page.getByText('AI provider safety status')).toBeVisible();
  await expect(page.getByText('llama-3.1-8b-instant')).toBeVisible();
});
