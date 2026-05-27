/**
 * Nodes TanStack Query hooks.
 *
 * Server-state management for wallet, transactions, bundles,
 * and mutations for tipping, unlocking, checkout, and gifting.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeRedirect } from '@/lib/security';
import { nodesApi } from '../services/nodesApi';
import type { TransactionType } from '../types';
import toast from 'react-hot-toast';

const nodesMoneyMutationOptions = {
  retry: false,
} as const;

export const nodesKeys = {
  all: ['nodes'] as const,
  wallet: () => [...nodesKeys.all, 'wallet'] as const,
  transactions: (type?: string) => [...nodesKeys.all, 'transactions', type] as const,
  bundles: () => [...nodesKeys.all, 'bundles'] as const,
};
/** Fetch the user's node wallet. */
export function useNodeWallet() {
  return useQuery({
    queryKey: nodesKeys.wallet(),
    queryFn: () => nodesApi.getWallet(),
    staleTime: 30_000,
  });
}

/** Fetch transaction history, optionally filtered by type. */
export function useNodeTransactions(type?: TransactionType) {
  return useQuery({
    queryKey: nodesKeys.transactions(type),
    queryFn: () => nodesApi.getTransactions({ type }),
    staleTime: 30_000,
  });
}

/** Fetch available node bundles. */
export function useNodeBundles() {
  return useQuery({
    queryKey: nodesKeys.bundles(),
    queryFn: () => nodesApi.getBundles(),
    staleTime: 5 * 60_000,
  });
}
/** Send a tip to another user. */
export function useSendTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, amount }: { recipientId: string; amount: number }) =>
      nodesApi.sendTip(recipientId, amount),
    ...nodesMoneyMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
    },
  });
}

/** Unlock gated content (thread). */
export function useUnlockContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => nodesApi.unlockContent(threadId),
    ...nodesMoneyMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
      // Thread data also needs refetch — handled by caller via queryKey invalidation
    },
  });
}

/** Create a Stripe Checkout session for a bundle. */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: (bundleId: string) => nodesApi.createCheckout(bundleId),
    ...nodesMoneyMutationOptions,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout (validated against trusted domains)
      const checkoutUrl = data.checkout_url ?? data.url;
      if (checkoutUrl) {
        safeRedirect(checkoutUrl);
      }
    },
    onError: () => {
      toast.error('Checkout failed. Please try again.');
    },
  });
}

/** Send a node gift to a friend. */
export function useSendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recipientId,
      amount,
      message,
    }: {
      readonly recipientId: string;
      readonly amount: number;
      readonly message?: string;
    }) => nodesApi.sendGift(recipientId, amount, message),
    ...nodesMoneyMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
    },
  });
}
