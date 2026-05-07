/**
 * Nodes Zustand store.
 *
 * Client-side state for wallet balance caching and optimistic UI.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { nodesApi } from '../services/nodesApi';
import type { Wallet, Bundle } from '../services/nodesApi';

interface NodesState {
  wallet: Wallet | null;
  bundles: Bundle[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchBundles: () => Promise<void>;
  setWallet: (wallet: Wallet) => void;
  reset: () => void;
}

const initialState = {
  wallet: null,
  bundles: [],
  isLoading: false,
  error: null,
};

export const useNodesStore = create<NodesState>()(
  persist(
    (set) => ({
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

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.nodesStore,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        wallet: state.wallet,
      }),
    }
  )
);
