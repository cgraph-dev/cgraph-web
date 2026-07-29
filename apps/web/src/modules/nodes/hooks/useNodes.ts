/**
 * Nodes TanStack Query hooks.
 *
 * Server-state management for wallet, transactions, bundles,
 * and mutations for tipping, unlocking, checkout, and gifting.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { safeRedirect } from '@/lib/security';
import { nodesApi } from '../services/nodesApi';
import type { TransactionType } from '../types';
import { useNodesStore, getSpendableNodeBalance } from '../store/nodesStore';
import type { Wallet } from '../services/nodesApi';
import { toast } from '@/shared/components/ui';

const nodesMoneyMutationOptions = {
  retry: false,
} as const;

export const nodesKeys = {
  all: ['nodes'] as const,
  wallet: () => [...nodesKeys.all, 'wallet'] as const,
  transactionsRoot: () => [...nodesKeys.all, 'transactions'] as const,
  transactions: (type?: string) => [...nodesKeys.all, 'transactions', type] as const,
  bundles: () => [...nodesKeys.all, 'bundles'] as const,
};

type ReservedNodesContext = {
  readonly reservedNodes: number;
};

type UnlockContentInput =
  | string
  | {
      readonly threadId: string;
      readonly amount?: number;
    };

function toReservedNodes(amount: number | undefined) {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.trunc(amount ?? 0));
}

function reserveNodeSpend(amount: number | undefined): ReservedNodesContext {
  const reservedNodes = toReservedNodes(amount);
  if (reservedNodes > 0) {
    useNodesStore.getState().reserveNodes(reservedNodes);
  }
  return { reservedNodes };
}

function releaseNodeSpend(context: ReservedNodesContext | undefined) {
  if (context?.reservedNodes) {
    useNodesStore.getState().releaseReservedNodes(context.reservedNodes);
  }
}

async function refreshNodesLedger(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() }),
    queryClient.invalidateQueries({ queryKey: nodesKeys.transactionsRoot() }),
  ]);
}

function getUnlockThreadId(input: UnlockContentInput) {
  return typeof input === 'string' ? input : input.threadId;
}

function getUnlockAmount(input: UnlockContentInput) {
  return typeof input === 'string' ? undefined : input.amount;
}

export function useSpendableNodeBalance(wallet?: Pick<Wallet, 'available_balance'> | null) {
  const reservedNodes = useNodesStore((state) => state.reservedNodes);
  return getSpendableNodeBalance(wallet, reservedNodes);
}

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
    onMutate: ({ amount }) => reserveNodeSpend(amount),
    onSettled: async (_data, _error, _variables, context) => {
      try {
        await refreshNodesLedger(queryClient);
      } finally {
        releaseNodeSpend(context);
      }
    },
  });
}

/** Unlock gated content (thread). */
export function useUnlockContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UnlockContentInput) => nodesApi.unlockContent(getUnlockThreadId(input)),
    ...nodesMoneyMutationOptions,
    onMutate: (input) => reserveNodeSpend(getUnlockAmount(input)),
    onSettled: async (_data, _error, _variables, context) => {
      try {
        await refreshNodesLedger(queryClient);
        // Thread data also needs refetch — handled by caller via queryKey invalidation.
      } finally {
        releaseNodeSpend(context);
      }
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
    onMutate: ({ amount }) => reserveNodeSpend(amount),
    onSettled: async (_data, _error, _variables, context) => {
      try {
        await refreshNodesLedger(queryClient);
      } finally {
        releaseNodeSpend(context);
      }
    },
  });
}
