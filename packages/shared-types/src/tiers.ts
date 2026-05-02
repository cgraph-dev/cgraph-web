/** UI displays premium as "PRO" in compact badges — data model always uses 'premium'. */
export type TierName = 'free' | 'premium' | 'enterprise';

export type SupportLevel = 'community' | 'priority' | 'dedicated';

export const TIER_ORDER: Record<TierName, number> = {
  free: 0,
  premium: 1,
  enterprise: 2,
};

export const TIER_LIMITS: Record<
  TierName,
  { maxForums: number | null; maxStorageBytes: number | null }
> = {
  free: { maxForums: 1, maxStorageBytes: 100 * 1024 * 1024 }, // 100MB
  premium: { maxForums: 5, maxStorageBytes: 5 * 1024 * 1024 * 1024 }, // 5GB
  enterprise: { maxForums: null, maxStorageBytes: null }, // Unlimited
};

export interface TierBasic {
  id: string;
  tier: TierName;
  display_name: string;
  description: string | null;
  position: number;
  badge_color: string | null;
  badge_icon: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number;
}

export interface ForumLimits {
  max_owned: number | null;
  max_joined: number | null;
  max_boards: number | null;
  max_threads_per_day: number | null;
  max_posts_per_day: number | null;
}

export interface StorageLimits {
  max_bytes: number | null;
  max_file_size: number | null;
  formatted_max: string;
}

export interface AIFeatures {
  moderation_enabled: boolean;
  suggestions_enabled: boolean;
  search_enabled: boolean;
}

export interface TierFeatureFlags {
  custom_css: boolean;
  custom_themes: boolean;
  custom_domain: boolean;
  video_calls: boolean;
  api_access: boolean;
  webhooks: boolean;
  priority_queue: boolean;
  early_access: boolean;
}

export interface TierLimits {
  forums: ForumLimits;
  storage: StorageLimits;
  ai: AIFeatures;
}

export interface TierFull extends TierBasic {
  limits: TierLimits;
  features: TierFeatureFlags;
}

export interface TierOverride {
  limit_key: string;
  value: string;
  reason: string | null;
  expires_at: string | null;
}

export interface EffectiveLimits {
  max_forums_owned: number | null;
  max_storage_bytes: number | null;
  max_threads_per_day: number | null;
}

export interface UserTierInfo {
  tier: TierFull | null;
  overrides: TierOverride[];
  effective_limits: EffectiveLimits;
}

export interface TiersListResponse {
  data: TierBasic[];
  meta: {
    count: number;
  };
}

export interface TierShowResponse {
  data: TierFull;
}

export interface MyTierResponse {
  data: UserTierInfo;
}

export interface TierDifference {
  field: string;
  from: string | number | boolean;
  to: string | number | boolean;
  change: 'increase' | 'decrease' | 'equal';
}

export interface TierCompareResponse {
  data: {
    from: TierFull;
    to: TierFull;
    is_upgrade: boolean;
    differences: TierDifference[];
  };
}

export interface TierCheckActionResponse {
  data: {
    allowed: boolean;
    limit: number | null;
    current: number;
  };
}

export interface TierCheckFeatureResponse {
  data: {
    feature: string;
    enabled: boolean;
  };
}

export type ModerableContentType = 'thread' | 'post' | 'comment' | 'user_profile';

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export type ModerationAction = 'approve' | 'flag' | 'hide' | 'remove' | 'ban';

export interface AIModerationQueueItem {
  id: string;
  forum_id: string;
  content_type: ModerableContentType;
  content_id: string;
  content_text: string | null;
  ai_model: string | null;
  confidence_score: number | null;
  categories: string[];
  severity: ModerationSeverity | null;
  suggested_action: ModerationAction | null;
  auto_actioned: boolean;
  status: ModerationStatus;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  final_action: ModerationAction | null;
  inserted_at: string;
  updated_at: string;
}

export interface AIModerationSettings {
  id: string;
  forum_id: string;
  enabled: boolean;
  auto_moderation_enabled: boolean;
  spam_threshold: number;
  toxicity_threshold: number;
  nsfw_threshold: number;
  low_quality_threshold: number;
  auto_remove_spam: boolean;
  auto_remove_spam_threshold: number;
  auto_hide_toxicity: boolean;
  auto_hide_toxicity_threshold: number;
  auto_flag_nsfw: boolean;
  notify_on_auto_action: boolean;
  exempt_roles: string[];
  exempt_karma_threshold: number;
  custom_banned_words: string[];
  custom_allowed_words: string[];
}

/** Is Unlimited. */
export function isUnlimited(limit: number | null): boolean {
  return limit === null;
}

/** Within Limit. */
export function withinLimit(limit: number | null, current: number): boolean {
  return limit === null || current < limit;
}

/** Format Bytes. */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Unlimited';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Format Limit. */
export function formatLimit(value: number | null): string {
  return value === null ? 'Unlimited' : value.toString();
}

/** Is Upgrade. */
export function isUpgrade(fromTier: TierName, toTier: TierName): boolean {
  return TIER_ORDER[toTier] > TIER_ORDER[fromTier];
}

/** Get Monthly Price. */
export function getMonthlyPrice(tier: TierBasic): string {
  if (tier.price_monthly_cents === 0) return 'Free';
  return `$${(tier.price_monthly_cents / 100).toFixed(2)}/mo`;
}

/** Get Yearly Price. */
export function getYearlyPrice(tier: TierBasic): { price: string; savings: string } {
  if (tier.price_yearly_cents === 0) return { price: 'Free', savings: '' };

  const yearlyPrice = tier.price_yearly_cents / 100;
  const monthlyEquivalent = yearlyPrice / 12;
  const monthlyFull = tier.price_monthly_cents / 100;
  const savingsPercent = Math.round((1 - monthlyEquivalent / monthlyFull) * 100);

  return {
    price: `$${yearlyPrice.toFixed(2)}/yr`,
    savings: savingsPercent > 0 ? `Save ${savingsPercent}%` : '',
  };
}
