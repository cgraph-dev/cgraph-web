import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockNodesApi } = vi.hoisted(() => ({
  mockNodesApi: {
    getWallet: vi.fn(),
    getBundles: vi.fn(),
  },
}));

vi.mock('../../services/nodesApi', () => ({ nodesApi: mockNodesApi }));

import { getSpendableNodeBalance, useNodesStore } from '../nodesStore';
const makeWallet = (overrides?: Record<string, unknown>) => ({
  user_id: 'user-1',
  available_balance: 5000,
  pending_balance: 200,
  lifetime_earned: 10000,
  lifetime_spent: 4800,
  ...overrides,
});

const makeBundle = (overrides?: Record<string, unknown>) => ({
  id: 'bundle-1',
  name: 'Starter Pack',
  nodes: 500,
  price: 4.99,
  bonus_percent: 0,
  popular: false,
  ...overrides,
});

describe('useNodesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNodesStore.getState().reset();
  });

  afterEach(() => {
    useNodesStore.getState().reset();
  });
  describe('initial state', () => {
    it('has null wallet, empty bundles, not loading, no error', () => {
      const state = useNodesStore.getState();

      expect(state.wallet).toBeNull();
      expect(state.bundles).toEqual([]);
      expect(state.reservedNodes).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
  describe('setWallet', () => {
    it('sets wallet directly', () => {
      const wallet = makeWallet();

      useNodesStore.getState().setWallet(wallet);

      expect(useNodesStore.getState().wallet).toEqual(wallet);
    });
  });
  describe('reserved Nodes', () => {
    it('reserves and releases pending spend without going below zero', () => {
      useNodesStore.getState().reserveNodes(40);
      useNodesStore.getState().reserveNodes(15);

      expect(useNodesStore.getState().reservedNodes).toBe(55);

      useNodesStore.getState().releaseReservedNodes(30);
      expect(useNodesStore.getState().reservedNodes).toBe(25);

      useNodesStore.getState().releaseReservedNodes(100);
      expect(useNodesStore.getState().reservedNodes).toBe(0);
    });

    it('ignores invalid reservation amounts', () => {
      useNodesStore.getState().reserveNodes(Number.NaN);
      useNodesStore.getState().reserveNodes(-10);

      expect(useNodesStore.getState().reservedNodes).toBe(0);
    });

    it('returns spendable balance after local reservations', () => {
      const wallet = makeWallet({ available_balance: 100 });

      useNodesStore.getState().reserveNodes(35);

      expect(useNodesStore.getState().getSpendableBalance(wallet)).toBe(65);
      expect(getSpendableNodeBalance(wallet, 120)).toBe(0);
    });
  });
  describe('fetchWallet', () => {
    it('sets isLoading true then stores wallet on success', async () => {
      const wallet = makeWallet();
      mockNodesApi.getWallet.mockResolvedValue(wallet);

      await useNodesStore.getState().fetchWallet();

      const state = useNodesStore.getState();
      expect(state.wallet).toEqual(wallet);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('clears previous error before fetching', async () => {
      // Set up an error state first
      mockNodesApi.getWallet.mockRejectedValueOnce(new Error('fail'));
      await useNodesStore.getState().fetchWallet();
      expect(useNodesStore.getState().error).toBe('Failed to fetch wallet');

      // Now fetch successfully
      mockNodesApi.getWallet.mockResolvedValue(makeWallet());
      await useNodesStore.getState().fetchWallet();

      expect(useNodesStore.getState().error).toBeNull();
    });

    it('sets error message on fetch failure', async () => {
      mockNodesApi.getWallet.mockRejectedValue(new Error('Network error'));

      await useNodesStore.getState().fetchWallet();

      const state = useNodesStore.getState();
      expect(state.error).toBe('Failed to fetch wallet');
      expect(state.isLoading).toBe(false);
      expect(state.wallet).toBeNull();
    });
  });
  describe('fetchBundles', () => {
    it('stores bundles on success', async () => {
      const bundles = [makeBundle(), makeBundle({ id: 'bundle-2', popular: true })];
      mockNodesApi.getBundles.mockResolvedValue(bundles);

      await useNodesStore.getState().fetchBundles();

      expect(useNodesStore.getState().bundles).toEqual(bundles);
    });

    it('fails silently without setting error', async () => {
      mockNodesApi.getBundles.mockRejectedValue(new Error('fail'));

      await useNodesStore.getState().fetchBundles();

      const state = useNodesStore.getState();
      expect(state.bundles).toEqual([]);
      expect(state.error).toBeNull();
    });
  });
  describe('reset', () => {
    it('resets state to initial values', async () => {
      // Populate state
      const wallet = makeWallet();
      mockNodesApi.getWallet.mockResolvedValue(wallet);
      mockNodesApi.getBundles.mockResolvedValue([makeBundle()]);
      await useNodesStore.getState().fetchWallet();
      await useNodesStore.getState().fetchBundles();

      // Verify populated
      expect(useNodesStore.getState().wallet).not.toBeNull();
      expect(useNodesStore.getState().bundles).toHaveLength(1);

      // Reset
      useNodesStore.getState().reset();

      const state = useNodesStore.getState();
      expect(state.wallet).toBeNull();
      expect(state.bundles).toEqual([]);
      expect(state.reservedNodes).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
