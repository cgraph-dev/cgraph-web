/**
 * Premium Stores
 *
 * Zustand stores for premium state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { safeRedirect } from '@/lib/security';
import { billingService } from '@/services/billing';
import type { SubscriptionTier, PurchaseHistory } from './types';

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  pdfUrl: string | null;
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

export interface PremiumState {
  // Subscription
  isSubscribed: boolean;
  currentTier: SubscriptionTier | null;
  subscribedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  features: TierFeatures | null;

  // Nodes
  nodeBalance: number;

  // Purchase history
  purchaseHistory: PurchaseHistory[];

  // Invoices
  invoices: Invoice[];

  // Portal
  portalUrl: string | null;

  // Loading
  isLoading: boolean;

  // Actions
  fetchBillingStatus: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  setSubscription: (tier: SubscriptionTier, expiresAt: string) => void;
  cancelSubscription: () => void;
  openBillingPortal: () => Promise<void>;
  subscribe: (tier: SubscriptionTier) => Promise<void>;
  addNodes: (amount: number) => void;
  spendNodes: (amount: number) => boolean;
  addPurchase: (purchase: PurchaseHistory) => void;

  // Computed
  getRemainingDays: () => number | null;
  canAfford: (price: number) => boolean;
  reset: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      currentTier: null,
      subscribedAt: null,
      expiresAt: null,
      status: 'none',
      cancelAtPeriodEnd: false,
      graceUntil: null,
      features: null,
      nodeBalance: 0,
      purchaseHistory: [],
      invoices: [],
      portalUrl: null,
      isLoading: false,

      // Sync from backend billing API
      fetchBillingStatus: async () => {
        set({ isLoading: true });
        try {
          const billing = await billingService.getStatus();
          const tier: SubscriptionTier | null = billing.tier === 'free' ? null : billing.tier;
          set({
            isSubscribed: billing.status === 'active' || billing.status === 'trialing',
            currentTier: tier,
            expiresAt: billing.currentPeriodEnd ?? billing.current_period_end ?? null,
            status: billing.status,
            cancelAtPeriodEnd: billing.cancelAtPeriodEnd ?? billing.cancel_at_period_end ?? false,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      // Fetch invoice history
      fetchInvoices: async () => {
        try {
          const invoices = await billingService.getInvoices();
          set({
            invoices: invoices.map((inv) => ({
              ...inv,
              createdAt: inv.createdAt ?? inv.created_at ?? new Date().toISOString(),
              pdfUrl: inv.pdfUrl ?? inv.pdf_url ?? null,
            })),
          });
        } catch {
          // Silently fail — invoices are non-critical
        }
      },

      // Subscribe to a tier via Stripe Checkout redirect
      subscribe: async (tier: SubscriptionTier) => {
        const session = await billingService.createCheckout(tier);
        if (session.url) safeRedirect(session.url);
      },

      // Open Stripe Billing Portal
      openBillingPortal: async () => {
        const portal = await billingService.createPortal();
        if (portal.url) safeRedirect(portal.url);
      },

      // Actions
      setSubscription: (tier, expiresAt) => {
        set({
          isSubscribed: true,
          currentTier: tier,
          subscribedAt: new Date().toISOString(),
          expiresAt,
        });
      },

      cancelSubscription: () => {
        set({
          isSubscribed: false,
          currentTier: null,
          subscribedAt: null,
          expiresAt: null,
          cancelAtPeriodEnd: false,
        });
      },

      addNodes: (amount) => {
        set((state) => ({
          nodeBalance: state.nodeBalance + amount,
        }));
      },

      spendNodes: (amount) => {
        const state = get();
        if (state.nodeBalance >= amount) {
          set({ nodeBalance: state.nodeBalance - amount });
          return true;
        }
        return false;
      },

      addPurchase: (purchase) => {
        const MAX_PURCHASE_HISTORY = 500;
        set((state) => ({
          purchaseHistory: [purchase, ...state.purchaseHistory].slice(0, MAX_PURCHASE_HISTORY),
        }));
      },

      // Computed
      getRemainingDays: () => {
        const state = get();
        if (!state.expiresAt) return null;
        const expires = new Date(state.expiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },

      canAfford: (price) => {
        return get().nodeBalance >= price;
      },
      reset: () =>
        set({
          isSubscribed: false,
          currentTier: null,
          subscribedAt: null,
          expiresAt: null,
          status: 'none',
          cancelAtPeriodEnd: false,
          graceUntil: null,
          features: null,
          nodeBalance: 0,
          purchaseHistory: [],
          invoices: [],
          portalUrl: null,
          isLoading: false,
        }),
    }),
    {
      name: 'cgraph-premium',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
