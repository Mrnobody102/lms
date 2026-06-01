import { expect, test } from '@playwright/test';

const email = process.env.STAGING_STUDENT_EMAIL;
const password = process.env.STAGING_STUDENT_PASSWORD;

test.describe('student staging smoke', () => {
  test.skip(!process.env.WEB_STUDENT_BASE_URL, 'WEB_STUDENT_BASE_URL is required');
  test.skip(!email || !password, 'STAGING_STUDENT_EMAIL and STAGING_STUDENT_PASSWORD are required');

  test('student can authenticate and reach protected learning pages', async ({ page }) => {
    await page.goto('/en/login');
    await page.locator('input[type="email"]').fill(email ?? '');
    await page.locator('input[type="password"]').fill(password ?? '');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await expect(page).toHaveURL(/\/en\/(courses|$)/, { timeout: 30_000 });
    await expect(page.locator('body')).not.toContainText(/sign in to continue learning/i);

    await page.goto('/en/courses');
    await expect(page.locator('body')).not.toContainText(/sign in to continue learning/i);
    await expect(
      page.getByRole('link', { name: /course|learn|continue|start|học/i }).first(),
    ).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/en/practice');
    await expect(page.locator('body')).not.toContainText(/sign in to continue learning/i);

    await page.goto('/en/exams');
    await expect(page.locator('body')).not.toContainText(/sign in to continue learning/i);

    await page.goto('/en/review');
    await expect(page.locator('body')).not.toContainText(/sign in to continue learning/i);
  });

  test('expired or missing session locks protected pages cleanly', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/en/courses');

    await expect(
      page.getByText(/sign in to continue learning|login required|đăng nhập/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('body')).not.toContainText(/request timed out|undefined|null/i);
  });
});
