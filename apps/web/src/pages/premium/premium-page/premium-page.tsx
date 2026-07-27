/**
 * Premium Page - Main Component
 *
 * Displays premium tiers, features, and handles subscription management.
 * Production-ready with free and premium tiers and Stripe integration ready.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, CurrencyDollarIcon, GiftIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import Button from '@/components/ui/button';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useAuthStore } from '@/modules/auth/store';
import { usePremiumStore } from '@/modules/premium/store';
import { useBilling } from '@/modules/premium/hooks';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';

import type { BillingInterval } from './types';
import { PREMIUM_TIERS } from './constants';
import { PricingCard } from './pricing-card';
import { FeatureComparisonTable } from './feature-comparison-table';
import { FAQSection } from './faq-section';

const logger = createLogger('PremiumPage');

/**
 * Premium Page — route-level page component.
 */
export default function PremiumPage() {
  const navigate = useNavigate();
  useAuthStore(); // Ensure user is authenticated
  const [selectedTier, setSelectedTier] = useState<string>('premium');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);

  // Fetch current subscription from backend
  const { currentTier, nodeBalance, fetchBillingStatus } = usePremiumStore();
  const { redirectToCheckout } = useBilling();
  const currentSubscription = currentTier || 'free';

  useEffect(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus]);

  // Handle subscription via real billing service
  async function handleSubscribe(tierId: string) {
    if (tierId === 'free' || tierId === currentSubscription) return;

    setIsSubscribing(true);
    HapticFeedback.medium();

    try {
      await redirectToCheckout('premium', billingInterval === 'year');
    } catch (error) {
      logger.error('Subscription error:', error);
      toast.error('Subscription failed. Please try again or contact support.');
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <div className="cgraph-workspace flex-1 overflow-y-auto">
      <div className="cgraph-content mx-auto max-w-6xl space-y-10 py-10">
        <header className="cgraph-page-header">
          <div className="flex items-start gap-3">
            <div className="cgraph-empty-icon mb-0 h-11 w-11 shrink-0">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="cgraph-eyebrow">Subscription</p>
              <h1 className="text-3xl font-semibold text-[var(--token-text-primary)]">
                Upgrade to Premium
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--token-text-muted)]">
                Unlock expanded groups, customization, uploads, history, and AI features.
              </p>
            </div>
          </div>
          <div className="cgraph-card flex items-center gap-2 px-3 py-2" data-cgraph-material="recessed">
            <CurrencyDollarIcon className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-[var(--token-text-primary)]">
              {(nodeBalance ?? 0).toLocaleString()} Nodes
            </span>
            <Button
              variant="ghost"
              size="sm"
              animated={false}
              onClick={() => navigate('/me/wallet/shop')}
            >
              Get more
            </Button>
          </div>
        </header>

        <div className="flex justify-center">
          <div className="cgraph-segmented">
            <button
              type="button"
              onClick={() => setBillingInterval('month')}
              aria-pressed={billingInterval === 'month'}
              className="px-6 text-sm font-medium"
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('year')}
              aria-pressed={billingInterval === 'year'}
              className="flex items-center gap-2 px-6 text-sm font-medium"
            >
              Yearly
              <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {PREMIUM_TIERS.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              index={index}
              isSelected={selectedTier === tier.id}
              isCurrentPlan={currentSubscription === tier.id}
              isSubscribing={isSubscribing}
              selectedTier={selectedTier}
              billingInterval={billingInterval}
              onSelect={setSelectedTier}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="secondary"
            animated={false}
            onClick={() => {
              setShowFeatureComparison(!showFeatureComparison);
              HapticFeedback.light();
            }}
          >
            {showFeatureComparison ? 'Hide' : 'Show'} full feature comparison
          </Button>
        </div>

        <FeatureComparisonTable isVisible={showFeatureComparison} />
        <FAQSection />

        <div className="text-center">
          <GlassCard className="inline-block max-w-xl p-6" data-cgraph-emphasis="true">
            <GiftIcon className="mx-auto mb-3 h-9 w-9 text-[var(--token-interactive-primary)]" />
            <h2 className="mb-2 text-lg font-semibold text-[var(--token-text-primary)]">
              Not ready for Premium?
            </h2>
            <p className="mb-4 text-sm text-[var(--token-text-muted)]">
              Get nodes to unlock individual features and rewards!
            </p>
            <Button animated={false} onClick={() => navigate('/me/wallet/shop')}>
              Explore Node Shop
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
