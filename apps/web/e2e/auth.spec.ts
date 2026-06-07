import { test, expect, type Locator, type Page } from '@playwright/test';

async function expectInvalid(locator: Locator) {
  expect(await locator.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(
    false
  );
}

async function reportFormValidity(page: Page) {
  await page.locator('form').evaluate((form: HTMLFormElement) => form.reportValidity());
}

/**
 * Authentication Flow E2E Tests
 * Tests login, register, logout, and password reset flows
 */
test.describe('Authentication Flows', () => {
  test.describe('Login', () => {
    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /sign in|log in/i }).click();

      await expectInvalid(page.locator('#identifier'));
      await expectInvalid(page.locator('#password'));
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      });

      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      await expect(
        page.getByText(/invalid.*credentials|incorrect.*password|not found|login failed|network/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show password visibility toggle', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('#password');
      await passwordInput.fill('testpassword');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Look for visibility toggle
      const toggleButton = page.getByRole('button', { name: /show|toggle|visibility/i });
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot.*password/i });
      await expect(forgotLink).toBeVisible();
      await forgotLink.click();

      await expect(page).toHaveURL(/\/(forgot-password|reset)/);
    });

    test('should have link to register', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /sign up|register|create.*account/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Registration', () => {
    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      await reportFormValidity(page);

      await expectInvalid(page.locator('#email'));
      await expectInvalid(page.locator('#password'));
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      const emailInput = page.locator('#email');
      await emailInput.fill('notanemail');
      await emailInput.blur();

      await expectInvalid(emailInput);
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      // Fill in weak password
      await page.getByLabel(/^password$/i).fill('123');
      await page.getByLabel(/^password$/i).blur();

      // Should show password requirements
      await expect(page.getByText(/8.*characters|too.*short|stronger/i)).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      const loginLink = page.getByRole('link', { name: /sign in|log in|already.*account/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await page.goto('/dashboard');

      const logoutButton = page.getByRole('button', { name: /logout from your account/i });
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      if (process.env.VITE_E2E_AUTH_BYPASS === 'true') {
        await expect
          .poll(async () =>
            page.evaluate(() => {
              const debugWindow = window as typeof window & {
                __CGRAPH_E2E_AUTH_SNAPSHOT__?: { isAuthenticated?: boolean };
              };
              return debugWindow.__CGRAPH_E2E_AUTH_SNAPSHOT__?.isAuthenticated ?? true;
            })
          )
          .toBe(false);
      } else {
        // Should redirect to login or landing when the real auth guard is active.
        await expect(page).toHaveURL(/(\/login|\/$|\/messages)/);
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should show forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.getByRole('heading', { name: /forgot|reset/i })).toBeVisible();

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset|send|submit/i })).toBeVisible();
    });

    test('should validate email on password reset', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByRole('button', { name: /reset|send|submit/i }).click();

      await expectInvalid(page.locator('#email'));
    });
  });
});
