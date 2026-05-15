import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { http } from '@/lib/api-client';
import { isPreferenceBootstrapReady, usePreferenceOrchestrator } from '../preferenceOrchestrator';
import { useSettingsStore } from '../settingsStore';
import { useCustomizationStore, DEFAULT_STATE } from '../customization/customizationStore';
import { useThemeStore } from '@/stores/theme/store';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = http.get as MockedFunction<typeof http.get>;

function mockPreferenceGets() {
  mockedGet.mockImplementation(async (url) => {
    switch (url) {
      case '/api/v1/settings':
        return { data: { data: { theme: 'dark', push_notifications: false } } };
      case '/api/v1/me/customizations':
        return { data: { data: { theme_preset: 'pink', effect_preset: 'neon' } } };
      case '/api/v1/me/theme':
        return { data: { data: { color_preset: 'cyan', effect_preset: 'minimal' } } };
      default:
        return { data: { data: {} } };
    }
  });
}

describe('preferenceOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.getState().reset();
    useCustomizationStore.setState({ ...DEFAULT_STATE });
    useThemeStore.getState().reset();
    usePreferenceOrchestrator.getState().reset();
    mockPreferenceGets();
  });

  it('bootstraps settings, customization, and theme through one owner', async () => {
    const result = await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', includeTheme: true });

    expect(result).toEqual({
      settings: 'fulfilled',
      customization: 'fulfilled',
      theme: 'fulfilled',
    });
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/settings');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/me/customizations');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/me/theme');
    expect(usePreferenceOrchestrator.getState().lastBootstrappedUserId).toBe('user-1');
    expect(usePreferenceOrchestrator.getState().error).toBeNull();
  });

  it('skips theme sync until auth has a user id', async () => {
    const result = await usePreferenceOrchestrator.getState().bootstrapPreferences();

    expect(result.theme).toBe('skipped');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/settings');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/me/customizations');
    expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/me/theme');
  });

  it('reuses a fulfilled bootstrap for the same user unless forced', async () => {
    await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', includeTheme: true });
    await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', includeTheme: true });

    expect(mockedGet).toHaveBeenCalledTimes(3);

    await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', includeTheme: true, force: true });

    expect(mockedGet).toHaveBeenCalledTimes(6);
  });

  it('marks the bootstrap rejected when a surface stores an error', async () => {
    mockedGet.mockImplementation(async (url) => {
      if (url === '/api/v1/me/customizations') {
        throw new Error('Customization offline');
      }
      return { data: { data: {} } };
    });

    const result = await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', includeTheme: true });

    expect(result.customization).toBe('rejected');
    expect(usePreferenceOrchestrator.getState().error).toBe(
      'One or more preference surfaces failed to sync'
    );
  });

  it('reports readiness only after the required preference surfaces are fulfilled', () => {
    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: false,
        lastBootstrappedUserId: null,
        result: null,
      })
    ).toBe(true);

    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        includeTheme: true,
        lastBootstrappedUserId: 'user-1',
        result: { settings: 'fulfilled', customization: 'fulfilled', theme: 'fulfilled' },
      })
    ).toBe(true);

    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        includeTheme: true,
        lastBootstrappedUserId: 'user-1',
        result: { settings: 'fulfilled', customization: 'fulfilled', theme: 'rejected' },
      })
    ).toBe(false);
  });
});
