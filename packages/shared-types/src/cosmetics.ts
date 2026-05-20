/**
 * Canonical cosmetic type definitions — single source of truth.
 *
 * Mirrors the backend `CGraph.Cosmetics` context.
 * All cosmetic-related interfaces and unions live here so that
 * web, mobile, and packages share identical shapes.
 *
 */

import type { RarityTier } from './rarity';

// Cosmetic classification

/** All cosmetic surface types (where a cosmetic renders). */
export type CosmeticSurface =
  | 'avatar_border'
  | 'nameplate'
  | 'chat_bubble'
  | 'badge'
  | 'title'
  | 'profile_theme'
  | 'name_style';

/** All cosmetic type slugs. */
export type CosmeticType =
  | 'avatar_border'
  | 'title'
  | 'badge'
  | 'nameplate'
  | 'chat_bubble'
  | 'theme'
  | 'profile_theme'
  | 'name_style'
  | 'profile_effect'
  | 'profile_frame';

/** Animation playback mode. */
export type AnimationType = 'none' | 'lottie' | 'css' | 'sprite' | 'video' | 'static';

// Unlock system

/** How a cosmetic is obtained. */
export type UnlockType =
  | 'free'
  | 'purchase'
  | 'achievement'
  | 'level'
  | 'event'
  | 'subscription'
  | 'gift'
  | 'admin';

// Entitlement system

/** How an entitlement was acquired. */
export type EntitlementType = 'subscription' | 'purchase' | 'gift' | 'reward';

/** Granular source of an entitlement grant. */
export type EntitlementSource =
  | 'stripe_subscription'
  | 'shop_purchase'
  | 'achievement'
  | 'admin_grant'
  | 'gift'
  | 'event'
  | 'level';

/** A purchasable cosmetic SKU from the catalogue. */
export interface CosmeticSku {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly type: CosmeticType;
  readonly assetHash: string | null;
  readonly cosmeticId: string | null;
  readonly priceNodes: number;
  readonly stripePriceId: string | null;
  readonly isPremiumOnly: boolean;
  readonly isAvailable: boolean;
  readonly collection: string | null;
  readonly version: number;
}

/** A user's entitlement to a cosmetic SKU. */
export interface Entitlement {
  readonly id: string;
  readonly sku: CosmeticSku;
  readonly type: EntitlementType;
  readonly source: EntitlementSource;
  readonly grantedAt: string;
  readonly expiresAt: string | null;
  readonly active: boolean;
}

// Unlock conditions

/** All supported unlock condition discriminators. */
export type UnlockConditionType =
  | 'achievement_earned'
  | 'messages_sent'
  | 'friends_count'
  | 'groups_joined'
  | 'events_attended'
  | 'reactions_received'
  | 'posts_created'
  | 'subscription_tier'
  | 'purchase'
  | 'gift_received'
  | 'admin_grant'
  | 'free';

/** Describes the condition a user must satisfy to unlock a cosmetic. */
export interface UnlockCondition {
  /** Discriminator */
  readonly type: UnlockConditionType;
  /** Threshold value (e.g. level number, count). Nullable for boolean conditions. */
  readonly threshold: number | null;
  /** Optional human-readable description override. */
  readonly description?: string;
}

// Core cosmetic item

/** A single cosmetic entry from the backend catalogue. */
export interface CosmeticItem {
  /** Unique cosmetic ID (UUID). */
  readonly id: string;
  /** URL-friendly slug (e.g. "cosmic-sovereign"). */
  readonly slug: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Short description shown in pickers. */
  readonly description: string;
  /** The surface this cosmetic decorates. */
  readonly surface: CosmeticSurface;
  /** Cosmetic category. */
  readonly type: CosmeticType;
  /** Rarity tier. */
  readonly rarity: RarityTier;
  /** How this item is obtained. */
  readonly unlockType: UnlockType;
  /** Detailed unlock condition. */
  readonly unlockCondition: UnlockCondition;
  /** Animation playback mode. */
  readonly animationType: AnimationType;
  /** Lottie JSON filename (null if not Lottie-animated). */
  readonly lottieFile: string | null;
  /** Preview image URL. */
  readonly previewUrl: string | null;
  /** Hex color array for theming (e.g. gradient stops). */
  readonly colors: readonly string[];
  /** Whether the item is currently obtainable. */
  readonly available: boolean;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
}

