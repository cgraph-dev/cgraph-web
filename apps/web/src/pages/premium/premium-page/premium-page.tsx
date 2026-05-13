/**
 * Premium Page - Main Component
 *
 * Displays premium tiers, features, and handles subscription management.
 * Production-ready with three subscription tiers and Stripe integration ready.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { tweens } from '@/lib/animation-presets';
import { FADE_IN, FADE_UP } from '@/lib/animations/transitions';

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
      const planId: Parameters<typeof redirectToCheckout>[0] =
        tierId === 'premium' ? 'premium' : 'enterprise';
      await redirectToCheckout(planId, billingInterval === 'year');
    } catch (error) {
      logger.error('Subscription error:', error);
      toast.error('Subscription failed. Please try again or contact support.');
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="border-primary-500/30 bg-primary-500/20 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2"
            whileHover={{ opacity: 0.9 }}
          >
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            <span className="font-semibold text-primary-400">Unlock Your Potential</span>
          </motion.div>

          <h1 className="mb-4 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Upgrade to Premium
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Get access to exclusive features, unlimited customization, and the best CGraph
            experience.
          </p>

          {/* Node Balance */}
          <motion.div
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/20 px-4 py-2"
            whileHover={{ opacity: 0.9 }}
          >
            <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-yellow-400">
              {(nodeBalance ?? 0).toLocaleString()} Nodes
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/me/wallet/shop')}
              className="ml-2 text-xs"
            >
              Get More
            </Button>
          </motion.div>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div {...FADE_UP} transition={{ delay: 0.1 }} className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-4 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === 'year'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
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

        {/* Feature Comparison Toggle */}
        <motion.div {...FADE_IN} transition={{ delay: 0.5 }} className="mb-8 text-center">
          <button
            onClick={() => {
              setShowFeatureComparison(!showFeatureComparison);
              HapticFeedback.light();
            }}
            className="mx-auto flex items-center gap-2 font-medium text-primary-400 hover:text-primary-300"
          >
            {showFeatureComparison ? 'Hide' : 'Show'} full feature comparison
            <motion.div
              animate={{ rotate: showFeatureComparison ? 180 : 0 }}
              transition={tweens.standard}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.div>
          </button>
        </motion.div>

        {/* Feature Comparison Table */}
        <FeatureComparisonTable isVisible={showFeatureComparison} />

        {/* FAQ Section */}
        <FAQSection />

        {/* Bottom CTA */}
        <motion.div {...FADE_UP} transition={{ delay: 0.7 }} className="mt-16 text-center">
          <GlassCard variant="holographic" glow borderGradient className="inline-block p-8">
            <GiftIcon className="mx-auto mb-4 h-12 w-12 text-primary-400" />
            <h3 className="mb-2 text-xl font-bold text-white">Not ready for Premium?</h3>
            <p className="mb-4 text-gray-400">
              Get nodes to unlock individual features and rewards!
            </p>
            <Button onClick={() => navigate('/me/wallet/shop')}>Explore Node Shop</Button>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
