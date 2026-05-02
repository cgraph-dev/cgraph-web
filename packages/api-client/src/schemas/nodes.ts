import { z } from 'zod';

export const WalletSchema = z.object({
  user_id: z.string().optional(),
  available_balance: z.number(),
  pending_balance: z.number(),
  lifetime_earned: z.number(),
  lifetime_spent: z.number().optional(),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  type: z.string(),
  amount: z.number(),
  reference_id: z.string().nullish(),
  reference_type: z.string().nullish(),
  description: z.string().nullish(),
  platform_cut: z.number().nullable().optional(),
  net_amount: z.number().nullable().optional(),
  metadata: z.record(z.unknown()).nullish(),
  inserted_at: z.string(),
  created_at: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const BundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  node_amount: z.number().optional(),
  nodes: z.number().optional(),
  price_eur: z.number().optional(),
  price: z.number().optional(),
  bonus_percent: z.number(),
  popular: z.boolean().optional(),
  is_active: z.boolean(),
});

export type Bundle = z.infer<typeof BundleSchema>;

export const CheckoutResponseSchema = z.object({
  checkout_url: z.string().optional(),
  session_id: z.string().optional(),
  url: z.string().optional(),
});

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

export const GiftResultSchema = z.object({
  id: z.string(),
  amount: z.number(),
  recipient_id: z.string(),
  message: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type GiftResult = z.infer<typeof GiftResultSchema>;
