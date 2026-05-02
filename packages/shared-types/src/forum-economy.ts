/**
 * Forum Economy Types — Thread promotions, creator shelf, content bundles, subscriber perks.
 *
 * Shared across web and mobile apps for Phases 13-15.
 *
 */
export type PromotionType = 'boost' | 'highlight' | 'spotlight' | 'bump';

export interface ThreadPromotion {
  id: string;
  thread_id: string;
  promoter_id: string;
  forum_id: string;
  promotion_type: PromotionType;
  price_paid: number;
  duration_hours: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ForumPromotionSettings {
  id: string;
  forum_id: string;
  promotion_type: PromotionType;
  enabled: boolean;
  price_per_hour: number;
  max_concurrent: number;
  cooldown_hours: number;
}
export interface CreatorShelfItem {
  id: string;
  forum_id: string;
  thread_id: string;
  position: number;
  featured_at: string;
  thread: {
    id: string;
    title: string;
    author: { id: string; display_name: string; avatar_url?: string };
    price_nodes?: number;
  };
}
export interface ContentBundle {
  id: string;
  forum_id: string;
  creator_id: string;
  name: string;
  description?: string;
  price_nodes: number;
  thread_ids: string[];
  individual_total: number;
  is_active: boolean;
  purchase_count: number;
}

export interface BundlePurchase {
  id: string;
  user_id: string;
  bundle_id: string;
  price_paid: number;
  inserted_at: string;
}
export interface SubscriberPerks {
  locked_board_ids?: string[];
  flair_text?: string;
  flair_color?: string;
  boost_discount_percent?: number;
  early_access_hours?: number;
}

export interface ForumSubscriptionTier {
  id: string;
  forum_id: string;
  name: string;
  monthly_price_nodes: number;
  yearly_price_nodes?: number;
  features: string[];
  perks: SubscriberPerks;
}

export interface ForumSubscription {
  id: string;
  user_id: string;
  forum_id: string;
  tier_id: string;
  subscribed_at: string;
  expires_at: string;
  auto_renew: boolean;
  is_active: boolean;
  tier?: ForumSubscriptionTier;
}
