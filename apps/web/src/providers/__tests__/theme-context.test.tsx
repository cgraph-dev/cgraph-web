import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
const { mockThemeEngine, mockSettingsStore, setState } = vi.hoisted(() => {
  let _currentThemeId = 'dark';
  let _appTheme: 'aurora' | 'dark' | 'light' | 'bubble' | 'system' = 'aurora';
  let _subscribers: ((theme: Record<string, unknown>) => void)[] = [];
  let _preferences = {
    themeId: 'dark',
    customThemes: {},
    settings: {
      respectSystemPreference: false,
      reduceMotion: false,
      highContrast: false,
      fontScale: 1,
      messageDisplay: 'cozy' as const,
      messageSpacing: 1,
    },
  };

  const createTheme = (id: string) => ({
    id,
    name: id,
    category: id === 'light' ? 'light' : 'dark',
    colors: {},
    isBuiltIn: true,
  });

  const applyTheme = (theme: Record<string, unknown>) => {
    const id = String(theme.id);
    _currentThemeId = id;
    document.documentElement.classList.remove('light', 'dark');
    const category = id === 'light' ? 'light' : 'dark';
    document.documentElement.classList.add(category);
    _subscribers.forEach((fn) => fn(createTheme(id)));
  };

  const engine = {
    getCurrentTheme: vi.fn(() => ({
      id: _currentThemeId,
      name: _currentThemeId,
      category: _currentThemeId === 'light' ? 'light' : 'dark',
      colors: {},
      isBuiltIn: true,
    })),
    getPreferences: vi.fn(() => _preferences),
    setTheme: vi.fn((id: string) => {
      _preferences = { ..._preferences, themeId: id };
      localStorage.setItem('cgraph-theme', id);
      applyTheme(createTheme(id));
    }),
    applyTheme: vi.fn(applyTheme),
    applyRuntimeTheme: vi.fn(applyTheme),
    subscribe: vi.fn((fn: (theme: Record<string, unknown>) => void) => {
      _subscribers.push(fn);
      return () => {
        _subscribers = _subscribers.filter((s) => s !== fn);
      };
    }),
    updateSettings: vi.fn((settings: Record<string, unknown>) => {
      _preferences = {
        ..._preferences,
        settings: { ..._preferences.settings, ...settings },
      };
    }),
    updateRuntimeSettings: vi.fn((settings: Record<string, unknown>) => {
      _preferences = {
        ..._preferences,
        settings: { ..._preferences.settings, ...settings },
      };
      applyTheme(createTheme(_currentThemeId));
    }),
    createCustomTheme: vi.fn(),
    deleteCustomTheme: vi.fn(),
  };

  const updateAppearanceSettings = vi.fn(() => Promise.resolve());
  const settingsStore = {
    get settings() {
      return {
        appearance: {
          theme: _appTheme,
          reduceMotion: _preferences.settings.reduceMotion,
          highContrast: _preferences.settings.highContrast,
        },
      };
    },
    updateAppearanceSettings,
  };

  return {
    mockThemeEngine: engine,
    mockSettingsStore: settingsStore,
    setState: (patch: {
      themeId?: string;
      appTheme?: typeof _appTheme;
      preferences?: typeof _preferences;
      subscribers?: ((theme: Record<string, unknown>) => void)[];
    }) => {
      if (patch.themeId !== undefined) _currentThemeId = patch.themeId;
      if (patch.appTheme !== undefined) _appTheme = patch.appTheme;
      if (patch.preferences !== undefined) _preferences = patch.preferences;
      if (patch.subscribers !== undefined) _subscribers = patch.subscribers;
    },
  };
});

vi.mock('@/lib/theme/theme-engine', () => ({
  themeEngine: mockThemeEngine,
  getAllThemes: vi.fn(() => ['aurora', 'dark', 'light', 'bubble'].map((id) => ({ id }))),
  THEME_REGISTRY: {
    aurora: { id: 'aurora' },
    dark: { id: 'dark' },
    light: { id: 'light' },
    bubble: { id: 'bubble' },
  },
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: (selector: (state: typeof mockSettingsStore) => unknown) =>
    selector(mockSettingsStore),
}));

