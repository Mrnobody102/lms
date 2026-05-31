import { expect, Page, test } from '@playwright/test';

const navigationTimeout = 30_000;

const studentUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

const course = {
  id: 'course-1',
  title: 'IELTS Foundations',
  totalDuration: 30,
  lessons: [
    {
      id: 'lesson-1',
      title: 'Lesson 1',
      type: 'text',
      duration: 10,
      order: 1,
      courseId: 'course-1',
      content: 'Intro lesson content',
    },
  ],
};

const practiceSet = {
  id: 'practice-set-1',
  courseId: course.id,
  unitId: null,
  title: 'AI speaking practice',
  description: 'Practice a short greeting with AI review.',
  isPublished: true,
  course: { id: course.id, title: course.title },
  unit: null,
};

const aiPracticeQuestion = {
  id: 'question-ai-1',
  type: 'AI_EVALUATED_AUDIO' as const,
  prompt: 'Write a greeting',
  options: null,
  explanation: 'Keep the greeting short and natural.',
  skillTags: ['speaking'],
};

async function installStudentApiMocks(page: Page) {
  let isLoggedIn = false;
  let hasPracticeAttempt = false;
  let latestPracticeAnswer = 'Ni Hao';
  let progress = [] as Array<{
    id: string;
    lessonId: string;
    status: 'COMPLETED';
    updatedAt: string;
  }>;
  let activities = [] as Array<{
    id: string;
    lessonId: string;
    courseId: string;
    type: 'LESSON_OPENED' | 'LESSON_COMPLETED';
    occurredAt: string;
  }>;
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3100',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };

  const buildAiFeedback = () => ({
    status: 'AUTO_REVIEWED',
    mode: aiPracticeQuestion.type,
    matched: true,
    transcript: latestPracticeAnswer,
    summary: 'Greeting recognized by the AI tutor.',
  });

  const buildPracticeAttemptSummary = () => ({
    id: 'attempt-1',
    score: 1,
    totalPoints: 1,
    submittedAt: '2026-04-21T12:15:00.000Z',
    stats: {
      answeredCount: 1,
      aiAnsweredCount: 1,
      aiReviewedCount: 1,
      aiPendingCount: 0,
    },
    exerciseSet: {
      id: practiceSet.id,
      title: practiceSet.title,
      course: practiceSet.course,
      unit: practiceSet.unit,
    },
  });

  const buildPracticeAttemptResult = () => ({
    attempt: {
      id: 'attempt-1',
      score: 1,
      totalPoints: 1,
      submittedAt: '2026-04-21T12:15:00.000Z',
    },
    result: {
      score: 1,
      totalPoints: 1,
      percentage: 100,
      answers: [
        {
          questionId: aiPracticeQuestion.id,
          prompt: aiPracticeQuestion.prompt,
          answer: latestPracticeAnswer,
          isCorrect: true,
          correctAnswer: 'Ni hao',
          explanation: aiPracticeQuestion.explanation,
          aiFeedback: buildAiFeedback(),
        },
      ],
    },
  });

  const buildPracticeAttemptDetail = () => ({
    ...buildPracticeAttemptSummary(),
    exerciseSet: {
      ...buildPracticeAttemptSummary().exerciseSet,
      description: practiceSet.description,
    },
    answers: [
      {
        id: 'answer-1',
        answer: latestPracticeAnswer,
        isCorrect: true,
        aiFeedback: buildAiFeedback(),
        createdAt: '2026-04-21T12:15:00.000Z',
        question: {
          ...aiPracticeQuestion,
          correctAnswer: 'Ni hao',
        },
      },
    ],
  });

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
      return route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
    }

    if (path.endsWith('/api/users/me') && method === 'GET') {
      if (isLoggedIn) {
        return json(200, studentUser);
      }
      return json(401, { message: 'Unauthorized' });
    }

    if (path.endsWith('/api/auth/register') && method === 'POST') {
      isLoggedIn = true;
      return json(201, { user: studentUser });
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      isLoggedIn = true;
      return json(200, { user: studentUser });
    }

    if (path.endsWith('/api/auth/refresh') && method === 'POST') {
      if (!isLoggedIn) {
        return json(401, {
          statusCode: 401,
          message: 'Invalid or missing authentication token',
        });
      }

      return json(200, { user: studentUser });
    }

    if (path.endsWith('/api/auth/logout') && method === 'POST') {
      isLoggedIn = false;
      progress = [];
      activities = [];

      return json(200, {
        success: true,
        message: 'Logged out successfully',
      });
    }

    if (path.endsWith('/api/courses') && method === 'GET') {
      return json(200, [course]);
    }

    if (path.endsWith('/api/courses/course-1') && method === 'GET') {
      return json(200, course);
    }

    if (path.endsWith('/api/notifications') && method === 'GET') {
      return json(200, {
        notifications: [],
        unreadCount: 0,
      });
    }

    if (path.endsWith('/api/lessons/lesson-1') && method === 'GET') {
      return json(200, course.lessons[0]);
    }

    if (path.endsWith('/api/progress/course/course-1') && method === 'GET') {
      return json(200, progress);
    }

    if (path.endsWith('/api/progress/summary') && method === 'GET') {
      const completedLessons = progress.filter((item) => item.status === 'COMPLETED').length;
      const latestActivity = activities[0] ?? null;

      return json(200, {
        activeCourse: {
          course: {
            id: course.id,
            title: course.title,
            totalDuration: course.totalDuration,
          },
          totalLessons: course.lessons.length,
          completedLessons,
          activitySessions: activities.filter((item) => item.type === 'LESSON_OPENED').length,
          completionPercentage: Math.round((completedLessons / course.lessons.length) * 100),
          lastActivityAt: latestActivity?.occurredAt ?? null,
          lastAccessedLesson: latestActivity
            ? {
                id: course.lessons[0].id,
                title: course.lessons[0].title,
                courseId: course.id,
                duration: course.lessons[0].duration,
              }
            : null,
          continueLesson: {
            id: course.lessons[0].id,
            title: course.lessons[0].title,
            courseId: course.id,
            duration: course.lessons[0].duration,
          },
        },
        courses: [
          {
            course: {
              id: course.id,
              title: course.title,
              totalDuration: course.totalDuration,
            },
            totalLessons: course.lessons.length,
            completedLessons,
            activitySessions: activities.filter((item) => item.type === 'LESSON_OPENED').length,
            completionPercentage: Math.round((completedLessons / course.lessons.length) * 100),
            lastActivityAt: latestActivity?.occurredAt ?? null,
            lastAccessedLesson: latestActivity
              ? {
                  id: course.lessons[0].id,
                  title: course.lessons[0].title,
                  courseId: course.id,
                  duration: course.lessons[0].duration,
                }
              : null,
            continueLesson: {
              id: course.lessons[0].id,
              title: course.lessons[0].title,
              courseId: course.id,
              duration: course.lessons[0].duration,
            },
          },
        ],
        totals: {
          courses: 1,
          lessons: course.lessons.length,
          completedLessons,
          activitySessions: activities.filter((item) => item.type === 'LESSON_OPENED').length,
          currentStreak: 0,
          completionPercentage: Math.round((completedLessons / course.lessons.length) * 100),
        },
      });
    }

    if (path.endsWith('/api/student/today') && method === 'GET') {
      const completedLessons = progress.filter((item) => item.status === 'COMPLETED').length;
      const latestActivity = activities[0] ?? null;
      const completionPercentage = Math.round((completedLessons / course.lessons.length) * 100);
      const primaryTask = {
        id: 'task-continue-course',
        type: 'CONTINUE_COURSE',
        title: course.lessons[0].title,
        subtitle: course.title,
        href: `/lessons/${course.lessons[0].id}`,
        priority: 1,
        dueAt: null,
        meta: {
          courseId: course.id,
          lessonId: course.lessons[0].id,
        },
      };

      return json(200, {
        primaryTask,
        tasks: [primaryTask],
        courses: [
          {
            course: {
              id: course.id,
              title: course.title,
              totalDuration: course.totalDuration,
            },
            totalLessons: course.lessons.length,
            completedLessons,
            completionPercentage,
            lastActivityAt: latestActivity?.occurredAt ?? null,
            continueLesson: {
              id: course.lessons[0].id,
              title: course.lessons[0].title,
              courseId: course.id,
              duration: course.lessons[0].duration,
            },
          },
        ],
        srsDue: {
          dueNow: 0,
          dueToday: 0,
          total: 0,
        },
        recentFeedback: {
          practice: [],
          exams: [],
        },
      });
    }

    if (path.endsWith('/api/progress/performance') && method === 'GET') {
      return json(200, {
        accuracyByUnit: [],
        accuracyBySkill: [],
      });
    }

    if (path.endsWith('/api/srs/summary') && method === 'GET') {
      return json(200, {
        dueNow: 0,
        dueToday: 0,
        total: 0,
      });
    }

    if (path.endsWith('/api/srs/queue') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/srs/cards/custom') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/skills') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/skills/mastery') && method === 'GET') {
      return json(200, []);
    }

    if (path.endsWith('/api/skills/mastery-trend') && method === 'GET') {
      return json(200, {
        days: 30,
        skills: [],
        trend: [],
      });
    }

    if (path.endsWith('/api/certificates/course/course-1') && method === 'GET') {
      return json(200, {
        eligible: false,
        certificate: null,
        progress: {
          course: { id: course.id, title: course.title },
          totalLessons: course.lessons.length,
          completedLessons: progress.length,
          completionPercentage: Math.round((progress.length / course.lessons.length) * 100),
          isComplete: progress.length === course.lessons.length,
        },
      });
    }

    if (path.endsWith('/api/discussions') && method === 'GET') {
      return json(200, {
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    }

    if (path.endsWith('/api/progress/activity') && method === 'POST') {
      const payload = request.postDataJSON() as {
        lessonId: string;
        type: 'LESSON_OPENED' | 'LESSON_COMPLETED';
      };
      const activity = {
        id: `activity-${activities.length + 1}`,
        lessonId: payload.lessonId,
        courseId: course.id,
        type: payload.type,
        occurredAt: '2026-04-21T11:55:00.000Z',
      };
      activities = [activity, ...activities];
      return json(201, activity);
    }

    if (path.endsWith('/api/progress/update') && method === 'POST') {
      progress = [
        {
          id: 'progress-1',
          lessonId: 'lesson-1',
          status: 'COMPLETED',
          updatedAt: '2026-04-21T12:00:00.000Z',
        },
      ];
      activities = [
        {
          id: 'activity-complete-1',
          lessonId: 'lesson-1',
          courseId: course.id,
          type: 'LESSON_COMPLETED',
          occurredAt: '2026-04-21T12:00:00.000Z',
        },
        ...activities,
      ];

      return json(200, progress[0]);
    }

    if (path.endsWith('/api/practice/exercise-sets') && method === 'GET') {
      return json(200, [
        {
          ...practiceSet,
          _count: { questions: 1, attempts: hasPracticeAttempt ? 1 : 0 },
        },
      ]);
    }

    if (path.endsWith('/api/practice/recommendations') && method === 'GET') {
      return json(200, [
        {
          ...practiceSet,
          skillTags: aiPracticeQuestion.skillTags,
          latestAttempt: null,
          recommendationReason: 'NEW_PRACTICE',
          _count: { questions: 1, attempts: hasPracticeAttempt ? 1 : 0 },
        },
      ]);
    }

    if (path.endsWith('/api/practice/exercise-sets/practice-set-1') && method === 'GET') {
      return json(200, {
        ...practiceSet,
        questions: [
          {
            id: 'practice-question-link-1',
            order: 1,
            question: aiPracticeQuestion,
          },
        ],
      });
    }

    if (path.endsWith('/api/practice/exercise-sets/practice-set-1/attempts') && method === 'POST') {
      const payload = request.postDataJSON() as {
        answers?: Array<{ questionId: string; answer: unknown }>;
      };
      const submittedAnswer = payload.answers?.find(
        (answer) => answer.questionId === aiPracticeQuestion.id,
      )?.answer;

      latestPracticeAnswer = typeof submittedAnswer === 'string' ? submittedAnswer : 'Ni Hao';
      hasPracticeAttempt = true;

      return json(201, buildPracticeAttemptResult());
    }

    if (path.endsWith('/api/practice/attempts') && method === 'GET') {
      return json(200, hasPracticeAttempt ? [buildPracticeAttemptSummary()] : []);
    }

    if (path.endsWith('/api/practice/attempts/attempt-1') && method === 'GET') {
      if (!hasPracticeAttempt) {
        return json(404, {
          statusCode: 404,
          message: 'Practice attempt not found',
        });
      }

      return json(200, buildPracticeAttemptDetail());
    }

    return route.continue();
  });
}

