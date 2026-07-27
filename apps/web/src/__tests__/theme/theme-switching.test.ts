import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_REGISTRY as SHARED_TOKEN_REGISTRY } from '@cgraph-dev/design-tokens';

import { THEME_LIGHT } from '../../lib/theme/themes';
import { TOKEN_REGISTRY, injectSemanticTokens } from '../../lib/theme/tokens';

const storageState: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => storageState[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageState[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageState[key];
  }),
  clear: vi.fn(() => {
    Object.keys(storageState).forEach((key) => delete storageState[key]);
  }),
};

class MockBroadcastChannel {
  static channels: MockBroadcastChannel[] = [];

  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.channels.push(this);
  }

  postMessage(message: unknown): void {
    for (const channel of MockBroadcastChannel.channels) {
      if (channel !== this && channel.name === this.name && channel.onmessage) {
        channel.onmessage({ data: message } as MessageEvent);
      }
    }
  }

  close(): void {
    MockBroadcastChannel.channels = MockBroadcastChannel.channels.filter((channel) => channel !== this);
  }
}

const originalBroadcastChannel = globalThis.BroadcastChannel;
const originalLocalStorage = globalThis.localStorage;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  vi.resetModules();
  localStorageMock.clear();
  vi.clearAllMocks();
  MockBroadcastChannel.channels = [];
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');

  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    value: MockBroadcastChannel,
    configurable: true,
  });
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true });
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    value: originalBroadcastChannel,
    configurable: true,
  });
  Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true });
});

describe('professional theme switching', () => {
  it('uses the shared cross-platform semantic-token registry', () => {
    expect(TOKEN_REGISTRY).toBe(SHARED_TOKEN_REGISTRY);
  });

  it.each([
    ['aurora', 'dark', 'theme-aurora'],
    ['dark', 'dark', 'theme-dark'],
    ['light', 'light', 'theme-light'],
    ['bubble', 'dark', 'theme-bubble'],
  ] as const)('applies the %s app-theme contract', async (themeId, category, variantClass) => {
    const { themeEngine } = await import('../../lib/theme/theme-engine');

    themeEngine.setTheme(themeId);
    injectSemanticTokens(themeId);

    expect(themeEngine.getCurrentTheme().id).toBe(themeId);
    expect(document.documentElement.classList.contains(category)).toBe(true);
    expect(document.documentElement.classList.contains(variantClass)).toBe(true);
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe(
      category === 'light' ? 'light' : 'dark'
    );

    for (const [token, value] of Object.entries(TOKEN_REGISTRY[themeId]!)) {
      expect(document.documentElement.style.getPropertyValue(`--token-${token}`)).toBe(value);
    }
  });

  it('applies Aurora variables and classes to the document root', async () => {
    const { themeEngine } = await import('../../lib/theme/theme-engine');

    themeEngine.setTheme('aurora');

    expect(themeEngine.getCurrentTheme().id).toBe('aurora');
    expect(document.documentElement.style.getPropertyValue('--color-background').trim()).toBe('#0d0f1c');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-aurora')).toBe(true);
  });

  it('persists the selected professional theme to localStorage', async () => {
    const { themeEngine } = await import('../../lib/theme/theme-engine');

    themeEngine.setTheme('aurora');

    const stored = localStorageMock.getItem('cgraph-theme-preferences');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? '{}').activeThemeId).toBe('aurora');
  });

  it('syncs theme changes from another tab via BroadcastChannel', async () => {
    const { themeEngine } = await import('../../lib/theme/theme-engine');

    themeEngine.setTheme('aurora');
    const peer = new MockBroadcastChannel('cgraph-theme-sync');
    peer.postMessage({ type: 'theme-change', theme: THEME_LIGHT });

    expect(themeEngine.getCurrentTheme().id).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });

  it('maps system preference auto mode to light theme', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      configurable: true,
    });

    const { themeEngine } = await import('../../lib/theme/theme-engine');
    themeEngine.updateSettings({ respectSystemPreference: true });

    expect(themeEngine.getActiveTheme().id).toBe('light');
  });
});
