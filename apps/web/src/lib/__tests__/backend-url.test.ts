import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, getMediaBaseUrl, getSocketUrl } from '../backend-url';

describe('backend URL resolution', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ignores retired prod-v2 API env values so same-origin rewrites stay in control', () => {
    vi.stubEnv('VITE_API_URL', 'https://cgraph-backend-prod-v2.fly.dev');
    vi.stubEnv('VITE_DEV_API_TARGET', 'https://cgraph-backend-prod-v3.fly.dev');

    expect(getApiBaseUrl()).toBe('');
    expect(getMediaBaseUrl()).toBe('');
  });

  it('ignores retired prod-v2 socket env values', () => {
    vi.stubEnv('VITE_WS_URL', 'wss://cgraph-backend-prod-v2.fly.dev');
    vi.stubEnv('VITE_SOCKET_URL', '');

    expect(getSocketUrl()).not.toContain('cgraph-backend-prod-v2');
    expect(getSocketUrl()).toContain('/socket');
  });

  it('allows the current prod-v3 backend when explicitly configured', () => {
    vi.stubEnv('VITE_API_URL', 'https://cgraph-backend-prod-v3.fly.dev');
    vi.stubEnv('VITE_WS_URL', 'wss://cgraph-backend-prod-v3.fly.dev/socket');

    expect(getApiBaseUrl()).toBe('https://cgraph-backend-prod-v3.fly.dev');
    expect(getMediaBaseUrl()).toBe('https://cgraph-backend-prod-v3.fly.dev');
    expect(getSocketUrl()).toBe('wss://cgraph-backend-prod-v3.fly.dev/socket');
  });

  it('falls back to VITE_WS_URL when VITE_SOCKET_URL is intentionally blank', () => {
    vi.stubEnv('VITE_SOCKET_URL', '');
    vi.stubEnv('VITE_WS_URL', 'wss://cgraph-backend-prod-v3.fly.dev/socket');

    expect(getSocketUrl()).toBe('wss://cgraph-backend-prod-v3.fly.dev/socket');
  });
});
