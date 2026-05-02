import { Page } from '@playwright/test';

/**
 * Shared authentication helpers for E2E tests.
 * Uses the same credentials as auth.setup.ts.
 */

const DEFAULT_EMAIL = process.env.TEST_USER_EMAIL || 'test@cgraph.dev';
const DEFAULT_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

/**
 * Log in via the login page UI.
 * Waits for redirect to an authenticated route before returning.
 */
export async function login(
  page: Page,
  email = DEFAULT_EMAIL,
  password = DEFAULT_PASSWORD
): Promise<void> {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect away from login
  await page.waitForURL(/\/(messages|home|dashboard|onboarding)?$/, {
    timeout: 15000,
  });
}

/**
 * Navigate to a route that requires authentication.
 * If the page redirects to /login, perform login first.
 */
export async function ensureAuthenticated(page: Page, targetPath: string): Promise<void> {
  await page.goto(targetPath);

  // If redirected to login, authenticate first then retry
  if (page.url().includes('/login')) {
    await login(page);
    await page.goto(targetPath);
  }
}
