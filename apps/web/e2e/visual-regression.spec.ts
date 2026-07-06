import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const themeSurfacesCss = readFileSync(
  join(process.cwd(), 'src/styles/theme-surfaces.css'),
  'utf8'
);

test.describe('theme surface visual regression', () => {
  test('social toggle tracks render without decorative reflection overlays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 420, height: 220 });
    await page.setContent(`
      <!doctype html>
      <html class="theme-aurora">
        <head>
          <style>
            :root {
              --token-bg-primary: #070a14;
              --token-card-bg: rgba(15, 18, 30, 0.9);
              --token-card-border: rgba(139, 92, 246, 0.2);
              --token-border-muted: rgba(148, 163, 184, 0.18);
              --token-interactive-primary: #8b5cf6;
              --token-interactive-hover: #7c3aed;
              --token-text-primary: #f8fafc;
              --token-text-secondary: #cbd5e1;
              --token-text-muted: #94a3b8;
            }

            ${themeSurfacesCss}

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #070a14;
              color: var(--token-text-primary);
              font-family: Arial, sans-serif;
            }

            .toggle-fixture {
              display: flex;
              min-height: 220px;
              width: 420px;
              align-items: center;
              justify-content: center;
              gap: 24px;
              background: #070a14;
            }

            .toggle-card {
              display: grid;
              gap: 12px;
              justify-items: center;
              color: var(--token-text-secondary);
              font-size: 12px;
            }

            .aurora-social-toggle {
              position: relative;
              width: 44px;
              height: 24px;
              border-radius: 9999px;
            }

            .aurora-social-toggle-thumb {
              position: absolute;
              left: 4px;
              top: 4px;
              width: 16px;
              height: 16px;
              border-radius: 9999px;
            }
          </style>
        </head>
        <body>
          <main class="toggle-fixture" data-testid="toggle-fixture">
            <section class="toggle-card" aria-label="Off state">
              <button class="aurora-social-toggle" type="button" role="switch" aria-checked="false" data-checked="false">
                <span class="aurora-social-toggle-thumb"></span>
              </button>
              <span>Off</span>
            </section>
            <section class="toggle-card" aria-label="On state">
              <button class="aurora-social-toggle" type="button" role="switch" aria-checked="true" data-checked="true">
                <span class="aurora-social-toggle-thumb"></span>
              </button>
              <span>On</span>
            </section>
          </main>
        </body>
      </html>
    `);

    const pseudoContent = await page.locator('.aurora-social-toggle').evaluateAll((toggles) =>
      toggles.map((toggle) => ({
        after: window.getComputedStyle(toggle, '::after').content,
        before: window.getComputedStyle(toggle, '::before').content,
      }))
    );

    expect(pseudoContent).toEqual([
      { after: 'none', before: 'none' },
      { after: 'none', before: 'none' },
    ]);
    await expect(page.getByTestId('toggle-fixture')).toHaveScreenshot(
      'theme-surface-toggle-overlays.png',
      {
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      }
    );
  });
});
