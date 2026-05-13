import { test, expect, type Locator } from '@playwright/test';

async function expectInvalid(locator: Locator) {
  expect(await locator.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(
    false
  );
}

/**
 * Full User Journey E2E Tests
 * Tests registration → onboarding → messaging flow end-to-end.
 */
test.describe('User Flow — Registration & Onboarding', () => {
  // These tests use unauthenticated state since they test registration
  test.use({ storageState: { cookies: [], origins: [] } });

  test('register page renders with all required fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();

    // Required form fields
    const emailField = page.getByLabel(/email/i);
    const usernameField = page.getByLabel(/username/i).or(page.getByPlaceholder(/username/i));
    const passwordField = page.getByLabel(/^password$/i);

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();

    // Username field may be on register or onboarding
    const hasUsername = await usernameField.isVisible().catch(() => false);

    // Submit button should exist
    await expect(page.getByRole('button', { name: /sign up|register|create/i })).toBeVisible();
  });

  test('register form validates required fields before submit', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: /sign up|register|create/i }).click();

    await expectInvalid(page.locator('#email'));
    await expectInvalid(page.locator('#password'));
  });

  test('login page allows navigation to register', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.getByRole('link', { name: /sign up|register|create.*account/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('User Flow — Authenticated Journey', () => {
  test('login redirects to messages or dashboard', async ({ page }) => {
    await page.goto('/messages');

    // Should not be on login page (auth state from setup)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigate to messages → open conversation → verify composer', async ({ page }) => {
    await page.goto('/messages');

    await expect(page.getByRole('main')).toBeVisible();

    // Try to open first conversation
    const firstConvo = page
      .getByRole('listitem')
      .first()
      .or(page.getByTestId('conversation-item').first());

    if (await firstConvo.isVisible().catch(() => false)) {
      await firstConvo.click();

      // Message composer should appear
      const messageInput = page
        .getByRole('textbox', { name: /message/i })
        .or(page.getByPlaceholder(/type.*message/i));

      await expect(messageInput).toBeVisible({ timeout: 10000 });
    } else {
      // Empty state is acceptable
      const hasEmpty = await page
        .getByText(
          /no conversations|start.*conversation|start a new conversation|your messages|no messages/i
        )
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasEmpty).toBeTruthy();
    }
  });

  test('navigate through main sections: messages → groups → forums → settings', async ({
    page,
  }) => {
    // Messages
    await page.goto('/messages');
    await expect(page.getByRole('main')).toBeVisible();

    // Groups
    await page.goto('/groups');
    await expect(page.getByRole('main')).toBeVisible();

    // Forums
    await page.goto('/forums');
    await expect(page.getByRole('main')).toBeVisible();

    // Settings
    await page.goto('/settings');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('profile page loads for authenticated user', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('main')).toBeVisible();
    // Should not show login prompt
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding');

    // Should render either onboarding content or redirect to messages if already onboarded
    const isOnboarding = page.url().includes('/onboarding');
    const isMessages = page.url().includes('/messages');
    const isDashboard = page.url().includes('/dashboard');

    expect(isOnboarding || isMessages || isDashboard).toBeTruthy();
    await expect(page.getByRole('main').first()).toBeVisible();
  });
});