// User inventory

/** A cosmetic item owned by a user, with equipped state. */
export interface UserCosmeticInventory {
  /** The cosmetic definition. */
  readonly cosmetic: CosmeticItem;
  /** Whether the user has this item equipped on its surface. */
  readonly equipped: boolean;
  /** ISO-8601 timestamp when the user acquired this item. */
  readonly acquiredAt: string;
  /** Source of acquisition (matches UnlockType). */
  readonly source: UnlockType;
}

// Visibility rules

/** Controls where a cosmetic is rendered. */
export interface CosmeticVisibilityRule {
  /** The surface this rule applies to. */
  readonly surface: CosmeticSurface;
  /** Show in chat messages. */
  readonly showInChat: boolean;
  /** Show on profile cards. */
  readonly showOnProfile: boolean;
  /** Show in member lists. */
  readonly showInMemberList: boolean;
  /** Show in friend lists. */
  readonly showInFriendList: boolean;
}

// Specific cosmetic item types

/** A badge cosmetic (e.g. "Early Supporter", "Bug Hunter"). */
export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly iconUrl: string;
  readonly rarity: RarityTier;
  readonly category: string;
  readonly unlockCondition: UnlockCondition;
  /** Animation playback mode — determines which renderer to use. */
  readonly animationType: AnimationType;
  /** Lottie JSON URL (null if not Lottie-animated). */
  readonly lottieUrl: string | null;
  /** Lottie animation config overrides. */
  readonly lottieConfig: Record<string, unknown>;
}

/** A nameplate cosmetic shown behind a user's name. */
export interface Nameplate {
  readonly id: string;
  readonly name: string;
  readonly backgroundUrl: string;
  readonly textColor: string;
  readonly borderStyle: string;
  readonly rarity: RarityTier;
  readonly animated: boolean;
  /** Animation playback mode — determines which renderer to use. */
  readonly animationType: AnimationType;
  /** Lottie JSON URL (null if not Lottie-animated). */
  readonly lottieUrl: string | null;
  /** Lottie animation config overrides. */
  readonly lottieConfig: Record<string, unknown>;
}

/** A custom name style (font, color scheme, animation). */
export interface NameStyle {
  readonly id: string;
  readonly name: string;
  readonly fontFamily: string;
  readonly colorScheme: readonly string[];
  readonly animation: string | null;
  readonly rarity: RarityTier;
  /** Animation playback mode — determines which renderer to use. */
  readonly animationType: AnimationType;
  /** Lottie JSON URL (null if not Lottie-animated). */
  readonly lottieUrl: string | null;
  /** Lottie animation config overrides. */
  readonly lottieConfig: Record<string, unknown>;
}

/** A title cosmetic displayed next to a user's name. */
export interface Title {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: string;
  readonly rarity: RarityTier;
  /** Animation playback mode. */
  readonly animationType: AnimationType;
  /** Lottie JSON URL (null if not Lottie-animated). */
  readonly lottieUrl: string | null;
  /** Lottie animation config overrides. */
  readonly lottieConfig: Record<string, unknown>;
  /** Icon URL for the title badge. */
  readonly iconUrl: string | null;
}

/** A profile theme cosmetic controlling the user's profile card appearance. */
export interface ProfileThemeCatalog {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly rarity: RarityTier;
  readonly category: string;
  readonly previewUrl: string | null;
  /** Animation playback mode. */
  readonly animationType: AnimationType;
  /** Background layer Lottie URL. */
  readonly backgroundLottieUrl: string | null;
  /** Particle layer Lottie URL. */
  readonly particleLottieUrl: string | null;
  /** Overlay layer Lottie URL. */
  readonly overlayLottieUrl: string | null;
  /** Lottie animation config overrides. */
  readonly lottieConfig: Record<string, unknown>;
  /** Primary theme color (hex). */
  readonly colorPrimary: string | null;
  /** Accent theme color (hex). */
  readonly colorAccent: string | null;
}

