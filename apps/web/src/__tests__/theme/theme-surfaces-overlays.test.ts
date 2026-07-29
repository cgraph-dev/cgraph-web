import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const themeSurfacesCss = readFileSync(
  join(process.cwd(), 'src/styles/theme-surfaces.css'),
  'utf8'
);

describe('theme surface overlay guards', () => {
  it('keeps social toggles on token-owned states without decorative track overlays', () => {
    expect(themeSurfacesCss).toContain('.aurora-social-toggle {');
    expect(themeSurfacesCss).toContain('var(--token-interactive-primary)');
    expect(themeSurfacesCss).toContain('.aurora-social-toggle-thumb');

    expect(themeSurfacesCss).not.toContain('.aurora-social-toggle::before');
    expect(themeSurfacesCss).not.toContain('.aurora-social-toggle::after');
    expect(themeSurfacesCss).not.toContain(".aurora-social-toggle[data-checked='true']::before");
    expect(themeSurfacesCss).not.toContain(".aurora-social-toggle[data-checked='true']::after");
    expect(themeSurfacesCss).not.toContain('.peer:checked + .aurora-social-toggle::before');
    expect(themeSurfacesCss).not.toContain('.peer:checked + .aurora-social-toggle::after');
    expect(themeSurfacesCss).not.toContain('translate(-120%, -50%) rotate(18deg)');
    expect(themeSurfacesCss).not.toContain('translate(170%, -50%) rotate(18deg)');
    expect(themeSurfacesCss).not.toContain(
      'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent)'
    );
  });

  it('keeps shared buttons and toggles on flat state materials', () => {
    const flatButtonSelectors = [
      /\.theme-aurora \.btn-themed\s*\{[^}]*\}/s,
      /\.theme-aurora \.aurora-social-button\s*\{[^}]*\}/s,
      /\.theme-light \.btn-themed\s*\{[^}]*\}/s,
      /\.theme-light \.aurora-social-button\s*\{[^}]*\}/s,
    ];

    for (const selector of flatButtonSelectors) {
      expect(themeSurfacesCss).toMatch(selector);
      expect(themeSurfacesCss.match(selector)?.[0]).not.toContain('linear-gradient');
    }

    expect(themeSurfacesCss).not.toContain('transform: scale(0.98)');
    expect(themeSurfacesCss).not.toContain('scale(1.04)');
    expect(themeSurfacesCss).not.toContain('aurora-social-toggle-thumb::before');
    expect(themeSurfacesCss).not.toContain('aurora-social-toggle-thumb::after');
  });
});
