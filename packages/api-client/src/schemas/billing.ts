/**
 * Billing schemas.
 */
import { z } from 'zod';

export const BillingStatusSchema = z.object({
  tier: z.enum(['free', 'premium', 'enterprise']),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'none']),
  currentPeriodEnd: z.string().nullable().optional(),
  current_period_end: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  cancel_at_period_end: z.boolean().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  stripe_customer_id: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
});

export type BillingStatus = z.infer<typeof BillingStatusSchema>;

export const PlanInfoSchema = z.object({
  id: z.enum(['free', 'premium', 'enterprise']),
  name: z.string(),
  price: z.number(),
  priceYearly: z.number().optional(),
  price_yearly: z.number().optional(),
  stripePriceId: z.string().nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
  stripePriceIdYearly: z.string().nullable().optional(),
  stripe_price_id_yearly: z.string().nullable().optional(),
});

export type PlanInfo = z.infer<typeof PlanInfoSchema>;

export const BillingCheckoutSessionSchema = z.object({
  sessionId: z.string().optional(),
  session_id: z.string().optional(),
  url: z.string(),
});

export type BillingCheckoutSession = z.infer<typeof BillingCheckoutSessionSchema>;

export const PortalSessionSchema = z.object({
  url: z.string(),
});

export type PortalSession = z.infer<typeof PortalSessionSchema>;

export const InvoiceRecordSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['paid', 'open', 'void', 'uncollectible']),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  pdfUrl: z.string().nullable().optional(),
  pdf_url: z.string().nullable().optional(),
});

export type InvoiceRecord = z.infer<typeof InvoiceRecordSchema>;

export const UpdatePlanResponseSchema = z.object({
  checkout_url: z.string().optional(),
  checkoutUrl: z.string().optional(),
});

export type UpdatePlanResponse = z.infer<typeof UpdatePlanResponseSchema>;

export const CancelSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type CancelSubscriptionResponse = z.infer<typeof CancelSubscriptionResponseSchema>;