export const PROFILE_THEME_IDS = [
  'signal-noir',
  'aurora-glass',
  'retro-terminal',
  'solarpunk-canopy',
  'deep-space',
  'sakura-dream',
  'ember-forge',
] as const;

export type ProfileThemeId = (typeof PROFILE_THEME_IDS)[number];

export const PROFILE_THEME_CATEGORIES = [
  'signal',
  'aurora',
  'retro',
  'solarpunk',
  'cosmic',
  'sakura',
  'ember',
] as const;

export type ProfileThemeCategory = (typeof PROFILE_THEME_CATEGORIES)[number];

export const PROFILE_THEME_TIERS = ['free', 'premium', 'enterprise'] as const;

export type ProfileThemeTier = (typeof PROFILE_THEME_TIERS)[number];

export const PROFILE_THEME_SURFACE_PATTERNS = [
  'scanline',
  'glass',
  'terminal-grid',
  'canopy',
  'starfield',
  'petal-wash',
  'forge',
] as const;

export type ProfileThemeSurfacePattern = (typeof PROFILE_THEME_SURFACE_PATTERNS)[number];

/** Runtime-neutral profile theme contract shared by full profiles and previews. */
export interface ProfileThemeConfig {
  readonly id: ProfileThemeId;
  readonly name: string;
  readonly category: ProfileThemeCategory;
  readonly tier: ProfileThemeTier;
  readonly description: string;
  readonly backgroundGradient: readonly string[];
  readonly surfacePattern: ProfileThemeSurfacePattern;
  readonly glowEnabled: boolean;
  readonly glowColor?: string;
  readonly glowIntensity?: number;
  readonly accentPrimary: string;
  readonly accentSecondary: string;
  readonly textColor: string;
  readonly unlocked: boolean;
  readonly unlockRequirement?: string;
  readonly unlockLevel?: number;
  readonly previewImage?: string;
}

function isOneOf<const T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

export function isProfileThemeCategory(value: unknown): value is ProfileThemeCategory {
  return isOneOf(PROFILE_THEME_CATEGORIES, value);
}

export function isProfileThemeId(value: unknown): value is ProfileThemeId {
  return isOneOf(PROFILE_THEME_IDS, value);
}

export function isProfileThemeSurfacePattern(
  value: unknown
): value is ProfileThemeSurfacePattern {
  return isOneOf(PROFILE_THEME_SURFACE_PATTERNS, value);
}

/** All equipped cosmetics for a user — returned by GET /api/v1/cosmetics/equipped. */
export interface EquippedCosmetics {
  readonly avatar_border: CatalogItemSummary | null;
  readonly nameplate: CatalogItemSummary | null;
  readonly title: CatalogItemSummary | null;
  readonly badges: readonly CatalogItemSummary[];
  readonly profile_theme: CatalogItemSummary | null;
  readonly name_style: CatalogItemSummary | null;
  readonly profile_effect: CatalogItemSummary | null;
  readonly avatar_frame: CatalogItemSummary | null;
}

/** Summary of a catalog item with Lottie fields, used in equipped response. */
export interface CatalogItemSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly rarity: RarityTier;
  readonly description: string | null;
  readonly animationType: AnimationType;
  readonly lottieUrl: string | null;
  readonly lottieConfig: Record<string, unknown>;
  readonly iconUrl?: string;
  readonly backgroundLottieUrl?: string;
  readonly particleLottieUrl?: string;
  readonly overlayLottieUrl?: string;
}

// Inventory

/** A single item in a user's cosmetic inventory. */
export interface InventoryItem {
  readonly id: string;
  readonly userId: string;
  readonly itemType: CosmeticType;
  readonly itemId: string;
  readonly equippedAt: string | null;
  readonly obtainedAt: string;
  readonly obtainedVia: string;
}

