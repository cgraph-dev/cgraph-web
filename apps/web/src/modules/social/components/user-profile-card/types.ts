/**
 * User Profile Card Types
 *
 * Type definitions for the user profile card module.
 */

import type { ProfileThemeId } from '@/data/profileThemes';
import type { FriendshipStatus } from '@/modules/social/types';
import type {
  Achievement,
  ProfileColorId,
  ProfileThemeAssetManifest,
  PulseTier,
} from '@cgraph-dev/shared-types';

export type { PulseTier } from '@cgraph-dev/shared-types';

export interface ProfileCardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarBorderId?: string;
  bio?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  pulse: number;
  streak: number;
  equippedTitle?: {
    id: string;
    name: string;
    rarity: string;
    animation: { type: string; speed: number; intensity: number };
    color: string;
    gradient?: string;
    lottieUrl?: string;
    imageUrl?: string;
  };
  equippedBadges?: Achievement[];
  messageCount?: number;
  postCount?: number;
  friendCount?: number;
  forumCount?: number;
  mutualFriends?: { id: string; username: string; avatarUrl: string }[];
  forumsInCommon?: { id: string; name: string }[];
  recentActivity?: { type: string; description: string; timestamp: string }[];
  socialLinks?: { platform: string; url: string }[];
  friendshipStatus?: ProfileCardFriendshipStatus;
  topCommunities?: { forumId: string; forumName: string; score: number; tier: string }[];
  isOnline: boolean;
  lastSeen?: string;
  pronouns?: string;
  profileColor?: ProfileColorId | null;
  profile_color?: ProfileColorId;
  profile_theme?: string;
  equipped_nameplate?: string;
  display_name_font?: string;
  display_name_effect?: string;
  display_name_color?: string;
  display_name_secondary_color?: string;
}

export type ProfileCardFriendshipStatus = FriendshipStatus;

export interface UserProfileCardProps {
  userId: string;
  user?: ProfileCardUser;
  variant?: 'mini' | 'full';
  trigger?: 'hover' | 'click' | 'both';
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export interface CardPosition {
  top: number;
  left: number;
}

// V2 PROFILE CARD TYPES

/** Nameplate visual variants from the prototype */
export type NameplateVariant = 'cosmic' | 'aurora' | 'ember' | 'none';

/**
 * Badge display tiers for the crystal gem display.
 * Named BadgeDisplayTier (not BadgeRarity) to avoid collision
 * with the existing BadgeRarity in @/data/badgesCollection.ts.
 */
export type BadgeDisplayTier = 'legendary' | 'epic' | 'rare' | 'dim';

/** Per-user accent theme (cosmetic choice, separate from app theme) */
export type AccentThemeId = ProfileThemeId;

/** Badge with rarity info for the crystal gem display */
export interface ProfileBadge {
  id: string;
  name: string;
  icon: string;
  rarity: BadgeDisplayTier;
  tooltipLabel?: string;
  imageUrl?: string;
  lottieUrl?: string;
  animationType?: string;
}

/**
 * Extended user type for the new profile card.
 * Inherits base xp/level fields from ProfileCardUser but does NOT
 * add any new XP-related display fields.
 */
export interface ProfileCardUserV2 extends ProfileCardUser {
  accentTheme?: AccentThemeId;
  nameplateVariant?: NameplateVariant;
  nameplateId?: string | null;
  profileBadges?: ProfileBadge[];
  bannerType?: 'animated' | 'static' | 'none';
  energyRingTier?: BadgeDisplayTier;
  pulseTier?: PulseTier;
  pulseFilled?: number;
  displayNameFont?: string;
  displayNameEffect?: string;
  displayNameColor?: string;
  displayNameSecondaryColor?: string | null;
}

// V2 SUB-COMPONENT PROPS

export interface CardShellProps {
  children: React.ReactNode;
  accentColor: string;
  className?: string;
  profileColor?: ProfileColorId;
  profileThemeId?: string;
  backgroundImage?: string | null;
  backgroundAsset?: ProfileThemeAssetManifest | null;
}

export interface BannerProps {
  bannerType: 'animated' | 'static' | 'none';
  accentColor: string;
  bannerBackground: string;
  backgroundImage?: string;
  variant?: 'mini' | 'full';
  decorative?: boolean;
}

export interface AvatarZoneProps {
  avatarUrl: string;
  displayName: string;
  initials: string;
  isOnline: boolean;
  energyRingTier: BadgeDisplayTier;
  accentColor: string;
  avatarBorderId?: string;
  variant?: 'mini' | 'full';
}

export interface NameplateProps {
  displayName: string;
  nameplateId?: string | null;
  displayNameFont?: string;
  displayNameEffect?: string;
  displayNameColor?: string;
  displayNameSecondaryColor?: string | null;
  className?: string;
  displayNameClassName?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface IdentityProps {
  title: string | null;
  titleColor?: string;
  titleAnimationType?: string;
  titleGradient?: string;
  titleLottieUrl?: string;
  titleImageUrl?: string;
  bio: string | null;
  badges: ProfileBadge[];
  accentColor: string;
  compact?: boolean;
}

export interface PulseDotsProps {
  filled: number;
  tier: PulseTier;
  score: number;
  prefersReducedMotion: boolean;
  compact?: boolean;
}

export interface ActionButtonsProps {
  onMessage: () => void;
  onTip: () => void;
  onAddFriend: () => void;
  onReviewFriendRequest: () => void;
  onViewProfile: () => void;
  accentColor: string;
  tipEnabled: boolean;
  friendshipStatus: ProfileCardFriendshipStatus;
  isFriendActionPending?: boolean;
  compact?: boolean;
}

export interface NewProfileCardProps {
  user: ProfileCardUserV2;
  mode: 'popout' | 'preview';
  variant?: 'mini' | 'full';
  onMessage?: () => void;
  onTip?: () => void;
  onAddFriend?: () => void;
  onReviewFriendRequest?: () => void;
  onViewProfile?: () => void;
  onClose?: () => void;
  friendshipStatus?: ProfileCardFriendshipStatus;
  isFriendActionPending?: boolean;
  className?: string;
}
