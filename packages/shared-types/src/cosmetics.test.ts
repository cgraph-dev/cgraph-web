import { describe, expect, it } from 'vitest';
import {
  PROFILE_THEME_CATEGORIES,
  PROFILE_THEME_IDS,
  PROFILE_THEME_SURFACE_PATTERNS,
  isProfileThemeCategory,
  isProfileThemeId,
  isProfileThemeSurfacePattern,
  type ProfileThemeConfig,
} from './cosmetics';

describe('cosmetics shared contracts', () => {
  it('keeps profile theme preview semantics runtime-neutral', () => {
    const theme = {
      id: 'signal-noir',
      name: 'Signal Noir',
      category: 'signal',
      tier: 'free',
      description: 'Private signal styling with crisp noir contrast',
      backgroundGradient: ['#03050d', '#111827'],
      surfacePattern: 'scanline',
      glowEnabled: true,
      accentPrimary: '#38bdf8',
      accentSecondary: '#a78bfa',
      textColor: '#ffffff',
      unlocked: true,
    } satisfies ProfileThemeConfig;

    expect(theme.id).toBe('signal-noir');
    expect(theme.category).toBe('signal');
    expect(theme.surfacePattern).toBe('scanline');
  });

  it('validates shared profile theme category and static surface ids', () => {
    expect(PROFILE_THEME_IDS).toHaveLength(7);
    expect(PROFILE_THEME_CATEGORIES).toHaveLength(7);
    expect(PROFILE_THEME_IDS).toContain('sakura-dream');
    expect(PROFILE_THEME_CATEGORIES).toContain('sakura');
    expect(PROFILE_THEME_SURFACE_PATTERNS).toContain('starfield');

    expect(isProfileThemeId('deep-space')).toBe(true);
    expect(isProfileThemeId('old-card-theme')).toBe(false);
    expect(isProfileThemeCategory('solarpunk')).toBe(true);
    expect(isProfileThemeCategory('browser-only-card')).toBe(false);
    expect(isProfileThemeSurfacePattern('terminal-grid')).toBe(true);
    expect(isProfileThemeSurfacePattern('floating-particles')).toBe(false);
  });
});
