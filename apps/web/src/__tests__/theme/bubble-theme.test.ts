import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const bubbleThemeCss = readFileSync(
  join(process.cwd(), 'src/styles/bubble-theme.css'),
  'utf8'
);
const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
const themeSurfacesCss = readFileSync(
  join(process.cwd(), 'src/styles/theme-surfaces.css'),
  'utf8'
);

describe('Bubble app theme ownership', () => {
  it('uses the semantic material contract as its single visual owner', () => {
    expect(indexCss).toContain("@import './styles/bubble-theme.css';");
    expect(bubbleThemeCss).toContain("[data-cgraph-material='glass']");
    expect(bubbleThemeCss).toContain("[data-cgraph-material='solid']");
    expect(bubbleThemeCss).toContain("[data-cgraph-material='recessed']");
    expect(bubbleThemeCss).toContain("[data-cgraph-material='floating']");
    expect(bubbleThemeCss).toContain("[data-cgraph-material='control']");
  });

  it('does not depend on generated utility class fragments', () => {
    expect(bubbleThemeCss).not.toContain('[class*=');
    expect(bubbleThemeCss).not.toContain('transition: all');
    expect(bubbleThemeCss).not.toMatch(/:hover\s*\{[^}]*transform:/s);
  });

  it('provides reduced motion, reduced transparency, and forced-color fallbacks', () => {
    expect(bubbleThemeCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(bubbleThemeCss).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(bubbleThemeCss).toContain('@media (forced-colors: active)');
    expect(bubbleThemeCss).toContain('backdrop-filter: none');
  });

  it('removes the old competing Bubble implementations', () => {
    expect(indexCss).not.toContain('Bubble Theme — iOS 26 Liquid Glass');
    expect(indexCss).not.toContain('@keyframes aurora-flow');
    expect(themeSurfacesCss).not.toContain('.theme-bubble');
  });
});
