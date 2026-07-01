/**
 * Nodes Zustand store.
 *
 * Client-side state for wallet balance caching and optimistic UI.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { nodesApi } from '../services/nodesApi';
import type { Wallet, Bundle } from '../services/nodesApi';

interface NodesState {
  wallet: Wallet | null;
  bundles: Bundle[];
  reservedNodes: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchBundles: () => Promise<void>;
  setWallet: (wallet: Wallet) => void;
  reserveNodes: (amount: number) => void;
  releaseReservedNodes: (amount: number) => void;
  getSpendableBalance: (wallet?: Pick<Wallet, 'available_balance'> | null) => number;
  reset: () => void;
}

const initialState = {
  wallet: null,
  bundles: [],
  reservedNodes: 0,
  isLoading: false,
  error: null,
};

const toNodesAmount = (amount: number) => {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.trunc(amount));
};

export function getSpendableNodeBalance(
  wallet: Pick<Wallet, 'available_balance'> | null | undefined,
  reservedNodes: number
) {
  return Math.max(0, (wallet?.available_balance ?? 0) - toNodesAmount(reservedNodes));
}

export const useNodesStore = create<NodesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const wallet = await nodesApi.getWallet();
          set({ wallet, isLoading: false });
        } catch {
          set({ isLoading: false, error: 'Failed to fetch wallet' });
        }
      },

      fetchBundles: async () => {
        try {
          const bundles = await nodesApi.getBundles();
          set({ bundles });
        } catch {
          // Bundles are non-critical — fail silently
        }
      },

      setWallet: (wallet) => set({ wallet }),

      reserveNodes: (amount) =>
        set((state) => ({
          reservedNodes: state.reservedNodes + toNodesAmount(amount),
        })),

      releaseReservedNodes: (amount) =>
        set((state) => ({
          reservedNodes: Math.max(0, state.reservedNodes - toNodesAmount(amount)),
        })),

      getSpendableBalance: (wallet) =>
        getSpendableNodeBalance(wallet ?? get().wallet, get().reservedNodes),

      reset: () => set(initialState),
    }),
    {
      name: 'cgraph-nodes',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        wallet: state.wallet,
      }),
    }
  )
);
