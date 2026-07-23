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
    await expect(page.getByRole('heading', { name: /^Settings$/ })).toBeVisible();
  });

  test('should navigate to profile', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/user\/e2e-user/);
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Responsive Navigation', () => {
  test('uses one full-width messages pane on phones and tablets', async ({ page }, testInfo) => {
    for (const viewport of [
      { width: 400, height: 874 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/messages');

      await expect(page.getByTestId('mobile-navigation')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
      await expect(page.getByTestId('conversation-sidebar')).toBeVisible();
      await expect(page.getByTestId('conversation-pane')).toBeHidden();

      const sidebar = await page.getByTestId('conversation-sidebar').boundingBox();
      expect(sidebar?.width).toBe(viewport.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      await testInfo.attach(`messages-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      if (viewport.width === 400) {
        await page.getByRole('button', { name: 'More navigation options' }).click();
        await expect(page.getByRole('dialog', { name: 'More navigation' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
        await page.waitForTimeout(350);
        await testInfo.attach('navigation-more-400x874', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'More navigation' })).toBeHidden();
      }

      await page.goto('/messages/responsive-conversation');

      await expect(page.getByTestId('mobile-navigation')).toHaveCount(0);
      await expect(page.getByTestId('conversation-sidebar')).toBeHidden();
      await expect(page.getByTestId('conversation-pane')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Back to conversations' })).toBeVisible();

      const conversationPane = await page.getByTestId('conversation-pane').boundingBox();
      expect(conversationPane?.width).toBe(viewport.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      await testInfo.attach(`conversation-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      await page.getByRole('button', { name: 'Back to conversations' }).click();
      await expect(page).toHaveURL(/\/messages$/);
      await expect(page.getByTestId('mobile-navigation')).toBeVisible();
    }
  });

  test('retains the established desktop rail and messages columns', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/messages');

    await expect(page.getByTestId('mobile-navigation')).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByTestId('conversation-sidebar')).toBeVisible();
    await expect(page.getByTestId('conversation-pane')).toBeVisible();

    expect((await page.getByRole('navigation', { name: 'Main navigation' }).boundingBox())?.width).toBe(
      72,
    );
    expect((await page.getByTestId('conversation-sidebar').boundingBox())?.width).toBe(320);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await testInfo.attach('messages-1440x900', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
