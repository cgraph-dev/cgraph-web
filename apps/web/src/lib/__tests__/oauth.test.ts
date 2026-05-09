/**
 * OAuth Service Tests
 *
 * Tests for OAuth provider management, authorization flow,
 * callback handling, and account linking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleOAuthCallback,
  listConfiguredOAuthProviders,
  providerNames,
  providerColors,
} from '../oauth';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../api';
const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.clearAllMocks();
});

// Callback Handling

describe('handleOAuthCallback', () => {
  it('should exchange code for tokens', async () => {
    const tokenResponse = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        wallet_address: null,
        email_verified_at: '2024-01-01T00:00:00Z',
        totp_enabled: false,
        status: 'online' as const,
        custom_status: null,
        is_verified: true,
        is_premium: false,
        inserted_at: '2024-01-01T00:00:00Z',
      },
      tokens: {
        access_token: 'access-token-xyz',
        refresh_token: 'refresh-token-abc',
        expires_in: 3600,
      },
    };
    mockApi.get.mockResolvedValue({ data: tokenResponse });

    const result = await handleOAuthCallback('google', 'auth-code-123', 'state-456');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/google/callback', {
      params: { code: 'auth-code-123', state: 'state-456' },
    });
    expect(result.user.id).toBe('user-123');
    expect(result.tokens.access_token).toBe('access-token-xyz');
  });
});

describe('listConfiguredOAuthProviders', () => {
  it('returns configured providers from the backend response', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: {
          providers: [
            { id: 'google', name: 'Google' },
            { id: 'apple', name: 'Apple' },
            { id: 'unknown', name: 'Unsupported' },
          ],
        },
      },
    });

    await expect(listConfiguredOAuthProviders()).resolves.toEqual(['google', 'apple']);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/providers');
  });

  it('supports the flat providers response shape', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        providers: [{ id: 'facebook', name: 'Facebook' }],
      },
    });

    await expect(listConfiguredOAuthProviders()).resolves.toEqual(['facebook']);
  });
});

// Static Data

describe('providerNames', () => {
  it('should have display names for all providers', () => {
    expect(providerNames.google).toBe('Google');
    expect(providerNames.apple).toBe('Apple');
    expect(providerNames.facebook).toBe('Facebook');
    expect(providerNames.tiktok).toBe('TikTok');
  });
});

describe('providerColors', () => {
  it('should have color configs for all providers', () => {
    for (const provider of ['google', 'apple', 'facebook', 'tiktok'] as const) {
      expect(providerColors[provider]).toHaveProperty('bg');
      expect(providerColors[provider]).toHaveProperty('text');
      expect(providerColors[provider]).toHaveProperty('hover');
    }
  });
});
