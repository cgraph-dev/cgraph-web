/**
 * Premium tier configuration for theme gating.
 */
import { StarIcon } from '@heroicons/react/24/solid';

export const tierHierarchy = {
  free: 0,
  premium: 1,
} as const;

export const tierConfig = {
  free: {
    label: 'Free',
    color: 'text-gray-400',
    bgColor: 'bg-gray-700',
    borderColor: 'border-gray-600',
    icon: null,
  },
  premium: {
    label: 'Premium',
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-r from-amber-600 to-amber-500',
    borderColor: 'border-amber-500',
    icon: StarIcon,
  },
} as const;

export type PremiumTier = 'free' | 'premium';
