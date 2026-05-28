import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3103',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      'NEXT_PUBLIC_TENANT_ID=tenant-1 NEXT_PUBLIC_WEB_STUDENT_URL=http://127.0.0.1:3100 pnpm exec next dev --webpack -H 127.0.0.1 -p 3103',
    url: 'http://127.0.0.1:3103/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
