import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_AURORA } from '../../lib/theme/themes';
import { injectCSSVariables } from '../../lib/theme/css-variables';

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../lib/theme/preferences', () => ({
  loadPreferences: () => ({
    activeThemeId: 'aurora',
    customThemes: [],
    settings: {
      syncAcrossDevices: false,
      respectSystemPreference: false,
      messageDisplay: 'cozy',
      fontScale: 1,
      messageSpacing: 1,
      reduceMotion: false,
      highContrast: false,
      backgroundEffect: 'none',
      shaderVariant: 'matrix',
      backgroundIntensity: 0.6,
    },
  }),
  savePreferences: vi.fn(),
  initBroadcastChannel: () => null,
}));

function ensureThemeColorMeta(): HTMLMetaElement {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  return meta;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  ensureThemeColorMeta().content = '';
});

describe('theme performance budgets', () => {
  it('switches theme synchronously with bounded DOM writes', async () => {
    const root = document.documentElement;
    const setPropertySpy = vi.spyOn(root.style, 'setProperty').mockImplementation(() => undefined);
    const { themeEngine } = await import('../../lib/theme/theme-engine');

    themeEngine.setTheme('dark');

    expect(setPropertySpy).toHaveBeenCalled();
    expect(setPropertySpy.mock.calls.length).toBeLessThanOrEqual(160);
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('injects CSS variables with bounded DOM writes', () => {
    const root = document.documentElement;
    const setPropertySpy = vi.spyOn(root.style, 'setProperty').mockImplementation(() => undefined);

    injectCSSVariables(THEME_AURORA, {
      syncAcrossDevices: false,
      respectSystemPreference: false,
      messageDisplay: 'cozy',
      fontScale: 1,
      messageSpacing: 1,
      reduceMotion: false,
      highContrast: false,
      backgroundEffect: 'none',
      shaderVariant: 'matrix',
      backgroundIntensity: 0.6,
    });

    expect(setPropertySpy).toHaveBeenCalledWith(
      '--font-family',
      THEME_AURORA.typography.fontFamily
    );
    expect(setPropertySpy.mock.calls.length).toBeGreaterThan(20);
    expect(setPropertySpy.mock.calls.length).toBeLessThanOrEqual(80);
    expect(ensureThemeColorMeta().content).toBe(THEME_AURORA.colors.background);
  });
});
