/**
 * Badge Collections Registry — shared across web and mobile.
 *
 * 40+ equippable badges organized by rarity.
 * Each badge has rarity, icon, unlock requirements, and equip status.
 *
 * Platform-agnostic: no React, React Native, or framework imports.
 */

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Renderer selection: static emoji/SVG, CSS animation, or Lottie vector animation */
export type BadgeAnimationType = 'static' | 'css' | 'lottie';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  isPremium: boolean;
  /** Path to Lottie JSON file (undefined = no animation, uses static emoji) */
  lottieUrl?: string;
  /** Renderer selection — defaults to 'static' if omitted */
  animationType?: BadgeAnimationType;
}

const COMMON_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-newcomer',
    name: 'Newcomer',
    description: 'Welcome to CGraph!',
    icon: '\u{1F44B}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-first-message',
    name: 'First Message',
    description: 'Sent your first message',
    icon: '\u{1F4AC}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-profile-complete',
    name: 'Profile Complete',
    description: 'Filled out your entire profile',
    icon: '\u{1F4DD}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-first-friend',
    name: 'First Friend',
    description: 'Made your first friend',
    icon: '\u{1F91D}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-group-joiner',
    name: 'Group Joiner',
    description: 'Joined your first group',
    icon: '\u{1F465}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-forum-poster',
    name: 'Forum Poster',
    description: 'Created your first forum post',
    icon: '\u{1F4F0}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-early-adopter',
    name: 'Early Adopter',
    description: 'Joined during early access',
    icon: '\u{1F331}',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-night-owl',
    name: 'Night Owl',
    description: 'Active after midnight',
    icon: '\u{1F989}',
    rarity: 'common',
    unlocked: false,
    unlockRequirement: 'Be active after midnight 10 times',
    isPremium: false,
  },
];

const RARE_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-social-butterfly',
    name: 'Social Butterfly',
    description: 'Connected with 50 people',
    icon: '\u{1F98B}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Add 50 friends',
    isPremium: false,
  },
  {
    id: 'badge-chatterbox',
    name: 'Chatterbox',
    description: 'Sent 1,000 messages',
    icon: '\u{1F5E3}\uFE0F',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Send 1,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-forum-contributor',
    name: 'Forum Contributor',
    description: 'Created 50 forum posts',
    icon: '\u270D\uFE0F',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Create 50 forum posts',
    isPremium: false,
  },
  {
    id: 'badge-group-leader',
    name: 'Group Leader',
    description: 'Created and manage a group',
    icon: '\u{1F451}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Create a group with 10+ members',
    isPremium: false,
  },
  {
    id: 'badge-streak-7',
    name: 'Week Warrior',
    description: '7-day login streak',
    icon: '\u{1F525}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Login 7 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-helper',
    name: 'Helpful Hand',
    description: 'Received 50 upvotes on forum posts',
    icon: '\u{1F64C}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Get 50 upvotes on forum posts',
    isPremium: false,
  },
  {
    id: 'badge-collector',
    name: 'Collector',
    description: 'Collected 25 unique items',
    icon: '\u{1F392}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Collect 25 unique items',
    isPremium: false,
  },
  {
    id: 'badge-voice-user',
    name: 'Voice Chat Regular',
    description: 'Spent 10 hours in voice channels',
    icon: '\u{1F3A4}',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Spend 10 hours in voice chat',
    isPremium: false,
  },
];

const EPIC_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-streak-30',
    name: 'Monthly Devotion',
    description: '30-day login streak',
    icon: '\u26A1',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Login 30 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-10k-messages',
    name: 'Message Master',
    description: 'Sent 10,000 messages',
    icon: '\u{1F4E8}',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Send 10,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-community-star',
    name: 'Community Star',
    description: 'Recognized community contributor',
    icon: '\u2B50',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
    isPremium: false,
  },
  {
    id: 'badge-quest-hunter',
    name: 'Quest Hunter',
    description: 'Completed 50 quests',
    icon: '\u{1F3F9}',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Complete 50 quests',
    isPremium: false,
  },
  {
    id: 'badge-beta-tester',
    name: 'Beta Tester',
    description: 'Participated in beta testing',
    icon: '\u{1F9EA}',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Join beta program',
    isPremium: false,
  },
  {
    id: 'badge-event-champion',
    name: 'Event Champion',
    description: 'Won a seasonal event',
    icon: '\u{1F3C6}',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Win a seasonal event',
    isPremium: false,
  },
  {
    id: 'badge-moderator',
    name: 'Moderator',
    description: 'Community moderator',
    icon: '\u{1F6E1}\uFE0F',
    rarity: 'epic',
    lottieUrl: 'badges/badge_mod_shield.json',
    animationType: 'lottie',
    unlocked: false,
    unlockRequirement: 'Staff appointment',
    isPremium: false,
  },
  {
    id: 'badge-vip',
    name: 'VIP',
    description: 'Premium member',
    icon: '\u{1F48E}',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Premium subscription',
    isPremium: true,
  },
];

