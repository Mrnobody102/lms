import { expect, Page, test } from '@playwright/test';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

const course = {
  id: 'course-1',
  title: 'IELTS Foundations',
  description: null,
  levelId: null,
  lessons: [],
  enrollments: [],
  units: [{ id: 'unit-1', title: 'Greetings', order: 1, courseId: 'course-1' }],
  _count: { lessons: 0 },
};

async function installRoleplayScenarioMocks(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3101',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };
  const scenarios = [
    {
      id: 'scenario-1',
      courseId: 'course-1',
      unitId: 'unit-1',
      title: 'Cafe order',
      description: 'Order a drink with constraints.',
      targetLanguage: 'en-US',
      level: 'IELTS Foundations',
      skillTags: ['speaking'],
      mode: 'MIXED',
      systemPrompt: 'Act as a cafe cashier.',
      openingMessage: 'Welcome!',
      isPublished: false,
      course: { id: 'course-1', title: 'IELTS Foundations' },
      unit: { id: 'unit-1', title: 'Greetings' },
      _count: { sessions: 0 },
    },
  ];

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
      return json(200, {
        data: [course],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/courses/course-1') && method === 'GET') {
      return json(200, course);
    }

    if (path.endsWith('/api/roleplay/scenarios') && method === 'GET') {
      return json(200, {
        data: scenarios,
        meta: { page: 1, limit: 100, total: scenarios.length, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/roleplay/scenarios') && method === 'POST') {
      const body = request.postDataJSON() as { title: string; systemPrompt: string };
      const created = {
        ...scenarios[0]!,
        id: 'scenario-2',
        title: body.title,
        systemPrompt: body.systemPrompt,
      };
      scenarios.push(created);
      return json(201, created);
    }

    if (path.endsWith('/api/roleplay/scenarios/scenario-1/publish') && method === 'POST') {
      scenarios[0]!.isPublished = true;
      return json(200, scenarios[0]);
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });
}

test('admin can create and publish roleplay scenarios', async ({ page }) => {
  await installRoleplayScenarioMocks(page);

  await page.goto('/en/roleplay/scenarios');
  await expect(page.getByRole('heading', { name: 'Roleplay Scenarios' })).toBeVisible();
  await expect(page.getByText('Cafe order')).toBeVisible();

  await page.getByLabel('Scenario name').fill('Hotel check-in');
  await page.getByLabel('System prompt').fill('Act as a hotel receptionist.');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Roleplay scenario created.')).toBeVisible();
  await expect(page.getByText('Hotel check-in')).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).first().click();
  await expect(page.getByText('Scenario publication status updated.')).toBeVisible();
});
