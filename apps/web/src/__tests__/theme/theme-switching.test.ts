import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_LIGHT } from '../../lib/theme/themes';

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

    const stored = localStorageMock.getItem('cgraph:v1:theme:preferences');
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
