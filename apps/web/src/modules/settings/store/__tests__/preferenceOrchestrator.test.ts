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

  it('keeps Settings blocked when its durable response fails', async () => {
    mockedGet.mockImplementation(async (url) => {
      if (url === '/api/v1/settings') {
        throw new Error('Settings offline');
      }
      return { data: { data: {} } };
    });

    const result = await usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1' });

    expect(result.settings).toBe('rejected');
    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        lastBootstrappedUserId: 'user-1',
        result,
      })
    ).toBe(false);
  });

  it('makes Settings ready after its durable response even while customization is pending', async () => {
    let resolveCustomization: (() => void) | undefined;
    mockedGet.mockImplementation((url) => {
      if (url === '/api/v1/me/customizations') {
        return new Promise((resolve) => {
          resolveCustomization = () => resolve({ data: { data: {} } });
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    const bootstrap = usePreferenceOrchestrator
      .getState()
      .bootstrapPreferences({ userId: 'user-1' });

    await vi.waitFor(() => {
      expect(usePreferenceOrchestrator.getState().result).toEqual({
        settings: 'fulfilled',
        customization: 'pending',
      });
    });

    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        lastBootstrappedUserId: 'user-1',
        result: usePreferenceOrchestrator.getState().result,
      })
    ).toBe(true);

    resolveCustomization?.();
    await bootstrap;
  });

  it('reports Settings readiness from the durable settings surface only', () => {
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
    ).toBe(true);

    expect(
      isPreferenceBootstrapReady({
        isAuthenticated: true,
        userId: 'user-1',
        lastBootstrappedUserId: 'user-1',
        result: { settings: 'rejected', customization: 'fulfilled' },
      })
    ).toBe(false);
  });
});
