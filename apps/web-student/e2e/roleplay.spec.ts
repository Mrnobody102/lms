import { expect, Page, test } from '@playwright/test';

const studentUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

const mockSession = {
  id: 'session-1',
  scenario: 'You are a hotel receptionist checking me in.',
  status: 'IN_PROGRESS',
  messages: [],
  startedAt: new Date().toISOString(),
};

async function installRoleplayApiMocks(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3100',
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
      return json(200, studentUser);
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return json(200, { user: studentUser });
    }

    if (path.endsWith('/api/roleplay/sessions') && method === 'GET') {
      return json(200, [mockSession]);
    }

    if (path.endsWith('/api/roleplay/sessions') && method === 'POST') {
      const body = request.postDataJSON() as { scenario: string };
      return json(201, {
        ...mockSession,
        id: 'session-2',
        scenario: body?.scenario,
      });
    }

    if (
      path.includes('/api/roleplay/sessions/') &&
      !path.endsWith('/messages') &&
      !path.endsWith('/complete') &&
      method === 'GET'
    ) {
      return json(200, {
        ...mockSession,
        messages: [
          {
            id: 'msg-1',
            role: 'SYSTEM',
            content: 'Scenario: You are a hotel receptionist.',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    if (
      path.includes('/api/roleplay/sessions/') &&
      path.endsWith('/messages') &&
      method === 'POST'
    ) {
      const body = request.postDataJSON() as { content: string };
      return json(201, {
        ...mockSession,
        messages: [
          {
            id: 'msg-1',
            role: 'SYSTEM',
            content: 'Scenario: You are a hotel receptionist.',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            role: 'USER',
            content: body?.content,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg-3',
            role: 'AI',
            content: 'Hello, welcome to the Grand Hotel. How can I assist you?',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    if (
      path.includes('/api/roleplay/sessions/') &&
      path.endsWith('/complete') &&
      method === 'POST'
    ) {
      return json(201, {
        ...mockSession,
        status: 'COMPLETED',
        score: 85,
        feedback: {
          grammar: 'Good grammar',
          vocabulary: 'Appropriate word choice',
          overall: 'A pleasant conversation.',
        },
      });
    }

    return route.continue();
  });
}

test('student can view roleplay dashboard and interact with chat', async ({ page }) => {
  await installRoleplayApiMocks(page);

  // Login
  await page.goto('/en/login');
  await page.locator('form[data-hydrated="true"]').waitFor();
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  // Navigate to Roleplay
  await page.goto('/en/roleplay');
  await expect(page.getByRole('heading', { name: 'Conversation Practice' })).toBeVisible();

  // See existing session
  await expect(page.getByText('You are a hotel receptionist checking me in.')).toBeVisible();

  // Start new session
  await page.getByRole('button', { name: 'New Session' }).click();
  await page.getByText('You are a recruiter interviewing me').click();

  // Wait to navigate to chat
  await expect(page).toHaveURL(/\/en\/roleplay\/session-2/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Roleplay Session' })).toBeVisible();

  // Send message
  await page.getByPlaceholder('Type your message...').fill('Hi, I am here for the interview.');
  await page.locator('form button[type="submit"]').click();

  // Check AI response
  await expect(
    page.getByText('Hello, welcome to the Grand Hotel. How can I assist you?'),
  ).toBeVisible();

  // End conversation
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'End Conversation' }).click();

  // Check feedback
  await expect(page.getByRole('heading', { name: 'Final Evaluation' })).toBeVisible();
  await expect(page.getByText('Score: 85/100')).toBeVisible();
});
