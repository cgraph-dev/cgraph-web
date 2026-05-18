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
    const passwordField = page.getByLabel(/^password$/i);

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();

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

test.describe('User Flow — Required Onboarding Gate', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('renders the required onboarding wizard and exits after skip', async ({ page }) => {
    await page.route('**/api/v1/onboarding/skip', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { completed: true, steps: {} } }),
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('cgraph-e2e-onboarding-completed', 'false');
    });

    await page.goto('/onboarding');

    await expect(page.getByRole('heading', { name: 'Welcome to CGraph' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: /getting started tutorial/i })).toHaveCount(
      0
    );

    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page).toHaveURL(/\/messages$/);
  });

  test('completes required onboarding and opens messages', async ({ page }) => {
    const completedRequests: string[] = [];

    await page.route('**/api/v1/invites**', async (route) => {
      const request = route.request();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          request.method() === 'GET'
            ? { data: [] }
            : { data: { id: 'invite-1', code: 'WELCOME', uses: 0, max_uses: 10 } }
        ),
      });
    });

    await page.route('**/api/v1/me', async (route) => {
      if (route.request().method() !== 'PUT') {
        await route.fallback();
        return;
      }

      completedRequests.push('profile');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { display_name: 'Prod Ready' } }),
      });
    });

    await page.route('**/api/v1/settings/notifications', async (route) => {
      completedRequests.push('notifications');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { messages: true, mentions: true, friend_requests: true } }),
      });
    });

    await page.route('**/api/v1/me/onboarding/complete', async (route) => {
      completedRequests.push('complete');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { onboarding_completed: true } }),
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('cgraph-e2e-onboarding-completed', 'false');
    });

    await page.goto('/onboarding');

    await expect(page.getByRole('heading', { name: 'Welcome to CGraph' })).toBeVisible();
    await page.getByPlaceholder('How should we call you?').fill('Prod Ready');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Discover Communities' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Invite Friends' })).toBeVisible();
    await expect(page.getByText('/invite/WELCOME')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: "You're All Set!" })).toBeVisible();
    await page.getByRole('button', { name: 'Get Started' }).click();

    await expect(page).toHaveURL(/\/messages$/);
    expect(completedRequests).toEqual(['profile', 'notifications', 'complete']);
  });
});
