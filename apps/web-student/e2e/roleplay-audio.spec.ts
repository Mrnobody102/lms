import { expect, Page, test } from '@playwright/test';

const studentUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

async function installRoleplayAudioMocks(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3100',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };
  const session = {
    id: 'session-audio',
    scenario: 'Practice ordering coffee.',
    scenarioId: 'scenario-audio',
    mode: 'AUDIO',
    status: 'IN_PROGRESS',
    score: null,
    pronunciationScore: null,
    messages: [],
    pronunciationAssessments: [],
    startedAt: '2026-05-24T00:00:00.000Z',
  };

  await page.route('**/mock-upload/**', async (route) => {
    await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
  });

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
      return json(200, studentUser);
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      return json(200, { user: studentUser });
    }

    if (path.endsWith('/api/roleplay/sessions/session-audio') && method === 'GET') {
      return json(200, session);
    }

    if (path.endsWith('/api/media/presigned-url') && method === 'POST') {
      return json(201, {
        assetId: 'asset-1',
        storageKey: 'roleplay/audio.wav',
        uploadUrl: 'http://127.0.0.1:3100/mock-upload/audio.wav',
      });
    }

    if (path.endsWith('/api/media/asset-1/complete') && method === 'POST') {
      return json(200, { id: 'asset-1', url: 'https://cdn.example.com/audio.wav' });
    }

    if (path.endsWith('/api/roleplay/sessions/session-audio/messages/audio') && method === 'POST') {
      return json(201, {
        ...session,
        messages: [
          {
            id: 'msg-audio',
            role: 'USER',
            content: 'Wo yao yi bei kafei',
            audioMediaAssetId: 'asset-1',
            createdAt: '2026-05-24T00:01:00.000Z',
          },
        ],
        pronunciationAssessments: [
          {
            id: 'assessment-1',
            messageId: 'msg-audio',
            status: 'PROCESSING',
          },
        ],
      });
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });
}

test('student can upload roleplay audio and see pronunciation status', async ({ page }) => {
  await installRoleplayAudioMocks(page);

  await page.goto('/en/login');
  await page.locator('form[data-hydrated="true"]').waitFor();
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await page.goto('/en/roleplay/session-audio');
  await expect(page.getByRole('heading', { name: 'Roleplay Session' })).toBeVisible();
  await expect(page.getByPlaceholder('Optional expected spoken text')).toBeVisible();

  await page.getByPlaceholder('Optional expected spoken text').fill('Wo yao yi bei kafei');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'audio.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('RIFF'),
  });
  await page.getByRole('button', { name: 'Send audio' }).click();

  await expect(page.getByText('Pronunciation assessment is processing...')).toBeVisible();
});
