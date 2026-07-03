export type PlanId = 'free' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  priceYearly: number;
  highlighted?: boolean;
  badge?: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Core community features for getting started.',
    price: 0,
    priceYearly: 0,
    features: ['Community access', 'Basic profile customization', 'Public forums'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Expanded customization, storage, and creator tools.',
    price: 9.99,
    priceYearly: 99.9,
    highlighted: true,
    badge: 'Popular',
    features: ['Premium identity items', 'Expanded media storage', 'Priority support'],
  },
];
