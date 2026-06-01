import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.WEB_STUDENT_BASE_URL ?? 'http://127.0.0.1:3100';
const useExternalServer = Boolean(process.env.WEB_STUDENT_BASE_URL);

export default defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 90 * 1000,
  expect: {
    timeout: 30 * 1000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command:
          'NEXT_PUBLIC_NOTIFICATION_STREAM_URL=off pnpm exec next dev --webpack -H 127.0.0.1 -p 3100',
        url: 'http://127.0.0.1:3100/en',
        reuseExistingServer: !process.env.CI,
        timeout: 240 * 1000,
      },
});