const LEGENDARY_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-streak-365',
    name: 'Year-Long Devotion',
    description: '365-day login streak',
    icon: '\u{1F31F}',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Login 365 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-100k-messages',
    name: 'Legendary Chatter',
    description: 'Sent 100,000 messages',
    icon: '\u{1F4AC}',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Send 100,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-founder',
    name: 'Founder',
    description: 'Original community founder',
    icon: '\u{1F3DB}\uFE0F',
    rarity: 'legendary',
    lottieUrl: 'badges/badge_founder.json',
    animationType: 'lottie',
    unlocked: false,
    unlockRequirement: 'Founding member',
    isPremium: true,
  },
  {
    id: 'badge-completionist',
    name: 'Completionist',
    description: 'Unlocked all achievements',
    icon: '\u{1F3AF}',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: '100% all achievements',
    isPremium: false,
  },
  {
    id: 'badge-top-contributor',
    lottieUrl: 'badges/badge_top_contributor.json',
    animationType: 'lottie',
    name: 'Top Contributor',
    description: 'Top 10 community contributor',
    icon: '\u{1F947}',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Reach top 10 on leaderboard',
    isPremium: false,
  },
  {
    id: 'badge-prestige',
    name: 'Prestige',
    description: 'Achieved prestige status',
    icon: '\u2728',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Reach Prestige 1',
    isPremium: false,
  },
  {
    id: 'badge-master-collector',
    name: 'Master Collector',
    description: 'Collected 100 unique items',
    icon: '\u{1F5DD}\uFE0F',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Collect 100 unique items',
    isPremium: false,
  },
  {
    id: 'badge-server-booster',
    name: 'Server Booster',
    description: 'Boosted a server for 6 months',
    icon: '\u{1F680}',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Boost a server for 6 months',
    isPremium: true,
  },
];

const MYTHIC_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-immortal',
    name: 'Immortal',
    description: 'Achieved the impossible',
    icon: '\u267E\uFE0F',
    rarity: 'mythic',
    lottieUrl: 'badges/badge_mythic_creator.json',
    animationType: 'lottie',
    unlocked: false,
    unlockRequirement: 'Top 10 global ranking',
    isPremium: true,
  },
  {
    id: 'badge-cosmic',
    name: 'Cosmic Entity',
    description: 'Transcended beyond mortal limits',
    icon: '\u{1F30C}',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Complete impossible challenge',
    isPremium: true,
  },
  {
    id: 'badge-god-tier',
    name: 'God Tier',
    description: 'Reached max prestige',
    icon: '\u269C\uFE0F',
    rarity: 'mythic',
    lottieUrl: 'badges/badge_admin.json',
    animationType: 'lottie',
    unlocked: false,
    unlockRequirement: 'Reach max prestige',
    isPremium: true,
  },
  {
    id: 'badge-zodiac-master',
    name: 'Zodiac Master',
    description: 'Collected all zodiac items',
    icon: '\u2648',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Collect all zodiac badges',
    isPremium: true,
  },
];

export const ALL_BADGES: BadgeDefinition[] = [
  ...COMMON_BADGES,
  ...RARE_BADGES,
  ...EPIC_BADGES,
  ...LEGENDARY_BADGES,
  ...MYTHIC_BADGES,
];

/** Get badge by ID */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

/** Get badges by rarity */
export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.rarity === rarity);
}

/** Get unlocked badges */
export function getUnlockedBadges(): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.unlocked);
}
