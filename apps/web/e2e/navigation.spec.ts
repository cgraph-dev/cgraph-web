import { test, expect } from '@playwright/test';

/**
 * Core Navigation E2E Tests
 * Verifies main app navigation flows work correctly
 */
test.describe('Navigation', () => {
  test('should load app entry page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/CGraph/i);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('link', { name: /chats/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back|sign in|log in/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();
  });
});

test.describe('Authenticated Navigation', () => {
  test('should access dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/messages/);

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should navigate to conversations', async ({ page }) => {
    await page.goto('/conversations');

    await expect(page).toHaveURL(/\/messages/);
    await expect(page.getByText(/messages|your messages|no messages/i).first()).toBeVisible();
  });

  test('should navigate to groups', async ({ page }) => {
    await page.goto('/groups');

    await expect(page).toHaveURL(/\/groups/);
    await expect(
      page.getByText(/welcome to groups|select a server|loading servers/i).first()
    ).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should navigate to profile', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/user\/e2e-user/);
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Responsive Navigation', () => {
  test('mobile menu should work on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Look for mobile menu button
    const menuButton = page
      .getByRole('button', { name: /menu/i })
      .or(page.getByTestId('mobile-menu-button'));

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation items should appear
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});