vi.mock('@/lib/theme/tokens', () => ({
  injectSemanticTokens: vi.fn(),
}));

import { ThemeProvider, useTheme } from '../theme-context';
import { useThemeEnhanced } from '../theme-enhanced';
let matchMediaMatches = false;
const colorSchemeChangeHandlerRef: { current: ((e: MediaQueryListEvent) => void) | null } = {
  current: null,
};

beforeEach(() => {
  matchMediaMatches = false;
  colorSchemeChangeHandlerRef.current = null;
  setState({
    themeId: 'dark',
    appTheme: 'aurora',
    subscribers: [],
    preferences: {
      themeId: 'dark',
      customThemes: {},
      settings: {
        respectSystemPreference: false,
        reduceMotion: false,
        highContrast: false,
        fontScale: 1,
        messageDisplay: 'cozy' as const,
        messageSpacing: 1,
      },
    },
  });
  localStorage.clear();
  document.documentElement.classList.remove('light', 'dark');
  vi.clearAllMocks();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      get matches() {
        return matchMediaMatches;
      },
      addEventListener: vi.fn((_: string, handler: (event: MediaQueryListEvent) => void) => {
        if (query === '(prefers-color-scheme: dark)') {
          colorSchemeChangeHandlerRef.current = handler;
        }
      }),
      removeEventListener: vi.fn(),
    })),
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
describe('ThemeContext', () => {
  describe('ThemeProvider', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('applies the Settings default instead of a local app-theme preference', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('aurora');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(mockThemeEngine.applyRuntimeTheme).toHaveBeenCalledWith({ id: 'aurora' });
    });

    it('resolves a persisted light Settings intent', () => {
      setState({ appTheme: 'light' });
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('applies class to document.documentElement on mount', () => {
      // The engine starts with dark theme - simulate the class being set
      document.documentElement.classList.add('dark');
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('writes an explicit app theme through the Settings action', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({ theme: 'light' });
      expect(mockThemeEngine.setTheme).not.toHaveBeenCalled();
    });

    it('resolves system intent to Aurora for a dark operating system', () => {
      matchMediaMatches = true;
      setState({ appTheme: 'system' });
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(mockThemeEngine.applyRuntimeTheme).toHaveBeenCalledWith({ id: 'aurora' });
    });

    it('reapplies system intent when the operating-system theme changes', () => {
      setState({ appTheme: 'system' });
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.resolvedTheme).toBe('light');

      act(() => {
        matchMediaMatches = true;
        colorSchemeChangeHandlerRef.current?.(new Event('change') as MediaQueryListEvent);
      });

      expect(mockThemeEngine.applyRuntimeTheme).toHaveBeenLastCalledWith({ id: 'aurora' });
    });

    it('writes system intent through Settings without changing local preference flags', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({ theme: 'system' });
      expect(mockThemeEngine.updateSettings).not.toHaveBeenCalledWith({
        respectSystemPreference: true,
      });
    });

    it('writes accessibility choices through the durable Settings owner', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.toggleReduceMotion();
        result.current.toggleHighContrast();
      });

      expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({
        reduceMotion: true,
      });
      expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({
        highContrast: true,
      });
    });

    it('applies operating-system reduced motion without changing durable settings', () => {
      matchMediaMatches = true;
      renderHook(() => useTheme(), { wrapper });

      expect(mockThemeEngine.updateRuntimeSettings).toHaveBeenCalledWith({
        reduceMotion: true,
        highContrast: false,
      });
      expect(mockSettingsStore.updateAppearanceSettings).not.toHaveBeenCalledWith({
        reduceMotion: true,
      });
    });
  });

  describe('useTheme', () => {
    it('throws when used outside ThemeProvider', () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      consoleSpy.mockRestore();
    });
  });
});
