import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectedAccounts } from '../connected-accounts';
import { http } from '@/lib/api-client';
import { listConfiguredOAuthProviders } from '@/lib/oauth';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/oauth', () => ({
  listConfiguredOAuthProviders: vi.fn(),
}));

const mockHttp = vi.mocked(http, true);
const mockListConfiguredOAuthProviders = vi.mocked(listConfiguredOAuthProviders);

describe('ConnectedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show static account-linking actions when no backend OAuth providers are configured', async () => {
    mockHttp.get.mockResolvedValueOnce({ data: { data: { connected_accounts: [] } } });
    mockListConfiguredOAuthProviders.mockResolvedValueOnce([]);

    render(<ConnectedAccounts />);

    expect(
      await screen.findByText(
        'External account linking is unavailable until an OAuth provider is configured.'
      )
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
    expect(screen.queryByText('TikTok')).not.toBeInTheDocument();
  });

  it('shows link actions only for OAuth providers returned by backend discovery', async () => {
    mockHttp.get.mockResolvedValueOnce({ data: { data: { connected_accounts: [] } } });
    mockListConfiguredOAuthProviders.mockResolvedValueOnce(['google', 'tiktok']);

    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('TikTok')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /connect/i })).toHaveLength(2);
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
  });

  it('keeps linked accounts visible without offering unavailable link actions', async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          connected_accounts: [
            {
              id: 'account-1',
              provider: 'facebook',
              provider_name: 'Facebook',
              email: 'linked@example.com',
              linked_at: '2026-05-10T12:00:00Z',
            },
          ],
        },
      },
    });
    mockListConfiguredOAuthProviders.mockResolvedValueOnce(['google']);

    render(<ConnectedAccounts />);

    expect(await screen.findByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Connected · linked@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /connect/i })).toHaveLength(1);
  });
});
