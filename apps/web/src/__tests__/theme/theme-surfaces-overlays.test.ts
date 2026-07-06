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
});