async function openLessonPage(page: Page) {
  await page.getByRole('link', { name: 'Start Now' }).click();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await expect(page).toHaveURL(/\/en\/lessons\/lesson-1$/, { timeout: navigationTimeout });

    const notFoundHeading = page.getByRole('heading', { name: '404' });
    if (!(await notFoundHeading.isVisible().catch(() => false))) {
      return;
    }

    await page.goto('/en/lessons/lesson-1');
  }
}

async function waitForHydratedForm(page: Page) {
  await page.locator('form[data-hydrated="true"]').waitFor();
}

test('student can register and return to login', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/register');
  await waitForHydratedForm(page);
  await page.getByPlaceholder('e.g. Nguyen Van A').fill('Student User');
  await page.getByPlaceholder('email@example.com').fill('student@example.com');
  await page.getByPlaceholder('e.g. Student@123').fill('Student@123');
  await page.getByRole('button', { name: 'Create Learning Account' }).click();

  await expect(page).toHaveURL(/\/en\/login\?registered=1$/, { timeout: navigationTimeout });
  await expect(
    page.getByText('Account created successfully. Please log in to continue.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login Now' })).toBeVisible();
});

test('guest sees a concise student portal entry instead of the sales landing', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en');

  await expect(page.getByRole('heading', { name: 'Sign in to continue learning' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/en/login');
  await expect(page.getByRole('link', { name: 'Activate code' })).toHaveAttribute(
    'href',
    '/en/activation',
  );
  await expect(page.getByRole('link', { name: 'View courses' })).toHaveAttribute(
    'href',
    'http://localhost:3103/en/courses',
  );
});

test('student can login, open a lesson, and mark it completed', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/login');
  await waitForHydratedForm(page);
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await expect(page).toHaveURL(/\/en\/courses$/, { timeout: navigationTimeout });
  await openLessonPage(page);
  await expect(page.getByRole('button', { name: 'Mark as Complete' })).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole('button', { name: 'Mark as Complete' }).click();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled();
});

test('student can view the learning dashboard summary', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/login');
  await waitForHydratedForm(page);
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await expect(page).toHaveURL(/\/en\/courses$/, { timeout: navigationTimeout });
  await page.goto('/en');

  await expect(page.getByRole('heading', { name: 'What to do next' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Continue: Lesson 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'IELTS Foundations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resume lesson' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'What to do next' })).toBeVisible({
    timeout: navigationTimeout,
  });
});

