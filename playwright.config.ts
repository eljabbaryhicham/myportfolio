import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const usesExistingServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: usesExistingServer
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
