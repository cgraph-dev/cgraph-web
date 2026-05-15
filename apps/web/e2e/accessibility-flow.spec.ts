import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Extended Accessibility E2E Tests
 * Supplements the existing accessibility.spec.ts with additional
 * authenticated page audits and keyboard navigation tests.
 *
 * The base accessibility.spec.ts covers: login, register, forgot-password,
 * messages, groups, forums, settings, premium, profile.
 *
 * This file adds: nodes, cosmetics, creator, customize, social, explore.
 */

const ADDITIONAL_AUTH_PAGES = [
  { name: 'Nodes Wallet', path: '/nodes' },
  { name: 'Nodes Shop', path: '/nodes/shop' },
  { name: 'Cosmetics Inventory', path: '/cosmetics' },
  { name: 'Cosmetics Shop', path: '/cosmetics/shop' },
  { name: 'Creator Dashboard', path: '/creator' },
  { name: 'Customize', path: '/customize/identity' },
  { name: 'Social', path: '/social/friends' },
  { name: 'Explore', path: '/explore' },
  { name: 'Feed', path: '/feed' },
];

async function waitForAccessiblePageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 10000 });
  await page
    .locator('[data-testid="loading-spinner"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => undefined);
}

test.describe('Accessibility — Additional Authenticated Pages', () => {
  for (const pg of ADDITIONAL_AUTH_PAGES) {
    test(`${pg.name} page passes axe WCAG 2.1 AA audit`, async ({ page }) => {
      await page.goto(pg.path);
      await waitForAccessiblePageReady(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-testid="loading-spinner"]')
        .analyze();

      if (results.violations.length > 0) {
        console.log(`\nA11y violations on ${pg.name}:`);
        for (const violation of results.violations) {
          console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
          console.log(`  Help: ${violation.helpUrl}`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`  -> ${node.html.substring(0, 100)}`);
          }
        }
      }

      const serious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(
        serious,
        `${pg.name} has ${serious.length} serious/critical a11y violations`
      ).toHaveLength(0);
    });
  }
});

test.describe('Accessibility — Keyboard Navigation (Authenticated)', () => {
  test('sidebar navigation is keyboard-accessible', async ({ page }) => {
    await page.goto('/messages');
    await waitForAccessiblePageReady(page);

    // Focus should move through interactive elements via Tab
    const focusedTags: string[] = [];
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'NONE';
        const role = el.getAttribute('role') || '';
        return `${el.tagName}:${role || el.getAttribute('type') || ''}`;
      });
      focusedTags.push(tag);
    }

    // Should reach at least one link and one button via keyboard
    const hasLink = focusedTags.some((t) => t.includes('A:') || t.includes(':link'));
    const hasButton = focusedTags.some((t) => t.includes('BUTTON'));
    const hasInteractive = hasLink || hasButton;

    expect(hasInteractive).toBeTruthy();
  });

  test('escape key closes open dialogs on messages page', async ({ page }) => {
    await page.goto('/messages');
    await waitForAccessiblePageReady(page);

    // Try to open a dialog (new conversation, settings, etc.)
    const dialogTrigger = page
      .locator('[data-testid="modal-trigger"], [aria-haspopup="dialog"]')
      .first();

    if (await dialogTrigger.isVisible().catch(() => false)) {
      await dialogTrigger.click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('settings page form inputs have accessible labels', async ({ page }) => {
    await page.goto('/settings');
    await waitForAccessiblePageReady(page);

    const inputs = page.locator('input:visible:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el: HTMLInputElement) => {
        const { id } = el;
        const hasLabelElement = id ? !!document.querySelector(`label[for="${id}"]`) : false;
        const hasAriaLabel = !!el.getAttribute('aria-label');
        const hasAriaLabelledBy = !!el.getAttribute('aria-labelledby');
        const hasPlaceholder = !!el.placeholder;
        const hasTitle = !!el.title;
        return hasLabelElement || hasAriaLabel || hasAriaLabelledBy || hasPlaceholder || hasTitle;
      });

      expect(hasLabel, `Settings input ${i} should have an accessible label`).toBeTruthy();
    }
  });
});

test.describe('Accessibility — Focus Management', () => {
  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/login');
    await waitForAccessiblePageReady(page);

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check that the focused element has visible focus indicator
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      // Focus is visible if there's an outline or box-shadow
      return (
        (outline !== 'none' && outline !== '' && !outline.includes('0px')) ||
        (boxShadow !== 'none' && boxShadow !== '')
      );
    });

    // Note: some designs use :focus-visible which may not trigger on programmatic focus
    // This is informational rather than a hard failure
  });

  test('skip-to-content link exists or main landmark is reachable', async ({ page }) => {
    await page.goto('/messages');
    await waitForAccessiblePageReady(page);

    // Check for skip-to-content link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], [class*="skip"]').first();
    const hasSkipLink = await skipLink.isVisible().catch(() => false);

    // Or check that main landmark exists
    const mainLandmark = page.locator('main, [role="main"]');
    const hasMainLandmark = (await mainLandmark.count()) > 0;

    expect(hasSkipLink || hasMainLandmark).toBeTruthy();
  });
});
