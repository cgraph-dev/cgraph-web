import { api } from '@/lib/api';
import { safeRedirect } from '@/lib/security';
import type { PlanId } from '@/lib/stripe';

export type BillingStatusValue =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'none';

export interface BillingStatus {
  tier: PlanId;
  status: BillingStatusValue;
  currentPeriodEnd?: string | null;
  current_period_end?: string | null;
  cancelAtPeriodEnd?: boolean;
  cancel_at_period_end?: boolean;
  stripeCustomerId?: string | null;
  stripe_customer_id?: string | null;
  stripeSubscriptionId?: string | null;
  stripe_subscription_id?: string | null;
}

export interface BillingPlan {
  id: PlanId;
  name: string;
  price: number;
  priceYearly?: number;
  price_yearly?: number;
  stripePriceId?: string | null;
  stripe_price_id?: string | null;
  stripePriceIdYearly?: string | null;
  stripe_price_id_yearly?: string | null;
}

export interface CheckoutSession {
  sessionId?: string;
  session_id?: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface InvoiceRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt?: string;
  created_at?: string;
  pdfUrl?: string | null;
  pdf_url?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const PLAN_IDS: PlanId[] = ['free', 'premium'];
const BILLING_STATUSES: BillingStatusValue[] = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'none',
];
const INVOICE_STATUSES: InvoiceRecord['status'][] = ['paid', 'open', 'void', 'uncollectible'];

function isPlanId(value: unknown): value is PlanId {
  return PLAN_IDS.some((planId) => planId === value);
}

function isBillingStatusValue(value: unknown): value is BillingStatusValue {
  return BILLING_STATUSES.some((status) => status === value);
}

function isInvoiceStatus(value: unknown): value is InvoiceRecord['status'] {
  return INVOICE_STATUSES.some((status) => status === value);
}

function isBillingStatus(value: unknown): value is BillingStatus {
  return isRecord(value) && isPlanId(value.tier) && isBillingStatusValue(value.status);
}

function isBillingPlan(value: unknown): value is BillingPlan {
  return (
    isRecord(value) &&
    isPlanId(value.id) &&
    typeof value.name === 'string' &&
    typeof value.price === 'number'
  );
}

function isInvoiceRecord(value: unknown): value is InvoiceRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.currency === 'string' &&
    isInvoiceStatus(value.status)
  );
}

function isCheckoutSession(value: unknown): value is CheckoutSession {
  return isRecord(value) && typeof value.url === 'string';
}

function isPortalSession(value: unknown): value is PortalSession {
  return isRecord(value) && typeof value.url === 'string';
}

function ensureResponse<T>(
  value: unknown,
  guard: (candidate: unknown) => candidate is T,
  label: string
): T {
  if (guard(value)) {
    return value;
  }

  throw new Error(`Invalid billing API response for ${label}`);
}

function unwrapData(response: { data: unknown }): unknown {
  const body = response.data;
  if (isRecord(body) && 'data' in body) {
    return body.data;
  }
  return body;
}

export const billingService = {
  async getStatus(): Promise<BillingStatus> {
    return ensureResponse(
      unwrapData(await api.get('/api/v1/billing/status')),
      isBillingStatus,
      'status'
    );
  },

  async getPlans(): Promise<BillingPlan[]> {
    return ensureResponse(
      unwrapData(await api.get('/api/v1/billing/plans')),
      (value): value is BillingPlan[] => Array.isArray(value) && value.every(isBillingPlan),
      'plans'
    );
  },

  async getInvoices(): Promise<InvoiceRecord[]> {
    return ensureResponse(
      unwrapData(await api.get('/api/v1/billing/invoices')),
      (value): value is InvoiceRecord[] => Array.isArray(value) && value.every(isInvoiceRecord),
      'invoices'
    );
  },

  async createCheckout(planId: PlanId, yearly = false): Promise<CheckoutSession> {
    return ensureResponse(
      unwrapData(await api.post('/api/v1/billing/checkout', { plan_id: planId, yearly })),
      isCheckoutSession,
      'checkout'
    );
  },

  async createPortal(): Promise<PortalSession> {
    return ensureResponse(
      unwrapData(await api.post('/api/v1/billing/portal')),
      isPortalSession,
      'portal'
    );
  },

  async redirectToCheckout(planId: PlanId, yearly = false): Promise<void> {
    const session = await this.createCheckout(planId, yearly);
    safeRedirect(session.url);
  },

  async redirectToPortal(): Promise<void> {
    const portal = await this.createPortal();
    safeRedirect(portal.url);
  },
};
