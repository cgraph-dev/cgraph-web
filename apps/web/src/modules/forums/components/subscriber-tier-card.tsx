/**
 * SubscriberTierCard — 3-tier comparison card for forum subscriptions.
 *
 * Displays tier name, monthly/yearly pricing toggle, feature list with
 * checkmarks, perks section, and subscribe button with current-plan state.
 *
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon, BoltIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
interface TierPerks {
  readonly flair_text?: string;
  readonly flair_color?: string;
  readonly boost_discount_percent?: number;
  readonly early_access_hours?: number;
  readonly locked_board_ids?: string[];
}

interface TierData {
  readonly id: string;
  readonly name: string;
  readonly monthly_price_nodes: number;
  readonly yearly_price_nodes?: number;
  readonly features: string[];
  readonly perks: TierPerks;
}

interface SubscriberTierCardProps {
  readonly tier: TierData;
  readonly isCurrentTier?: boolean;
  readonly isRecommended?: boolean;
  readonly onSubscribe?: (tierId: string) => void;
  readonly isSubscribing?: boolean;
}
/** Subscriber Tier Card. */
export function SubscriberTierCard({
  tier,
  isCurrentTier = false,
  isRecommended = false,
  onSubscribe,
  isSubscribing = false,
}: SubscriberTierCardProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const hasYearly = tier.yearly_price_nodes != null && tier.yearly_price_nodes > 0;
  const displayPrice =
    billingPeriod === 'yearly' && hasYearly ? tier.yearly_price_nodes : tier.monthly_price_nodes;

  const yearlyMonthlyCost =
    hasYearly && tier.yearly_price_nodes != null ? Math.round(tier.yearly_price_nodes / 12) : null;

  const hasFlair = !!tier.perks.flair_text;
  const hasBoostDiscount =
    tier.perks.boost_discount_percent != null && tier.perks.boost_discount_percent > 0;
  const hasEarlyAccess = tier.perks.early_access_hours != null && tier.perks.early_access_hours > 0;
  const hasLockedBoards =
    tier.perks.locked_board_ids != null && tier.perks.locked_board_ids.length > 0;
  const hasPerks = hasFlair || hasBoostDiscount || hasEarlyAccess || hasLockedBoards;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border p-5',
        isRecommended
          ? 'border-primary-500/50 from-primary-500/10 shadow-primary-500/10 bg-gradient-to-b to-[var(--token-bg-secondary)] shadow-lg'
          : 'border-[var(--token-card-border)] bg-[var(--token-bg-secondary)]'
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-primary-600 px-3 py-1 text-[10px] font-bold text-white">
          Popular
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-lg font-bold text-white">{tier.name}</h3>

      {/* Price */}
      <div className="mt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{displayPrice}</span>
          <span className="text-sm text-white/40">Nodes</span>
          <span className="text-xs text-white/30">
            / {billingPeriod === 'yearly' ? 'year' : 'month'}
          </span>
        </div>
        {billingPeriod === 'yearly' && yearlyMonthlyCost != null && (
          <p className="mt-0.5 text-xs text-white/30">~{yearlyMonthlyCost} Nodes/month</p>
        )}
      </div>

      {/* Billing toggle */}
      {hasYearly && (
        <div className="mt-3 flex gap-1 rounded-lg bg-[var(--token-bg-primary)] p-0.5">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
              billingPeriod === 'monthly'
                ? 'bg-[var(--token-bg-secondary)] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              'flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
              billingPeriod === 'yearly'
                ? 'bg-[var(--token-bg-secondary)] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Yearly
          </button>
        </div>
      )}

      {/* Features */}
      {tier.features.length > 0 && (
        <ul className="mt-5 flex-1 space-y-2">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
              <span className="text-sm text-white/70">{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Perks */}
      {hasPerks && (
        <div className="mt-4 space-y-2 border-t border-[var(--token-card-border)] pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Perks
          </span>

          {hasFlair && (
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-white/60">Flair:</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${tier.perks.flair_color ?? '#6366f1'}30`,
                  color: tier.perks.flair_color ?? '#6366f1',
                }}
              >
                {tier.perks.flair_text}
              </span>
            </div>
          )}

          {hasBoostDiscount && (
            <div className="flex items-center gap-2">
              <BoltIcon className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-white/60">
                {tier.perks.boost_discount_percent}% boost discount
              </span>
            </div>
          )}

          {hasEarlyAccess && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs text-white/60">
                {tier.perks.early_access_hours}h early access
              </span>
            </div>
          )}

          {hasLockedBoards && (
            <div className="flex items-center gap-2">
              <CheckIcon className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-white/60">
                Access to {tier.perks.locked_board_ids?.length ?? 0} exclusive{' '}
                {tier.perks.locked_board_ids?.length === 1 ? 'board' : 'boards'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Subscribe button */}
      <button
        type="button"
        disabled={isCurrentTier || isSubscribing}
        onClick={() => onSubscribe?.(tier.id)}
        className={cn(
          'mt-5 w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
          isCurrentTier
            ? 'cursor-default bg-green-500/15 text-green-400'
            : isRecommended
              ? 'bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50'
              : 'bg-[var(--token-bg-primary)] text-white hover:bg-white/10 disabled:opacity-50'
        )}
      >
        {isCurrentTier ? 'Current Plan' : isSubscribing ? 'Subscribing...' : 'Subscribe'}
      </button>
    </motion.div>
  );
}

export default SubscriberTierCard;
