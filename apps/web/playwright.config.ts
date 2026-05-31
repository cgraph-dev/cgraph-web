import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true';
const retries = Number(process.env.PLAYWRIGHT_RETRIES ?? (process.env.CI ? 2 : 0));
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

if (chromiumExecutable && !existsSync(chromiumExecutable)) {
  throw new Error(`PLAYWRIGHT_CHROMIUM_EXECUTABLE does not exist: ${chromiumExecutable}`);
}

const chromiumRuntimeUse = chromiumExecutable
  ? { launchOptions: { executablePath: chromiumExecutable } }
  : {};

/**
 * Playwright E2E Test Configuration for CGraph Web
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video recording */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    { name: 'setup', testMatch: /.*\.setup\.ts/, use: chromiumRuntimeUse },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumRuntimeUse,
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        ...chromiumRuntimeUse,
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Visual regression via Percy (Chromium only) */
    {
      name: 'visual-regression',
      testMatch: /visual-regression\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumRuntimeUse,
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Network condition testing (Chromium CDP required) */
    {
      name: 'network-testing',
      testMatch: /network-conditions\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumRuntimeUse,
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'pnpm exec vite --host 127.0.0.1 --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer,
    timeout: 120 * 1000,
  },

  /* Global timeout for each test */
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});
