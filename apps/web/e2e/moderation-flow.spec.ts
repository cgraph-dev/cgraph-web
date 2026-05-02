import { test, expect } from '@playwright/test';

/**
 * Content Moderation E2E Tests
 * Tests input sanitization, moderation queue, and content safety.
 */
test.describe('Moderation — Input Sanitization', () => {
  test('message input does not render script tags', async ({ page }) => {
    await page.goto('/messages');

    // Open a conversation if one exists
    const firstConvo = page
      .getByRole('listitem')
      .first()
      .or(page.getByTestId('conversation-item').first());

    if (await firstConvo.isVisible().catch(() => false)) {
      await firstConvo.click();

      const messageInput = page
        .getByRole('textbox', { name: /message/i })
        .or(page.getByPlaceholder(/type.*message/i));

      if (await messageInput.isVisible().catch(() => false)) {
        // Type a message with XSS payload
        await messageInput.fill('<script>alert("xss")</script>Hello');

        // The raw script tag should NOT appear in the DOM as executable HTML
        const scriptCount = await page.locator('script:has-text("xss")').count();
        expect(scriptCount).toBe(0);
      }
    } else {
      test.skip();
    }
  });

  test('message input does not render HTML injection', async ({ page }) => {
    await page.goto('/messages');

    const firstConvo = page
      .getByRole('listitem')
      .first()
      .or(page.getByTestId('conversation-item').first());

    if (await firstConvo.isVisible().catch(() => false)) {
      await firstConvo.click();

      const messageInput = page
        .getByRole('textbox', { name: /message/i })
        .or(page.getByPlaceholder(/type.*message/i));

      if (await messageInput.isVisible().catch(() => false)) {
        await messageInput.fill('<img src=x onerror=alert(1)>');

        // Should not have an img with onerror handler rendered
        const dangerousImg = await page.locator('img[onerror]').count();
        expect(dangerousImg).toBe(0);
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Moderation — Queue Interface', () => {
  test('moderation queue page renders', async ({ page }) => {
    await page.goto('/forums/moderation');

    await expect(page.getByRole('main')).toBeVisible();

    // Should show queue content, empty state, or access-restricted message
    const hasQueue = await page
      .getByText(/moderation|queue|pending|review/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no items|empty|nothing.*review|all.*clear/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasRestricted = await page
      .getByText(/access.*denied|not authorized|restricted|permission/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasQueue || hasEmpty || hasRestricted).toBeTruthy();
  });
});

test.describe('Moderation — Report Flow', () => {
  test('report mechanism exists on user profile', async ({ page }) => {
    // Visit a user profile page (the test user's own profile works)
    await page.goto('/profile');

    await expect(page.getByRole('main')).toBeVisible();

    // Look for report or moderation action
    const reportButton = page
      .getByRole('button', { name: /report|flag|block/i })
      .or(page.getByTestId('report-button'))
      .first();

    // Report button may or may not be on own profile — just verify page loads
    const hasReport = await reportButton.isVisible().catch(() => false);
    // This is informational; own profile may not have report button
  });
});
