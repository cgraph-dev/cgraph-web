import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  httpGet: vi.fn(),
  httpDelete: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string') return undefined;
        return ({
          children,
          className,
          onClick,
          ...rest
        }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Element = prop as React.ElementType;
          const domProps = { ...rest };
          delete domProps.animate;
          delete domProps.exit;
          delete domProps.initial;
          delete domProps.transition;
          delete domProps.variants;
          delete domProps.whileHover;
          delete domProps.whileTap;
          return (
            <Element
              className={className as string}
              onClick={onClick as React.MouseEventHandler}
              {...domProps}
            >
              {children}
            </Element>
          );
        };
      },
    }
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  LinkIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  XMarkIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.httpGet,
    delete: mocks.httpDelete,
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
  }),
}));

import { ConnectedAccounts } from '../connected-accounts';

function mockConnectedAccounts({
  providers,
  accounts = [],
}: {
  providers: unknown[];
  accounts?: unknown[];
}) {
  mocks.httpGet.mockImplementation((url: string) => {
    if (url === '/api/v1/me') {
      return Promise.resolve({ data: { data: { connected_accounts: accounts } } });
    }

    if (url === '/api/v1/auth/oauth/providers') {
      return Promise.resolve({ data: { data: { providers } } });
    }

    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe('ConnectedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders configured providers from backend discovery and hides unavailable providers', async () => {
    mockConnectedAccounts({
      providers: ['google', { provider: 'tiktok' }, 'unknown'],
      accounts: [
        {
          id: 'acct-google',
          provider: 'google',
          provider_name: 'Google',
          email: 'user@example.com',
          linked_at: '2026-05-23T00:00:00Z',
        },
      ],
    });

    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(mocks.httpGet).toHaveBeenCalledWith('/api/v1/auth/oauth/providers');
    });

    expect(await screen.findByText('Google')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Connected · user@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
  });

  it('keeps linked accounts visible when the provider is no longer configured', async () => {
    mockConnectedAccounts({
      providers: [],
      accounts: [
        {
          id: 'acct-apple',
          provider: 'apple',
          provider_name: 'Apple',
          linked_at: '2026-05-23T00:00:00Z',
        },
      ],
    });

    render(<ConnectedAccounts />);

    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
  });

  it('shows no provider actions when backend discovery returns none', async () => {
    mockConnectedAccounts({ providers: [] });

    render(<ConnectedAccounts />);

    expect(
      await screen.findByText('No external account providers are available right now.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
  });
});
