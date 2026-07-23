import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  httpGet: vi.fn(),
  setAuthState: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.httpGet,
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/oauth', () => ({
  openOAuthPopup: vi.fn(),
  providerColors: {
    google: { bg: 'bg-white', text: 'text-gray-900', hover: 'hover:bg-gray-100' },
    apple: { bg: 'bg-black', text: 'text-white', hover: 'hover:bg-gray-800' },
    facebook: { bg: 'bg-blue-600', text: 'text-white', hover: 'hover:bg-blue-700' },
    tiktok: { bg: 'bg-black', text: 'text-white', hover: 'hover:bg-gray-800' },
  },
  providerNames: {
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    tiktok: 'TikTok',
  },
  readDiscoveredOAuthProviders: (payload: unknown) => {
    const data =
      typeof payload === 'object' && payload !== null && 'data' in payload
        ? (payload as { data: unknown }).data
        : payload;
    const candidates =
      typeof data === 'object' && data !== null && 'providers' in data
        ? (data as { providers: unknown }).providers
        : data;
    if (!Array.isArray(candidates)) return [];
    return candidates
      .map((value) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null && 'provider' in value) {
          return (value as { provider: unknown }).provider;
        }
        return null;
      })
      .filter((value): value is 'google' | 'apple' | 'facebook' | 'tiktok' =>
        value === 'google' || value === 'apple' || value === 'facebook' || value === 'tiktok'
      );
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    setState: mocks.setAuthState,
  },
  mapUserFromApi: (user: unknown) => user,
}));

import { OAuthButtonGroup } from '../o-auth-buttons';

describe('OAuthButtonGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('discovers available OAuth providers from the backend', async () => {
    mocks.httpGet.mockResolvedValueOnce({
      data: { data: { providers: ['google', { provider: 'tiktok' }, 'unknown'] } },
    });

    render(<OAuthButtonGroup />);

    await waitFor(() => {
      expect(mocks.httpGet).toHaveBeenCalledWith('/api/v1/auth/oauth/providers');
    });

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with TikTok' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue with Facebook' })).toBeNull();
    expect(screen.getByText('Or continue with')).toBeTruthy();
  });

  it('does not render provider buttons when discovery returns none', async () => {
    mocks.httpGet.mockResolvedValueOnce({ data: { data: { providers: [] } } });

    render(<OAuthButtonGroup />);

    await waitFor(() => {
      expect(mocks.httpGet).toHaveBeenCalledWith('/api/v1/auth/oauth/providers');
    });

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Or continue with')).toBeNull();
  });

  it('uses explicit providers without calling discovery', () => {
    render(<OAuthButtonGroup providers={['apple']} />);

    expect(mocks.httpGet).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
  });
});
