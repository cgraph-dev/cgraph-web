import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION } from '../app-version';
import { api } from '../api';
import { checkVersion, startPeriodicCheck, stopPeriodicCheck } from '../client-version-check';

describe('checkVersion', () => {
  afterEach(() => {
    stopPeriodicCheck();
    vi.unstubAllGlobals();
  });

  it('identifies the compiled web release to the version endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: {
          latest_version: APP_VERSION,
          min_version: APP_VERSION,
          update_url: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(checkVersion()).resolves.toEqual({
      needsUpdate: false,
      forceUpdate: false,
      latestVersion: APP_VERSION,
      updateUrl: null,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/app/version?platform=web', {
      headers: {
        'X-Client-Version': APP_VERSION,
        'X-Client-Platform': 'web',
      },
    });
  });

  it('sets the compiled release on ordinary API requests', () => {
    expect(api.defaults.headers['X-Client-Version']).toBe(APP_VERSION);
    expect(api.defaults.headers['X-Client-Platform']).toBe('web');
  });

  it('notifies the app when the backend requires a newer release', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: {
          latest_version: '999.0.0',
          min_version: '999.0.0',
          update_url: null,
        },
      }),
    });
    const onForceUpdate = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    startPeriodicCheck(onForceUpdate);

    await vi.waitFor(() => expect(onForceUpdate).toHaveBeenCalledOnce());
  });

  it('removes its visibility listener when the app unmounts', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ data: null }) })
    );

    startPeriodicCheck(vi.fn());
    stopPeriodicCheck();

    expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
