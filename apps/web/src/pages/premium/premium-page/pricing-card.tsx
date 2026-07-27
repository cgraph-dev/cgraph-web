/**
 * Pricing Card Component
 *
 * Individual pricing tier card with features and CTA button.
 */

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components/ui/button';
import type { PremiumTier, BillingInterval } from './types';
import { getPrice, getYearlyTotal } from './utils';

interface PricingCardProps {
  tier: PremiumTier;
  index: number;
  isSelected: boolean;
  isCurrentPlan: boolean;
  isSubscribing: boolean;
  selectedTier: string;
  billingInterval: BillingInterval;
  onSelect: (tierId: string) => void;
  onSubscribe: (tierId: string) => void;
}

/**
 */
/**
 * Pricing Card display component.
 */
export function PricingCard({
  tier,
  index: _index,
  isSelected,
  isCurrentPlan,
  isSubscribing,
  selectedTier,
  billingInterval,
  onSelect,
  onSubscribe,
}: PricingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tier.id)}
      aria-pressed={isSelected}
      className="h-full text-left focus:outline-none"
    >
      <GlassCard
        className={`relative h-full overflow-hidden p-6 ${
          isSelected ? 'ring-2 ring-[var(--token-focus-ring)]' : ''
        }`}
        data-cgraph-emphasis={tier.popular || undefined}
      >
        {tier.popular && (
          <span className="absolute right-4 top-4 rounded-md border border-[var(--token-border-default)] bg-[var(--token-interactive-primary)] px-2 py-1 text-xs font-semibold text-[var(--token-text-inverse)]">
            Most popular
          </span>
        )}

        {isCurrentPlan && (
          <span className="absolute left-4 top-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">
            Current plan
          </span>
        )}

        <div className="mb-4 mt-8 flex items-center gap-3">
          <div className="cgraph-empty-icon mb-0 h-11 w-11 shrink-0">{tier.icon}</div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--token-text-primary)]">{tier.name}</h3>
            <p className="text-sm text-[var(--token-text-muted)]">{tier.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold text-[var(--token-text-primary)]">
              ${getPrice(tier, billingInterval)}
            </span>
            {tier.price > 0 && (
              <span className="text-[var(--token-text-muted)]">
                /{billingInterval === 'year' ? 'year' : 'month'}
              </span>
            )}
          </div>
          {billingInterval === 'year' && tier.price > 0 && (
            <p className="mt-1 text-sm text-green-400">${getYearlyTotal(tier)} billed annually</p>
          )}
        </div>

        <ul className="mb-6 space-y-3">
          {tier.features.slice(0, 8).map((feature) => (
            <li key={feature.name} className="flex items-center gap-2">
              {feature.included ? (
                <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-400" />
              ) : (
                <XMarkIcon className="h-5 w-5 flex-shrink-0 text-[var(--token-text-disabled)]" />
              )}
              <span
                className={
                  feature.included
                    ? 'text-[var(--token-text-secondary)]'
                    : 'text-[var(--token-text-disabled)]'
                }
              >
                {feature.name}
                {feature.detail && (
                  <span className="ml-1 text-xs text-[var(--token-text-muted)]">
                    ({feature.detail})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <Button
          variant={tier.popular ? 'primary' : 'secondary'}
          fullWidth
          animated={false}
          onClick={(e) => {
            e.stopPropagation();
            onSubscribe(tier.id);
          }}
          disabled={isCurrentPlan || isSubscribing}
          isLoading={isSubscribing && selectedTier === tier.id}
        >
          {isCurrentPlan ? (
            'Current Plan'
          ) : tier.id === 'free' ? (
            'Free Forever'
          ) : (
            `Get ${tier.name}`
          )}
        </Button>
      </GlassCard>
    </button>
  );
}
