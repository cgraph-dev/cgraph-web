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

  it('allows web refresh requests to omit the body refresh token', async () => {
    const setTokens = vi.fn();
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      getAccessToken: () => 'expired-access',
      getRefreshToken: () => 'stale-js-refresh',
      setTokens,
      refresh: {
        endpoint: '/api/v1/auth/refresh',
        buildBody: () => ({}),
        parseTokens: (data) => data as { accessToken: string; refreshToken: string },
        withCredentials: true,
      },
    });

    const refreshBodies: unknown[] = [];
    let profileAttempts = 0;

    client.defaults.adapter = async (config) => {
      if (config.url === '/api/v1/auth/refresh') {
        refreshBodies.push(
          typeof config.data === 'string' ? JSON.parse(config.data) : config.data
        );
        return {
          config,
          data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' },
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      }

      if (config.url === '/api/v1/me') {
        profileAttempts += 1;
        if (profileAttempts === 1) {
          throw unauthorized(config);
        }

        return {
          config,
          data: { id: 'u1' },
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      }

      throw unauthorized(config);
    };

    await expect(client.get('/api/v1/me')).resolves.toMatchObject({ status: 200 });
    expect(profileAttempts).toBe(2);
    expect(refreshBodies).toEqual([{}]);
    expect(setTokens).toHaveBeenCalledWith({
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
    });
  });
});
