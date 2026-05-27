/**
 * Nodes Shop Page — /nodes/shop
 *
 * Displays purchasable node bundles and current balance.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useNodeWallet, useNodeBundles, useCreateCheckout } from '@/modules/nodes/hooks/useNodes';
import { BundleCard } from '@/modules/nodes/components/bundle-card';
import { NodesErrorState } from '@/modules/nodes/components/nodes-error-state';
import { resetApiCircuitBreaker } from '@/lib/api';

/** Description. */
/** Nodes Shop Page component. */
export function NodesShopPage(): React.ReactElement {
  const {
    data: wallet,
    error: walletError,
    isError: isWalletError,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useNodeWallet();
  const {
    data: bundles,
    error: bundlesError,
    isError: isBundlesError,
    isLoading,
    refetch: refetchBundles,
  } = useNodeBundles();
  const checkout = useCreateCheckout();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Get Nodes</h1>
          <p className="mt-1 text-sm text-zinc-400">Power tips, unlocks, and more with Nodes.</p>
        </div>
        <Link
          to="/me/wallet"
          className="text-sm font-semibold text-[var(--color-brand-purple)] transition-colors hover:text-[var(--color-brand-purple)]"
        >
          ← Wallet
        </Link>
      </div>

      {/* Current Balance */}
      {walletLoading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-sm text-zinc-400">
          Loading balance…
        </div>
      ) : isWalletError ? (
        <NodesErrorState
          title="Balance unavailable"
          error={walletError}
          className="py-3"
          onRetry={() => {
            resetApiCircuitBreaker();
            void refetchWallet();
          }}
        />
      ) : wallet ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
          <span className="text-sm text-zinc-400">Your balance: </span>
          <span className="font-bold text-zinc-100">
            {'\u2115'} {wallet.available_balance.toLocaleString()}
          </span>
        </div>
      ) : null}

      {/* Bundle Grid */}
      {isBundlesError ? (
        <NodesErrorState
          title="Shop unavailable"
          error={bundlesError}
          onRetry={() => {
            resetApiCircuitBreaker();
            void refetchBundles();
          }}
        />
      ) : bundles?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onBuy={(id) => checkout.mutate(id)}
              isLoading={checkout.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-400">
          No Node bundles are available right now.
        </div>
      )}

      {/* Info */}
      <p className="text-center text-xs text-zinc-500">
        Payments are processed securely via Stripe. Nodes are non-refundable.
      </p>
    </div>
  );
}

export default NodesShopPage;