// Unified cosmetics JSONB payload (stored on user record)

/**
 * The unified cosmetics JSONB payload stored on each user.
 * Contains all equipped cosmetic settings in a single field.
 * All fields are optional — absent means "use default."
 */
export interface UserCosmetics {
  /** Custom font family for display name. */
  readonly name_font?: string;
  /** Name effect: glow, gradient, sparkle, etc. */
  readonly name_effect?: string;
  /** Primary name color (hex). */
  readonly name_color?: string;
  /** Secondary name color for gradients (hex). */
  readonly name_secondary_color?: string;
  /** Equipped profile frame ID. */
  readonly profile_frame?: string;
  /** Equipped badge ID. */
  readonly badge?: string;
  /** Equipped title ID. */
  readonly title?: string;
  /** Equipped nameplate ID. */
  readonly nameplate?: string;
  /** Equipped chat bubble style. */
  readonly chat_bubble?: string;
  /** Equipped avatar border ID. */
  readonly avatar_border?: string;
}

/** Type guard for checking if a user has cosmetics set. */
export function hasCosmetics(user: {
  cosmetics?: UserCosmetics | null;
}): user is { cosmetics: UserCosmetics } {
  return (
    user.cosmetics != null &&
    typeof user.cosmetics === 'object' &&
    Object.keys(user.cosmetics).length > 0
  );
}

// Marketplace types (Phase 46-01)

/** A cosmetic marketplace listing. */
export interface MarketplaceListing {
  readonly id: string;
  readonly cosmeticId: string;
  readonly name: string;
  readonly description: string;
  readonly type: CosmeticType;
  readonly rarity: RarityTier;
  readonly priceNodes: number;
  readonly previewUrl: string | null;
  readonly available: boolean;
  readonly featured: boolean;
  readonly createdAt: string;
}

/** A bundle of cosmetics sold together at a discount. */
export interface CosmeticBundle {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly items: readonly MarketplaceListing[];
  readonly priceNodes: number;
  readonly discountPercent: number;
  readonly previewUrl: string | null;
  readonly available: boolean;
  readonly expiresAt: string | null;
}

/** Marketplace filter criteria. */
export interface MarketplaceFilters {
  readonly type?: CosmeticType;
  readonly category?: string;
  readonly rarity?: RarityTier;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
  readonly sort?: string;
  readonly sortBy?: 'price' | 'name' | 'rarity' | 'newest';
  readonly sortOrder?: 'asc' | 'desc';
  readonly cursor?: string;
  readonly limit?: number;
}

/** A user's progression toward cosmetic unlocks. */
export interface UserProgression {
  readonly userId: string;
  readonly level: number;
  readonly xp: number;
  readonly xpToNextLevel: number;
  readonly unlockedCount: number;
  readonly totalCount: number;
  readonly progressPercent?: number;
  readonly totalMessages?: number;
  readonly totalPosts?: number;
  readonly totalReactionsGiven?: number;
  readonly totalReactionsReceived?: number;
  readonly loginStreak?: number;
  readonly longestLoginStreak?: number;
  readonly lastLoginDate?: string;
  readonly recentUnlocks: readonly UnlockEntry[];
  readonly upcomingUnlocks: readonly UpcomingUnlock[];
}

/** A record of a cosmetic unlock. */
export interface UnlockEntry {
  readonly cosmeticId: string;
  readonly name: string;
  readonly type: CosmeticType;
  readonly rarity: RarityTier;
  readonly unlockedAt: string;
  readonly source: UnlockType;
}

/** An upcoming cosmetic unlock based on user progression. */
export interface UpcomingUnlock {
  readonly cosmeticId: string;
  readonly name: string;
  readonly type: CosmeticType;
  readonly rarity: RarityTier;
  readonly condition: UnlockCondition;
  readonly progress: number;
  readonly target: number;
}
