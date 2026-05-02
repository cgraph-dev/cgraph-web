/**
 * Achievement system type definitions.
 *
 * Canonical location for all achievement-related types.
 * Achievements are cosmetic rewards — no XP, nodes, or leveling.
 *
 */

/**
 */
export type AchievementCategory =
  | 'social'
  | 'content'
  | 'exploration'
  | 'mastery'
  | 'community'
  | 'special'
  | 'seasonal'
  | 'legendary'
  | 'secret';

/**
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 */
export type CosmeticRewardType = 'title' | 'badge' | 'border' | 'nameplate' | 'effect';

/**
 */
export interface CosmeticReward {
  /** The kind of cosmetic item */
  type: CosmeticRewardType;
  /** Registry ID of the cosmetic item */
  itemId: string;
}

/**
 */
export interface Achievement {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Human-readable description of unlock criteria */
  description: string;
  /** Grouping category */
  category: AchievementCategory;
  /** Rarity tier */
  rarity: AchievementRarity;
  /** Emoji icon */
  icon: string;
  /** Target progress value for completion */
  maxProgress: number;
  /** Whether this achievement is hidden until unlocked */
  isHidden: boolean;
  /** Whether the user has unlocked this achievement */
  unlocked?: boolean;
  /** ISO timestamp of when it was unlocked */
  unlockedAt?: string;
  /** Optional lore fragment ID revealed on unlock */
  loreFragment?: string;
  /** Optional cosmetic reward granted on unlock */
  cosmeticReward?: CosmeticReward;
}
