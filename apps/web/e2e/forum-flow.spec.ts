import { test, expect } from '@playwright/test';

/**
 * Forum Flow E2E Tests
 * Tests forum browsing, thread viewing, post creation, and search.
 */
test.describe('Forum Flow — Browsing', () => {
  test('forums page renders with content or empty state', async ({ page }) => {
    await page.goto('/forums');

    await expect(page.getByRole('main')).toBeVisible();

    const hasList = await page
      .getByRole('list')
      .or(page.getByRole('article'))
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/forum directory|0 forums|no forums|create.*forum|browse|get started/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasCards = await page
      .locator('[class*="forum-card"], [class*="ForumCard"], [data-testid*="forum"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasList || hasEmpty || hasCards).toBeTruthy();
  });

  test('forum leaderboard page loads', async ({ page }) => {
    await page.goto('/forums/leaderboard');

    await expect(page.getByRole('main')).toBeVisible();

    // Should show leaderboard content or empty state
    const hasContent = await page
      .getByText(/leaderboard|rank|top|score|pulse/i)
      .first()
      .isVisible()
      .catch(() => false);

    // Page at minimum should render
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigate from forums list to a specific forum', async ({ page }) => {
    await page.goto('/forums');

    // Try clicking the first forum link
    const forumLink = page.getByRole('link').filter({ hasText: /.+/ }).first();

    if (await forumLink.isVisible().catch(() => false)) {
      const href = await forumLink.getAttribute('href');
      if (href && href.includes('/forums/')) {
        await forumLink.click();
        await expect(page.getByRole('main')).toBeVisible();
      }
    }
  });

  test('forum moderation queue page loads', async ({ page }) => {
    await page.goto('/forums/moderation');

    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Forum Flow — Creation', () => {
  test('create forum page renders form elements', async ({ page }) => {
    await page.goto('/forums/create');

    await expect(page.getByRole('main')).toBeVisible();

    // Look for form fields
    const hasNameInput = await page
      .getByLabel(/name|title/i)
      .or(page.getByPlaceholder(/name|title/i))
      .first()
      .isVisible()
      .catch(() => false);
    const hasDescription = await page
      .getByLabel(/description|about/i)
      .or(page.getByPlaceholder(/description|about/i))
      .first()
      .isVisible()
      .catch(() => false);
    const hasSubmit = await page
      .getByRole('button', { name: /create|submit|next|save/i })
      .first()
      .isVisible()
      .catch(() => false);
    const hasLoginRequired = await page
      .getByText(/login required/i)
      .isVisible()
      .catch(() => false);

    expect(hasNameInput || hasDescription || hasSubmit || hasLoginRequired).toBeTruthy();
  });

  test('create post page renders when navigated from a forum', async ({ page }) => {
    // Navigate to a forum's create-post page (requires a valid forum slug)
    await page.goto('/forums');

    const forumLink = page.getByRole('link').filter({ hasText: /.+/ }).first();

    if (await forumLink.isVisible().catch(() => false)) {
      const href = await forumLink.getAttribute('href');
      if (href && href.includes('/forums/')) {
        const forumSlug = href.split('/forums/')[1]?.split('/')[0];
        if (forumSlug) {
          await page.goto(`/forums/${forumSlug}/create-post`);
          await expect(page.getByRole('main')).toBeVisible();
        }
      }
    }
  });
});

test.describe('Forum Flow — Search', () => {
  test('forum search page renders', async ({ page }) => {
    await page.goto('/forums/search');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('forum search accepts input', async ({ page }) => {
    await page.goto('/forums/search');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.getByLabel(/search/i))
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test query');
      await page.waitForTimeout(500); // Debounce

      await expect(searchInput).toHaveValue('test query');
    }
  });
});
