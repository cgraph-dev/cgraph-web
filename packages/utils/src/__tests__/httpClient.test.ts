import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from '../httpClient';

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
  const response: AxiosResponse = {
    config,
    data: { error: 'unauthorized' },
    headers: {},
    status: 401,
    statusText: 'Unauthorized',
  };

  return new AxiosError('Request failed with status code 401', undefined, config, {}, response);
}

describe('createHttpClient auth refresh', () => {
  it('does not log out a newer session when a stale refresh fails', async () => {
    let refreshToken = 'old-refresh';
    const onLogout = vi.fn();
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      getAccessToken: () => 'old-access',
      getRefreshToken: () => refreshToken,
      setTokens: vi.fn(),
      onLogout,
      refresh: {
        endpoint: '/api/v1/auth/refresh',
        parseTokens: () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      },
    });

    client.defaults.adapter = async (config) => {
      if (config.url === '/api/v1/auth/refresh') {
        refreshToken = 'new-refresh';
      }

      throw unauthorized(config);
    };

    await expect(client.get('/api/v1/me')).rejects.toThrow('Request failed with status code 401');
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('logs out when the failed refresh still belongs to the current session', async () => {
    const onLogout = vi.fn();
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      getAccessToken: () => 'old-access',
      getRefreshToken: () => 'old-refresh',
      setTokens: vi.fn(),
      onLogout,
      refresh: {
        endpoint: '/api/v1/auth/refresh',
        parseTokens: () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      },
    });

    client.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(client.get('/api/v1/me')).rejects.toThrow('Request failed with status code 401');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
