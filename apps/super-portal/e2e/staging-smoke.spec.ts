import { expect, test } from '@playwright/test';

const email = process.env.STAGING_SUPER_EMAIL;
const password = process.env.STAGING_SUPER_PASSWORD;

test.describe('super portal staging smoke', () => {
  test.skip(!process.env.SUPER_PORTAL_BASE_URL, 'SUPER_PORTAL_BASE_URL is required');
  test.skip(!email || !password, 'STAGING_SUPER_EMAIL and STAGING_SUPER_PASSWORD are required');

  test('super admin can authenticate and inspect platform operations', async ({ page }) => {
    await page.goto('/en');
    await page.locator('input[type="email"]').fill(email ?? '');
    await page.locator('input[type="password"]').fill(password ?? '');
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i, {
      timeout: 30_000,
    });
    await expect(page.getByText(/tenant|campus|portal/i).first()).toBeVisible({ timeout: 30_000 });

    await page.goto('/en/usage-storage');
    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i);

    await page.goto('/en/plans-billing');
    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i);

    await page.goto('/en/feature-flags');
    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i);

    await page.goto('/en/audit-logs');
    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i);
  });

  test('anonymous user sees the locked state instead of platform data', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/en/usage-storage');

    await expect(page.getByText(/sign in|locked|đăng nhập/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('body')).not.toContainText(/undefined|null/i);
  });
});
