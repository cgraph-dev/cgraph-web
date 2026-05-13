/**
 * Bundle card component — displays a node bundle for purchase.
 */
import { cn } from '@/lib/utils';
import type { Bundle } from '@cgraph/api-client';

interface BundleCardProps {
  bundle: Bundle;
  onBuy: (bundleId: string) => void;
  isLoading?: boolean;
}

/** Description. */
/** Bundle Card component. */
export function BundleCard({ bundle, onBuy, isLoading }: BundleCardProps) {
  const nodeAmount = bundle.nodes ?? bundle.node_amount ?? 0;
  const bundlePrice = bundle.price ?? bundle.price_eur ?? 0;
  const isPopular = bundle.popular ?? false;

  return (
    <div
      className={cn(
        'relative flex h-full flex-col items-center rounded-2xl border p-6 backdrop-blur-sm transition-all duration-500',
        isPopular
          ? 'border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_5%,transparent)] shadow-[0_8px_32px_rgba(0,0,0,0.4),color-mix(in_srgb,var(--color-brand-purple)_5%,transparent)_0px_0px_20px]'
          : 'border-[var(--token-card-border)] bg-[var(--token-bg-primary)] hover:border-[var(--token-border-muted)] hover:bg-[var(--token-bg-secondary)]'
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20">
          Most Popular
        </span>
      )}

      <h3 className="mt-2 text-lg font-bold text-white/90">{bundle.name}</h3>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-[var(--color-brand-purple)] opacity-60">
          {'\u2115'}
        </span>
        <span className="text-4xl font-extrabold tracking-tight text-zinc-50">
          {nodeAmount.toLocaleString()}
        </span>
      </div>

      {bundle.bonus_percent > 0 && (
        <span className="mt-3 rounded-full border border-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] px-3 py-0.5 text-[10px] font-bold text-[var(--color-brand-purple)]">
          +{bundle.bonus_percent}% BONUS
        </span>
      )}

      <p className="mt-auto pt-6 text-xl font-bold text-white/40">€{bundlePrice.toFixed(2)}</p>

      <button
        type="button"
        onClick={() => onBuy(bundle.id)}
        disabled={isLoading}
        className={cn(
          'group relative mt-4 w-full overflow-hidden rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-300 active:scale-[0.98]',
          bundle.popular
            ? 'border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] text-[var(--color-brand-purple)] shadow-lg shadow-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)]'
            : 'border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-white/90 shadow-xl hover:border-[var(--token-card-border)] hover:bg-[var(--token-card-bg)]',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            'Purchase'
          )}
        </span>
      </button>
    </div>
  );
}
