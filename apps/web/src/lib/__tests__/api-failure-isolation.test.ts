import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { api } from '../api';

const originalAdapter = api.defaults.adapter;

function unavailable(config: InternalAxiosRequestConfig): AxiosError {
  const response: AxiosResponse = {
    config,
    data: { error: 'provider unavailable' },
    headers: new AxiosHeaders(),
    status: 503,
    statusText: 'Service Unavailable',
  };

  return new AxiosError('Request failed with status code 503', 'ERR_BAD_RESPONSE', config, null, response);
}

describe('API failure isolation', () => {
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('does not let repeated auxiliary failures block a direct-message write', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      if (config.url?.endsWith('/messages')) {
        return {
          config,
          data: { data: { id: 'message-1' } },
          headers: new AxiosHeaders(),
          status: 201,
          statusText: 'Created',
        };
      }

      throw unavailable(config);
    });
    api.defaults.adapter = adapter;

    for (let request = 0; request < 5; request += 1) {
      await expect(api.post(`/api/v1/auxiliary/${request}`, {})).rejects.toMatchObject({
        response: { status: 503 },
      });
    }

    await expect(
      api.post('/api/v1/conversations/conversation-1/messages', { content: 'hello' })
    ).resolves.toMatchObject({ status: 201 });
    expect(adapter).toHaveBeenCalledTimes(6);
  });
});
