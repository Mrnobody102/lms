import { expect, Page, test } from '@playwright/test';

const course = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'IELTS Foundations',
  slug: 'ielts-foundations',
  description: 'Build a practical IELTS study path with lessons and review.',
  coverImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
  totalDuration: 90,
  level: {
    id: 'level-1',
    title: 'Foundation',
    program: { id: 'program-1', title: 'IELTS' },
  },
  lessonCount: 2,
  unitCount: 1,
};

async function installSalesApiMocks(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://127.0.0.1:3103',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,x-tenant-id,x-csrf-token',
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = (status: number, data: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ success: status < 400, data, timestamp: new Date().toISOString() }),
      });

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    if (path.endsWith('/api/public/courses') && method === 'GET') {
      return json(200, {
        data: [course],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      });
    }

    if (path.endsWith(`/api/public/courses/${course.id}`) && method === 'GET') {
      return json(200, {
        ...course,
        units: [
          {
            id: 'unit-1',
            title: 'Getting Started',
            description: 'Orientation and core skills.',
            order: 1,
            lessons: [
              {
                id: 'lesson-1',
                title: 'Introducing yourself',
                type: 'video',
                duration: 10,
                order: 1,
              },
              {
                id: 'lesson-2',
                title: 'Small talk patterns',
                type: 'text',
                duration: 15,
                order: 2,
              },
            ],
          },
        ],
        ungroupedLessons: [],
      });
    }

    return json(404, { message: `Unhandled ${method} ${path}` });
  });
}

test('visitor can browse public sales pages and open a course detail', async ({ page }) => {
  await installSalesApiMocks(page);

  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: 'Courses built for measurable learning progress' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'IELTS Foundations' })).toBeVisible();

  await page.getByRole('link', { name: 'All courses' }).click();
  await expect(page).toHaveURL(/\/en\/courses$/);
  await expect(page.getByRole('heading', { name: 'All published courses' })).toBeVisible();
  await expect(page.getByText('1 course')).toBeVisible();

  await page.getByRole('link', { name: 'View details' }).click();
  await expect(page).toHaveURL(new RegExp(`/en/courses/${course.id}$`));
  await expect(page.getByRole('heading', { name: 'Course curriculum' })).toBeVisible();
  await expect(page.getByText('Introducing yourself')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login to study' })).toHaveAttribute(
    'href',
    /^http:\/\/(127\.0\.0\.1|localhost):3100\/en\/login$/,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Course curriculum' })).toBeVisible();
});
