import { describe, expect, it } from 'vitest';
import {
  PROFILE_THEME_CATEGORIES,
  PROFILE_THEME_IDS,
  PROFILE_THEME_SURFACE_PATTERNS,
  isProfileThemeCategory,
  isProfileThemeId,
  isProfileThemeSurfacePattern,
  type InventoryItem,
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

  it('models public inventory rows without requiring internal user ownership fields', () => {
    const item: InventoryItem = {
      id: 'inventory-1',
      itemType: 'border',
      itemId: '11111111-1111-1111-1111-111111111111',
      itemSlug: null,
      itemKey: '11111111-1111-1111-1111-111111111111',
      equippedAt: null,
      obtainedAt: '2026-05-30T09:30:00Z',
      obtainedVia: 'default',
    };

    expect(item.userId).toBeUndefined();
    expect(item.itemType).toBe('border');
    expect(item.itemKey).toBe(item.itemId);
  });
});
