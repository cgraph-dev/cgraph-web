import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { http } from '@/lib/api-client';

const mockedHttp = http as unknown as { get: ReturnType<typeof vi.fn> };

async function loadVapidResolver() {
  vi.resetModules();
  return import('../vapid');
}

describe('getVapidPublicKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the build-time public key without making a request', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'build-key');
    const { getVapidPublicKey } = await loadVapidResolver();

    await expect(getVapidPublicKey()).resolves.toBe('build-key');
    expect(mockedHttp.get).not.toHaveBeenCalled();
  });

  it('fetches and caches the public key when the environment value is absent', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    mockedHttp.get.mockResolvedValue({
      data: { data: { vapid_public_key: 'server-key' } },
    });
    const { getVapidPublicKey } = await loadVapidResolver();

    await expect(getVapidPublicKey()).resolves.toBe('server-key');
    await expect(getVapidPublicKey()).resolves.toBe('server-key');
    expect(mockedHttp.get).toHaveBeenCalledTimes(1);
    expect(mockedHttp.get).toHaveBeenCalledWith('/api/v1/web-push/vapid-key');
  });

  it('fails closed when the public-key endpoint is unavailable', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    mockedHttp.get.mockRejectedValue(new Error('offline'));
    const { getVapidPublicKey } = await loadVapidResolver();

    await expect(getVapidPublicKey()).resolves.toBeNull();
  });
});
