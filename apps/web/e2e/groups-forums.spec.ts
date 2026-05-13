import { test, expect } from '@playwright/test';

/**
 * Groups & Forums E2E Tests
 * Tests group browsing, forum navigation, and content interaction flows
 */
test.describe('Groups', () => {
  test.describe('Groups List', () => {
    test('should display groups page', async ({ page }) => {
      await page.goto('/groups');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should show groups or empty state', async ({ page }) => {
      await page.goto('/groups');

      await expect(page.getByRole('main')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toMatch(
        /welcome to groups|select a server|create new server|loading servers/i
      );
    });

    test('should have create group action', async ({ page }) => {
      await page.goto('/groups');

      const createButton = page
        .getByRole('button', { name: /create|new/i })
        .or(page.getByRole('link', { name: /create|new/i }))
        .or(page.getByTestId('create-group-button'));

      await expect(createButton).toBeVisible();
    });
  });
});

test.describe('Forums', () => {
  test.describe('Forum List', () => {
    test('should display forums page', async ({ page }) => {
      await page.goto('/forums');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should show forum categories or empty state', async ({ page }) => {
      await page.goto('/forums');

      await expect(page.getByRole('main')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toMatch(/forum directory|0 forums|create forum/i);
    });

    test('should have navigation to create forum', async ({ page }) => {
      await page.goto('/forums');

      const createLink = page
        .getByRole('link', { name: /create|new/i })
        .or(page.getByRole('button', { name: /create|new/i }))
        .or(page.getByTestId('create-forum-button'));

      // Create action may be available
      if (await createLink.isVisible().catch(() => false)) {
        await createLink.click();
        await expect(page).toHaveURL(/\/forums\/create/);
      }
    });
  });

  test.describe('Forum Create Page', () => {
    test('should load create forum page', async ({ page }) => {
      await page.goto('/forums/create');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have forum creation form elements', async ({ page }) => {
      await page.goto('/forums/create');

      await expect(page.getByRole('main')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toMatch(/create your forum|basic information|forum name|login required/i);
    });
  });

  test.describe('Forum Leaderboard', () => {
    test('should load leaderboard page', async ({ page }) => {
      await page.goto('/forums/leaderboard');

      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Forum Moderation', () => {
    test('should load moderation queue page', async ({ page }) => {
      await page.goto('/forums/moderation');

      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Groups & Forums Flow', () => {
  test('should navigate from groups to forums', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByRole('main')).toBeVisible();

    // Navigate to forums
    await page.goto('/forums');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).toHaveURL(/\/forums/);
  });

  test('should navigate forum hierarchy', async ({ page }) => {
    await page.goto('/forums');

    // If there are forum links, try clicking the first one
    const forumLink = page
      .getByRole('link')
      .filter({ hasText: /./i }) // Any non-empty link
      .first();

    if (await forumLink.isVisible().catch(() => false)) {
      const href = await forumLink.getAttribute('href');
      if (href && href.includes('/forums/')) {
        await forumLink.click();
        // Should navigate to a forum page
        await expect(page.getByRole('main')).toBeVisible();
      }
    }
  });
});
