import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { http } from '@/lib/api-client';
import { isPreferenceBootstrapReady, usePreferenceOrchestrator } from '../preferenceOrchestrator';
import { useSettingsStore } from '../settingsStore';
import { useCustomizationStore, DEFAULT_STATE } from '../customization/customizationStore';

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
    usePreferenceOrchestrator.getState().reset();
    mockPreferenceGets();
  });

  it('bootstraps settings and customization without the legacy app-theme endpoint', async () => {
    const result = await usePreferenceOrchestrator.getState().bootstrapPreferences({ userId: 'user-1' });

    expect(result).toEqual({
      settings: 'fulfilled',
      customization: 'fulfilled',
    });
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/settings');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/me/customizations');
    expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/me/theme');
    expect(usePreferenceOrchestrator.getState().lastBootstrappedUserId).toBe('user-1');
    expect(usePreferenceOrchestrator.getState().error).toBeNull();
  });

  it('does not fetch the legacy app-theme endpoint without a user id', async () => {
    const result = await usePreferenceOrchestrator.getState().bootstrapPreferences();

    expect(result).toEqual({ settings: 'fulfilled', customization: 'fulfilled' });
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/settings');
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/me/customizations');
    expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/me/theme');
  });

  it('reuses a fulfilled bootstrap for the same user unless forced', async () => {
    await usePreferenceOrchestrator.getState().bootstrapPreferences({ userId: 'user-1' });
    await usePreferenceOrchestrator.getState().bootstrapPreferences({ userId: 'user-1' });

    expect(mockedGet).toHaveBeenCalledTimes(2);

    await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1', force: true });

    expect(mockedGet).toHaveBeenCalledTimes(4);
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
      .bootstrapPreferences({ userId: 'user-1' });

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
        lastBootstrappedUserId: 'user-1',
        result: { settings: 'fulfilled', customization: 'fulfilled' },
      })
    ).toBe(true);

    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        lastBootstrappedUserId: 'user-1',
        result: { settings: 'fulfilled', customization: 'rejected' },
      })
    ).toBe(false);
  });
});
