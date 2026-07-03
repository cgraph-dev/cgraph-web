/**
 * Stripe Configuration & Provider
 *
 * This module provides Stripe integration for CGraph's payment system.
 * It wraps the application with the Stripe Elements provider.
 *
 */

/**
 * Subscription plan types
 */
export type PlanId = 'free' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceYearly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Available subscription plans
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    description: 'Perfect for getting started',
    features: [
      'Up to 10 group chats',
      '5 direct messages per day',
      '100 messages per day',
      'Basic file sharing (10MB)',
      'Standard support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceYearly: 99,
    description: 'Unlock all essential features',
    features: [
      'Unlimited group chats',
      'Unlimited messages',
      'File sharing up to 500MB',
      'Voice & video calls',
      'Custom themes & emoji packs',
      'Screen sharing',
      'Advanced analytics',
      'Priority support',
    ],
    highlighted: true,
    badge: 'Popular',
  },
];
