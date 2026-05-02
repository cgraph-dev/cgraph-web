/**
 * Nodes virtual currency — shared type definitions.
 *
 * Mirrors `CGraph.Nodes` from the Elixir backend.
 * Closed-loop economy — no fiat withdrawal.
 *
 */

/** Platform cut percentage on earned transactions (tips, subscriptions). */
export const PLATFORM_CUT_PERCENT = 20 as const;

/** Hold period in days before earned nodes become spendable. */
export const HOLD_DAYS = 21 as const;

/** Minimum tip amount in Nodes */
export const MIN_TIP = 10 as const;

/** Minimum node balance required for account redemption/actions. */
export const MIN_WITHDRAWAL = 500 as const;

/** Display exchange rate: nodes to EUR (informational only — closed-loop economy). */
export const NODES_EXCHANGE_RATE_EUR = 0.01 as const;
/** All possible Node transaction types. */
export type NodeTransactionType =
  | 'purchase'
  | 'tip_received'
  | 'tip_sent'
  | 'content_unlock'
  | 'subscription_received'
  | 'subscription_sent'
  | 'withdrawal'
  | 'cosmetic_purchase';

/** A single Node transaction record. */
export interface NodeTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: NodeTransactionType;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inserted_at: string;
}

/** Node wallet state for a user. */
export interface NodeWallet {
  user_id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earned: number;
}

/** A purchasable Node bundle. */
export interface NodeBundle {
  id: string;
  name: string;
  node_amount: number;
  price_eur: number;
  /** Bonus percentage (e.g. 10 = 10% extra nodes). */
  bonus_percent: number;
  is_active: boolean;
}

/** Context in which a tip was sent. */
export type TipContext = 'dm' | 'profile' | 'forum' | 'post';
