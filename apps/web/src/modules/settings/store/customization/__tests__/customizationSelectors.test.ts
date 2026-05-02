/**
 * Customization Store Selectors Unit Tests
 *
 * Tests for getThemeColors and other selector helpers.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock the store to avoid pulling in full store implementation
vi.mock('../customizationStore', () => ({
  useCustomizationStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
      const mockState = {
        themePreset: 'purple',
        effectPreset: 'aurora',
        animationSpeed: 'normal',
        particlesEnabled: true,
        glowEnabled: true,
        blurEnabled: true,
        animatedBackground: false,
        avatarBorderType: 'glow',
        avatarBorderColor: 'emerald',
        avatarSize: 'medium',
        profileCardStyle: 'default',
        showBadges: true,
        showBio: true,
        showStatus: true,
        equippedTitle: null,
        equippedBadges: [],
        isLoading: false,
        isSaving: false,
        isDirty: false,
        error: null,
      };
      return selector(mockState);
    }),
    {
      getState: () => ({
        themePreset: 'purple',
        avatarBorderColor: 'emerald',
      }),
    }
  ),
}));

import { getThemeColors } from '../customizationStore.selectors';
import { THEME_COLORS } from '../customizationStore.types';
describe('getThemeColors', () => {
  it('returns emerald theme colors', () => {
    const colors = getThemeColors('emerald');

    expect(colors).toBe(THEME_COLORS.emerald);
    expect(colors.primary).toBe('#10b981');
  });

  it('returns purple theme colors', () => {
    const colors = getThemeColors('purple');

    expect(colors).toBe(THEME_COLORS.purple);
  });

  it('returns correct colors for each known preset', () => {
    const knownPresets = new Set(Object.keys(THEME_COLORS));
    const presets = Object.keys(THEME_COLORS).filter((k): k is keyof typeof THEME_COLORS =>
      knownPresets.has(k)
    );

    for (const preset of presets) {
      const colors = getThemeColors(preset);
      expect(colors).toBe(THEME_COLORS[preset]);
      expect(colors.primary).toBeTruthy();
    }
  });
});
