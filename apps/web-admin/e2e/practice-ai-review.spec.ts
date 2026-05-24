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
  title: 'HSK 1 Basics',
  description: 'Intro course',
  levelId: null,
  lessons: [],
  enrollments: [],
  units: [
    {
      id: 'unit-1',
      title: 'Greetings',
      description: null,
      order: 1,
      courseId: 'course-1',
    },
  ],
  _count: { lessons: 0 },
};

async function installPracticeAiReviewMocks(page: Page) {
  let draftStatus = 'PENDING_REVIEW';
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3101',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };

  const draft = () => ({
    id: 'draft-1',
    tenantId: 'tenant-1',
    jobId: 'job-1',
    courseId: 'course-1',
    unitId: 'unit-1',
    type: 'MULTIPLE_CHOICE',
    prompt: 'Choose the correct greeting.',
    options: ['Ni hao', 'Zaijian'],
    correctAnswer: 0,
    explanation: 'Ni hao is a greeting.',
    skillTags: ['speaking'],
    difficulty: null,
    validationIssues: null,
    reviewStatus: draftStatus,
    reviewedAt: draftStatus === 'APPROVED' ? '2026-05-24T00:00:00.000Z' : null,
    rejectionReason: null,
    approvedQuestionId: draftStatus === 'APPROVED' ? 'question-1' : null,
    createdAt: '2026-05-24T00:00:00.000Z',
  });

  const job = () => ({
    id: 'job-1',
    courseId: 'course-1',
    unitId: 'unit-1',
    topic: 'Greetings',
    context: null,
    questionType: 'MULTIPLE_CHOICE',
    requestedCount: 1,
    skillTags: ['speaking'],
    status: 'COMPLETED',
    promptVersion: 'practice-ai-v1',
    sourceReason: null,
    errorMessage: null,
    createdAt: '2026-05-24T00:00:00.000Z',
    completedAt: '2026-05-24T00:00:01.000Z',
    course: { id: 'course-1', title: 'HSK 1 Basics' },
    unit: { id: 'unit-1', title: 'Greetings' },
    drafts: [draft()],
    _count: { drafts: 1 },
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
      return json(200, adminUser);
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

    if (path.endsWith('/api/practice/ai-generations') && method === 'GET') {
      return json(200, {
        data: [job()],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/practice/ai-generations/job-1') && method === 'GET') {
      return json(200, job());
    }

    if (path.endsWith('/api/practice/ai-drafts/bulk-approve') && method === 'POST') {
      draftStatus = 'APPROVED';
      return json(200, { approved: 1, failed: 0 });
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });
}

test('admin can review and bulk approve AI-generated practice drafts', async ({ page }) => {
  await installPracticeAiReviewMocks(page);

  await page.goto('/en/practice/ai-review');

  await expect(page.getByRole('heading', { name: 'AI Review Workspace' })).toBeVisible({
    timeout: 60000,
  });
  await expect(page.getByRole('heading', { name: 'Greetings' })).toBeVisible();
  await expect(page.getByText('Choose the correct greeting.')).toBeVisible();

  await page.getByLabel('Select item').check();
  await page.getByRole('button', { name: 'Approve selected' }).click();

  await expect(page.getByText(/1 draft approved/)).toBeVisible();
});
