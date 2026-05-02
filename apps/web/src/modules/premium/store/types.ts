/**
 * Premium Types
 */

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface NodePackage {
  id: string;
  name: string;
  nodes: number;
  bonusNodes: number;
  price: number;
  currency: string;
  isPopular: boolean;
}

export interface PurchaseHistory {
  id: string;
  type: 'subscription' | 'nodes' | 'item';
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  createdAt: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxGroups: number;
  maxForums: number;
  maxFileSize: number; // in MB
  maxStorageGB: number;
  customThemes: boolean;
  prioritySupport: boolean;
  noAds: boolean;
}
