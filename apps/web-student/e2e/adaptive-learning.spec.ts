import { expect, test, type Page } from '@playwright/test';

async function mockLearning(page: Page, failFirstStart = false) {
  let learner = 'A';
  let authenticated = true;
  let completed = false;
  let startUnavailable = failFirstStart;
  const user = () => ({
    id: learner,
    tenantId: 'tenant-test',
    role: 'STUDENT',
    fullName: `Learner ${learner}`,
    email: `${learner}@test.local`,
  });
  const questions = ['q1', 'q2'].map((id) => ({
    id,
    type: 'FILL_BLANK',
    prompt: `Question ${id}`,
    options: null,
    skillTags: ['GRAMMAR'],
  }));
  const set = {
    id: 'adaptive-set',
    title: 'GRAMMAR',
    courseId: 'course-test',
    course: { id: 'course-test', title: 'Test course' },
    isPublished: true,
    questions: questions.map((question, order) => ({ id: question.id, order, question })),
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const headers = {
      'access-control-allow-origin': request.headers().origin ?? 'http://127.0.0.1:3110',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
      'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
    };
    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          success: status < 400,
          data,
          ...(status >= 400 ? { message: 'Practice temporarily unavailable' } : {}),
        }),
      });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/users/me') return authenticated ? json(user()) : json(null, 401);
    if (path === '/auth/logout') {
      authenticated = false;
      return json({});
    }
    if (path === '/auth/login') {
      learner = 'B';
      authenticated = true;
      return json({ user: user() });
    }
    if (path === '/auth/refresh') return json(null, 401);
    if (path === '/student/today')
      return json({
        learnerId: learner,
        tenantId: 'tenant-test',
        primaryTask: {
          id: 'browse',
          type: 'BROWSE_COURSES',
          title: 'Browse courses',
          subtitle: '',
          href: '/courses',
          priority: 0,
          dueAt: null,
          meta: {},
        },
        tasks: [],
        courses: [],
        srsDue: { dueNow: 0, dueToday: 0, total: 0 },
        recentFeedback: { practice: [], exams: [] },
      });
    if (path === '/adaptive-learning/next-steps')
      return json({
        learnerId: learner,
        courseId: null,
        generatedAt: new Date().toISOString(),
        signals: {
          dueNow: 0,
          dueToday: 0,
          pendingPathItems: completed ? 0 : 1,
          trackedSkillCount: 0,
          weakSkillCount: 0,
          weakMasteryThreshold: 60,
        },
        steps: completed
          ? []
          : [
              {
                id: `path-${learner}`,
                pathItemId: `path-${learner}`,
                kind: 'ADAPTIVE_PATH',
                rank: 1,
                score: 80,
                reasonCode: 'weak_skill_practice_misses',
                nextAction: 'practice_similar_questions',
                summary: '',
                href: `/practice/adaptive/path-${learner}`,
                skillCode: `GRAMMAR_${learner}`,
                courseId: 'course-test',
                status: 'PENDING',
                scoreBreakdown: { base: 50 },
                signals: {
                  dueNow: null,
                  dueToday: null,
                  dueForSkill: 0,
                  topDueSkills: [],
                  mastery: null,
                  attempts: null,
                  attempted: 3,
                  incorrect: 2,
                  priority: 22,
                  questionCount: 2,
                },
              },
            ],
      });
    if (/\/adaptive-learning\/path\/.+\/start$/.test(path)) {
      if (startUnavailable) return json(null, 503);
      return json({ exerciseSetId: set.id });
    }
    if (path === `/practice/exercise-sets/${set.id}`) return json(set);
    if (path === `/practice/exercise-sets/${set.id}/attempts`) {
      completed = true;
      return json({
        attempt: {
          id: 'attempt-test',
          score: 2,
          totalPoints: 2,
          submittedAt: new Date().toISOString(),
        },
        result: {
          score: 2,
          totalPoints: 2,
          percentage: 100,
          answers: questions.map((question) => ({
            questionId: question.id,
            prompt: question.prompt,
            answer: 'ok',
            correctAnswer: 'ok',
            isCorrect: true,
          })),
        },
      });
    }
    if (path === '/notifications') return json({ notifications: [], unreadCount: 0 });
    if (path === '/notifications/unread-count') return json({ count: 0 });
    if (path.includes('/discussions')) return json({ data: [], meta: { total: 0 } });
    return json([]);
  });
  return {
    recoverStart: () => {
      startUnavailable = false;
    },
  };
}

