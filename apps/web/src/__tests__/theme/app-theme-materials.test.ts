import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const materialsCss = readFileSync(
  join(process.cwd(), 'src/styles/app-theme-materials.css'),
  'utf8'
);
const bubbleCss = readFileSync(join(process.cwd(), 'src/styles/bubble-theme.css'), 'utf8');
const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

describe('built-in app-theme material ownership', () => {
  it('loads the shared material contract before the expressive Bubble owner', () => {
    const sharedImport = "@import './styles/app-theme-materials.css';";
    const bubbleImport = "@import './styles/bubble-theme.css';";

    expect(indexCss).toContain(sharedImport);
    expect(indexCss).toContain(bubbleImport);
    expect(indexCss.indexOf(sharedImport)).toBeLessThan(indexCss.indexOf(bubbleImport));
  });

  it.each(['theme-aurora', 'theme-dark', 'theme-light'])(
    'defines the %s material scope',
    (themeClass) => {
      expect(materialsCss).toContain(`.${themeClass}`);
    }
  );

  it('uses semantic surface and state attributes without hover movement', () => {
    expect(materialsCss).toContain("[data-cgraph-surface='card']");
    expect(materialsCss).toContain("[data-cgraph-surface='control']");
    expect(materialsCss).toContain("[data-cgraph-state='disabled']");
    expect(materialsCss).not.toMatch(/:hover\s*\{[^}]*transform\s*:/s);
    expect(materialsCss).not.toContain('transition: all');
  });

  it('preserves control intent in the Bubble material owner', () => {
    for (const variant of ['primary', 'danger', 'success', 'secondary', 'outline', 'ghost', 'glass']) {
      expect(bubbleCss).toContain(`[data-cgraph-variant='${variant}']`);
    }
  });

  it.each([materialsCss, bubbleCss])(
    'provides motion, transparency, and forced-color fallbacks',
    (css) => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toContain('@media (prefers-reduced-transparency: reduce)');
      expect(css).toContain('@media (forced-colors: active)');
      expect(css).toContain('backdrop-filter: none');
    }
  );
});
