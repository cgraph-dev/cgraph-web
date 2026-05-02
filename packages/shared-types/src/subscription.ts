export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  features: TierFeatures;
}

export interface TierFeatures {
  xpMultiplier: number;
  nodeBonus: number;
  customThemes: boolean;
  exclusiveBadges: boolean;
  exclusiveEffects: boolean;
  prioritySupport: boolean;
  dailyLimits: boolean;
  maxFileSizeMb: number;
  maxGroupsOwned: number;
  customBanner: boolean;
}

/** @deprecated Prefer billing.Invoice */
export interface SubscriptionInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  pdfUrl: string | null;
}

/**
 * @deprecated Use `Invoice` from `./billing` instead.
 */
export type Invoice = SubscriptionInvoice;

export interface CheckoutSession {
  success: boolean;
  checkoutUrl: string;
}

export interface PortalSession {
  success: boolean;
  portalUrl: string;
}

export type IAPPlatform = 'apple' | 'google';

export type IAPValidationStatus = 'valid' | 'expired' | 'refunded' | 'pending';

export interface IAPReceipt {
  platform: IAPPlatform;
  productId: string;
  validationStatus: IAPValidationStatus;
  expiresAt: string | null;
}

export interface IAPValidateResponse {
  success: boolean;
  data?: {
    platform: IAPPlatform;
    product_id: string;
    validation_status: IAPValidationStatus;
    expires_at: string | null;
  };
  error?: string;
}

export interface IAPRestoreResponse {
  success: boolean;
  data?: {
    restored_count: number;
    receipts: IAPReceipt[];
  };
  error?: string;
}

export interface SubscriptionStatusWithIAP extends SubscriptionStatus {
  iapProvider: IAPPlatform | null;
  iapTransactionId: string | null;
}
