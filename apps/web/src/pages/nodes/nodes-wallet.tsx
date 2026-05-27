/**
 * Nodes Wallet Page — /nodes
 *
 * Shows balance and transaction history.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNodeWallet, useNodeTransactions } from '@/modules/nodes/hooks/useNodes';
import { TransactionRow } from '@/modules/nodes/components/transaction-row';
import { NodesErrorState } from '@/modules/nodes/components/nodes-error-state';
import { resetApiCircuitBreaker } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/modules/nodes/types';

const filterTabs: Array<{ label: string; value: TransactionType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Tips', value: 'tip_sent' },
  { label: 'Received', value: 'tip_received' },
  { label: 'Unlocks', value: 'content_unlock' },
];

/** Description. */
/** Nodes Wallet Page component. */
export function NodesWalletPage(): React.ReactElement {
  const [activeFilter, setActiveFilter] = useState<TransactionType | undefined>(undefined);

  const {
    data: wallet,
    error: walletError,
    isError: isWalletError,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useNodeWallet();
  const {
    data: transactions,
    error: transactionsError,
    isError: isTransactionsError,
    isLoading: txLoading,
    refetch: refetchTransactions,
  } = useNodeTransactions(activeFilter);

  if (walletLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (isWalletError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <NodesErrorState
          title="Wallet unavailable"
          error={walletError}
          onRetry={() => {
            resetApiCircuitBreaker();
            void refetchWallet();
          }}
        />
      </div>
    );
  }

  const available = wallet?.available_balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Balance Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
        <p className="text-sm font-medium text-zinc-400">Available Balance</p>
        <p className="mt-1 text-4xl font-extrabold text-zinc-50">
          {'\u2115'} {available.toLocaleString()}
        </p>
        {pending > 0 && (
          <p className="mt-1 text-sm text-zinc-500">
            Pending: {'\u2115'} {pending.toLocaleString()}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/me/wallet/shop"
            className="rounded-xl border border-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-brand-purple)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] active:scale-[0.98]"
          >
            Get Nodes
          </Link>
        </div>
      </div>

      {/* Lifetime Stats */}
      {wallet && (
        <div className="flex justify-center gap-6 text-xs text-zinc-500">
          <span>
            Earned: {'\u2115'} {wallet.lifetime_earned.toLocaleString()}
          </span>
          <span>·</span>
          <span>
            Spent: {'\u2115'} {(wallet.lifetime_spent ?? 0).toLocaleString()}
          </span>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Transaction History</h2>

        {/* Filter Tabs */}
        <div className="mt-3 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-300 active:scale-95',
                activeFilter === tab.value
                  ? 'border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] text-[var(--color-brand-purple)] shadow-[0_0_15px_color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)]'
                  : 'border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] text-white/40 hover:border-[var(--token-border-muted)] hover:bg-white/10 hover:text-white/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="mt-4 space-y-2">
          {isTransactionsError ? (
            <NodesErrorState
              title="Transaction history unavailable"
              error={transactionsError}
              onRetry={() => {
                resetApiCircuitBreaker();
                void refetchTransactions();
              }}
            />
          ) : txLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : !transactions?.length ? (
            <p className="py-8 text-center text-sm text-zinc-500">No transactions yet</p>
          ) : (
            transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default NodesWalletPage;