test('student can submit AI practice and review AI feedback', async ({ page }) => {
  await installStudentApiMocks(page);

  await page.goto('/en/login');
  await waitForHydratedForm(page);
  await page.locator('input[type="email"]').fill('student@example.com');
  await page.locator('input[type="password"]').fill('Student@123');
  await page.getByRole('button', { name: 'Login Now' }).click();

  await expect(page).toHaveURL(/\/en\/courses$/, { timeout: navigationTimeout });
  await page.goto('/en/practice?tab=sets');
  await expect(page.getByRole('heading', { name: 'AI speaking practice' })).toBeVisible();

  await page.getByRole('link', { name: 'Start practice' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/practice-set-1$/, { timeout: navigationTimeout });
  await page.getByPlaceholder('Speak or type your transcript').fill('Ni Hao');
  await page.getByRole('button', { name: 'Submit answers' }).click();

  await expect(page.getByText('AI coaching feedback')).toBeVisible();
  await expect(page.getByText('Transcript: Ni Hao')).toBeVisible();
  await expect(page.getByText('Reviewed by AI tutor')).toBeVisible();

  await page.getByRole('link', { name: 'Review attempt' }).click();
  await expect(page).toHaveURL(/\/en\/practice\/attempts\/attempt-1$/, {
    timeout: navigationTimeout,
  });
  await expect(page.getByText('AI coaching feedback')).toBeVisible();
  await expect(page.getByText('Transcript: Ni Hao')).toBeVisible();
});
