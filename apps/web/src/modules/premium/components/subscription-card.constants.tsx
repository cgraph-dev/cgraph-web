/**
 * Subscription Card Constants
 *
 * Tier-level visual configuration: icons, colors, and gradients
 * used by SubscriptionCard and its sub-components.
 */

import React from 'react';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { SubscriptionTier } from '@/modules/premium/store/types';

export const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <StarIcon className="h-6 w-6" />,
  premium: <SparklesIcon className="h-6 w-6" />,
};

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'gray',
  premium: 'purple',
};

export const TIER_GRADIENTS: Record<SubscriptionTier, string> = {
  free: 'from-gray-500 to-gray-600',
  premium: 'from-purple-500 to-pink-500',
};
