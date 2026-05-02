export interface NodeBundle {
  id: string;
  nodes: number;
  price_cents: number;
  label: string;
  bonus: string | null;
}

export interface NodeCheckoutSession {
  checkout_url: string;
}

export interface NodePurchaseRecord {
  id: string;
  bundle_id: string;
  nodes_awarded: number;
  price_cents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  fulfilled_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  amount_due: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: string;
  hosted_invoice_url: string;
  invoice_pdf: string;
  description: string | null;
}

export interface BillingStatus {
  tier: 'free' | 'premium' | 'enterprise';
  subscription_active: boolean;
  next_billing_date: string | null;
  auto_renewing: boolean;
  payment_method: { last4: string; brand: string } | null;
  provider: 'stripe' | 'apple' | 'google' | null;
}

export interface PlanChangeRequest {
  plan_id: string;
  yearly?: boolean;
}

export interface PlanChangeResponse {
  checkout_url: string;
}
