/**
 * BundleCard — displays a content bundle with savings percentage.
 *
 * Shows bundle name, thread count, price comparison with strikethrough,
 * savings badge, and purchase state.
 *
 */

import { motion } from 'motion/react';
import { RectangleStackIcon, CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
interface BundleData {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price_nodes: number;
  readonly individual_total: number;
  readonly thread_count: number;
  readonly purchase_count: number;
  readonly is_purchased?: boolean;
}

interface BundleCardProps {
  readonly bundle: BundleData;
  readonly onPurchase?: (bundleId: string) => void;
  readonly isPurchasing?: boolean;
}
function calculateSavingsPercent(individual: number, bundled: number): number {
  if (individual <= 0) return 0;
  return Math.round(((individual - bundled) / individual) * 100);
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
/** Bundle Card. */
export function BundleCard({ bundle, onPurchase, isPurchasing = false }: BundleCardProps) {
  const savings = calculateSavingsPercent(bundle.individual_total, bundle.price_nodes);
  const isPurchased = bundle.is_purchased === true;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}
      className="relative overflow-hidden rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-5"
    >
      {/* Savings badge */}
      {savings > 0 && (
        <div className="absolute right-3 top-3 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">
          Save {savings}%
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="bg-primary-500/15 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
          <RectangleStackIcon className="h-5 w-5 text-primary-400" />
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <h3 className="text-sm font-bold text-white">{bundle.name}</h3>
          <span className="text-xs text-white/40">
            {bundle.thread_count} {bundle.thread_count === 1 ? 'thread' : 'threads'}
          </span>
        </div>
      </div>

      {/* Description */}
      {bundle.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/50">
          {bundle.description}
        </p>
      )}

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-2">
        {bundle.individual_total > bundle.price_nodes && (
          <span className="text-sm text-white/30 line-through">
            {bundle.individual_total} Nodes
          </span>
        )}
        <span className="text-lg font-bold text-white">{bundle.price_nodes} Nodes</span>
      </div>

      {/* Purchase count */}
      <div className="mt-2 flex items-center gap-1 text-[11px] text-white/30">
        <UserGroupIcon className="h-3.5 w-3.5" />
        <span>{formatCount(bundle.purchase_count)} unlocked</span>
      </div>

      {/* Purchase button */}
      <button
        type="button"
        disabled={isPurchased || isPurchasing}
        onClick={() => onPurchase?.(bundle.id)}
        className={cn(
          'mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors',
          isPurchased
            ? 'cursor-default bg-green-500/15 text-green-400'
            : 'bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50'
        )}
      >
        {isPurchased ? (
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4" />
            Purchased
          </span>
        ) : isPurchasing ? (
          'Purchasing...'
        ) : (
          `Purchase for ${bundle.price_nodes} Nodes`
        )}
      </button>
    </motion.div>
  );
}

export default BundleCard;
