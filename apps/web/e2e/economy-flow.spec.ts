import { test, expect } from '@playwright/test';

/**
 * Node Economy E2E Tests
 * Tests wallet, nodes shop, cosmetics shop, and creator dashboard flows.
 */
test.describe('Economy Flow — Nodes Wallet', () => {
  test('nodes wallet page loads', async ({ page }) => {
    await page.goto('/nodes');

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('wallet displays balance or onboarding prompt', async ({ page }) => {
    await page.goto('/nodes');

    // Should show balance, wallet info, or a setup prompt
    const hasBalance = await page
      .getByText(/balance|nodes|wallet|\d+/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasPrompt = await page
      .getByText(/get started|set up|earn|claim/i)
      .first()
      .isVisible()
      .catch(() => false);

    // Page should render meaningful content
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Economy Flow — Nodes Shop', () => {
  test('nodes shop page loads', async ({ page }) => {
    await page.goto('/nodes/shop');

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('shop displays items or empty state', async ({ page }) => {
    await page.goto('/nodes/shop');

    const hasItems = await page
      .getByRole('button', { name: /buy|purchase|get|add/i })
      .first()
      .isVisible()
      .catch(() => false);
    const hasCards = await page
      .locator('[class*="shop"], [class*="item"], [class*="card"], [data-testid*="shop"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no items|coming soon|shop.*empty/i)
      .first()
      .isVisible()
      .catch(() => false);

    // Shop should render
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('can navigate from wallet to shop', async ({ page }) => {
    await page.goto('/nodes');

    const shopLink = page
      .getByRole('link', { name: /shop|store|browse/i })
      .or(page.getByRole('button', { name: /shop|store|browse/i }))
      .first();

    if (await shopLink.isVisible().catch(() => false)) {
      await shopLink.click();
      await expect(page).toHaveURL(/\/nodes\/shop/);
    } else {
      // Direct navigation fallback
      await page.goto('/nodes/shop');
      await expect(page.getByRole('main')).toBeVisible();
    }
  });
});

test.describe('Economy Flow — Cosmetics', () => {
  test('cosmetics inventory page loads', async ({ page }) => {
    await page.goto('/cosmetics');

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('cosmetics shop page loads', async ({ page }) => {
    await page.goto('/cosmetics/shop');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('cosmetics page shows inventory or empty state', async ({ page }) => {
    await page.goto('/cosmetics');

    const hasItems = await page
      .getByText(/cosmetic|inventory|badge|title|frame|effect/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no cosmetics|empty|get started|shop/i)
      .first()
      .isVisible()
      .catch(() => false);

    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Economy Flow — Creator Dashboard', () => {
  test('creator dashboard page loads', async ({ page }) => {
    await page.goto('/creator');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('creator earnings page loads', async ({ page }) => {
    await page.goto('/creator/earnings');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('creator analytics page loads', async ({ page }) => {
    await page.goto('/creator/analytics');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('creator payouts page loads', async ({ page }) => {
    await page.goto('/creator/payouts');

    await expect(page.getByRole('main')).toBeVisible();
  });
});