test('adaptive practice uses its selected questions and disappears after submission on mobile', async ({
  page,
}, testInfo) => {
  await mockLearning(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  const panel = page.getByTestId('adaptive-next-steps');
  await expect(panel.getByText('Practice GRAMMAR_A again')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('adaptive-mobile.png'), fullPage: true });
  await panel.getByRole('link', { name: 'Practice', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/practice\/adaptive-set$/);
  const inputs = page.getByPlaceholder('Type your answer');
  await expect(inputs).toHaveCount(2);
  await inputs.nth(0).fill('ok');
  await inputs.nth(1).fill('ok');
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByRole('link', { name: 'Review attempt' })).toBeVisible();
  await page.goto('/en');
  await expect(
    page.getByTestId('adaptive-next-steps').getByText('No adaptive steps yet'),
  ).toBeVisible();
});

test('standalone practice and exam attempt reviews render without a course', async ({ page }) => {
  await mockLearning(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const submittedAt = '2026-10-26T00:00:00.000Z';
  await page.route('**/api/practice/attempts/standalone', (route) =>
    route.fulfill({
      json: {
        id: 'standalone',
        score: 0,
        totalPoints: 0,
        submittedAt,
        answers: [],
        exerciseSet: { id: 'set', title: 'Standalone practice', course: null },
      },
    }),
  );
  await page.route('**/api/exams/attempts/standalone', (route) =>
    route.fulfill({
      json: {
        id: 'standalone',
        examId: 'exam',
        score: 0,
        totalPoints: 0,
        status: 'SUBMITTED',
        startedAt: submittedAt,
        deadlineAt: submittedAt,
        submittedAt,
        isExpired: false,
        answers: [],
        exam: { id: 'exam', title: 'Standalone exam', durationMinutes: 10, course: null },
      },
    }),
  );
  await page.goto('/en/practice/attempts/standalone');
  await expect(page.getByRole('heading', { name: 'Standalone practice' })).toBeVisible();
  await page.goto('/en/exams/attempts/standalone');
  await expect(page.getByRole('heading', { name: 'Standalone exam' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('adaptive start exposes an actionable retry state', async ({ page }) => {
  const controls = await mockLearning(page, true);
  await page.goto('/en/practice/adaptive/path-A');
  await expect(page.locator('section[role="alert"]')).toContainText(
    'Could not start this practice',
  );
  controls.recoverStart();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/adaptive-set$/);
});

test('rule-based feedback does not claim AI review or a completed check without a reference', async ({
  page,
}) => {
  await mockLearning(page);
  await page.route('**/api/practice/attempts/fallback-*', (route) => {
    const pending = route.request().url().endsWith('fallback-pending');
    return route.fulfill({
      json: {
        id: 'attempt',
        score: 0,
        totalPoints: 1,
        submittedAt: '2026-10-26T00:00:00.000Z',
        exerciseSet: { id: 'set', title: 'Rule-based feedback', course: null },
        answers: [
          {
            id: 'answer',
            answer: 'Hello',
            isCorrect: false,
            question: {
              id: 'q1',
              type: 'AI_EVALUATED_TEXT',
              prompt: 'Say hello',
              skillTags: [],
              correctAnswer: pending ? null : 'Hi',
            },
            aiFeedback: {
              status: pending ? 'PENDING_REVIEW' : 'AUTO_REVIEWED',
              mode: 'AI_EVALUATED_TEXT',
              matched: false,
              transcript: 'Hello',
              source: 'fallback',
              fallbackReason: 'governance_denied',
            },
          },
        ],
      },
    });
  });
  await page.goto('/en/practice/attempts/fallback-checked');
  await expect(page.getByText('Rule-based check', { exact: true })).toBeVisible();
  await expect(page.getByText('Reviewed by AI tutor', { exact: true })).toHaveCount(0);
  await page.goto('/en/practice/attempts/fallback-pending');
  await expect(
    page.getByText(
      'Response saved. It needs review because no reference answer is available for an automatic check.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Reviewed by AI tutor', { exact: true })).toHaveCount(0);
});

test('switching accounts in one tab does not reuse adaptive recommendations or drafts', async ({
  page,
}) => {
  await mockLearning(page);
  await page.goto('/en');
  await expect(page.getByText('Practice GRAMMAR_A again')).toBeVisible();
  await page
    .getByTestId('adaptive-next-steps')
    .getByRole('link', { name: 'Practice', exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/practice\/adaptive-set$/);
  await page.getByPlaceholder('Type your answer').first().fill('private draft A');
  await page.getByRole('button', { name: 'Learner A' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/en\/login\?returnUrl=/);
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.locator('input[type="email"]').fill('B@test.local');
  await page.locator('input[type="password"]').fill('Test@123456');
  await page.getByRole('button', { name: 'Login Now' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/adaptive-set$/);
  await page.getByRole('link', { name: 'Today', exact: true }).first().click();
  await expect(page.getByText('Practice GRAMMAR_B again')).toBeVisible();
  await expect(page.getByText('Practice GRAMMAR_A again')).toHaveCount(0);
  await page
    .getByTestId('adaptive-next-steps')
    .getByRole('link', { name: 'Practice', exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/practice\/adaptive-set$/);
  await expect(page.getByPlaceholder('Type your answer').first()).toHaveValue('');
});
