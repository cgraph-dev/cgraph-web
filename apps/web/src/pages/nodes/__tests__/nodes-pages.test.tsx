import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nodesHookMocks = vi.hoisted(() => ({
  useCreateCheckout: vi.fn(),
  useNodeBundles: vi.fn(),
  useNodeTransactions: vi.fn(),
  useNodeWallet: vi.fn(),
}));

vi.mock('@/modules/nodes/hooks/useNodes', () => nodesHookMocks);

import { NodesShopPage } from '../nodes-shop';
import { NodesWalletPage } from '../nodes-wallet';

const wallet = {
  available_balance: 1500,
  lifetime_earned: 5000,
  lifetime_spent: 3500,
  pending_balance: 0,
  user_id: 'user-1',
};

const bundle = {
  bonus_percent: 0,
  id: 'bundle-1',
  is_active: true,
  name: 'Starter Pack',
  nodes: 500,
  popular: false,
  price: 4.99,
};

function renderRoute(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('Nodes pages failure states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nodesHookMocks.useCreateCheckout.mockReturnValue({ isPending: false, mutate: vi.fn() });
    nodesHookMocks.useNodeWallet.mockReturnValue({
      data: wallet,
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    nodesHookMocks.useNodeTransactions.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    nodesHookMocks.useNodeBundles.mockReturnValue({
      data: [bundle],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('does not render a zero-balance wallet when wallet loading fails', () => {
    const refetch = vi.fn();
    nodesHookMocks.useNodeWallet.mockReturnValue({
      data: undefined,
      error: new Error('Wallet API unavailable'),
      isError: true,
      isLoading: false,
      refetch,
    });

    renderRoute(<NodesWalletPage />);

    expect(screen.getByText('Wallet unavailable')).toBeInTheDocument();
    expect(screen.getByText('Wallet API unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Available Balance')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the wallet visible while transaction history failure is explicit', () => {
    const refetch = vi.fn();
    nodesHookMocks.useNodeTransactions.mockReturnValue({
      data: undefined,
      error: new Error('Transaction API unavailable'),
      isError: true,
      isLoading: false,
      refetch,
    });

    renderRoute(<NodesWalletPage />);

    expect(screen.getByText('Available Balance')).toBeInTheDocument();
    expect(screen.getByText('Transaction history unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not render an empty shop as success when bundles fail to load', () => {
    const refetch = vi.fn();
    nodesHookMocks.useNodeBundles.mockReturnValue({
      data: undefined,
      error: new Error('Bundles API unavailable'),
      isError: true,
      isLoading: false,
      refetch,
    });

    renderRoute(<NodesShopPage />);

    expect(screen.getByText('Shop unavailable')).toBeInTheDocument();
    expect(screen.getByText('Bundles API unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Purchase')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an honest empty state when the shop loads with no bundles', () => {
    nodesHookMocks.useNodeBundles.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderRoute(<NodesShopPage />);

    expect(screen.getByText('No Node bundles are available right now.')).toBeInTheDocument();
  });
});
