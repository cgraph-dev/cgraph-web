/**
 * User Profile Card Types
 *
 * Type definitions for the user profile card module.
 * Includes legacy types + new V2 profile card system types.
 */

import type { ProfileCardUser } from '../profile-card';
import type { ProfileThemeId } from '@/data/profileThemes';

export type { ProfileCardUser };

// LEGACY TYPES (preserved for backward compatibility)

export interface UserProfileCardProps {
  userId: string;
  user?: ProfileCardUser;
  variant?: 'mini' | 'full';
  trigger?: 'hover' | 'click' | 'both';
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export interface MiniProfileCardProps {
  user: ProfileCardUser;
  onViewProfile: () => void;
  onMessage: () => void;
}

export interface FullProfileCardProps {
  readonly user: ProfileCardUser;
  readonly mutualFriends: MutualFriend[];
  readonly onClose: () => void;
  readonly onAddFriend?: () => void;
  readonly onBlockUser?: () => void;
}

export interface MutualFriend {
  id: string;
  username: string;
  avatarUrl?: string;
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

/** Pulse tier derived from pulse score */
export type PulseTier =
  | 'Newcomer'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'Master'
  | 'Legend';

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
 * Inherits legacy xp/level fields from ProfileCardUser but does NOT
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
  profileThemeId?: string;
  backgroundImage?: string | null;
}

export interface BannerProps {
  bannerType: 'animated' | 'static' | 'none';
  accentColor: string;
  bannerBackground: string;
  backgroundImage?: string;
  variant?: 'mini' | 'full';
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
}

export interface ActionButtonsProps {
  onMessage: () => void;
  onTip: () => void;
  onAddFriend: () => void;
  onViewProfile: () => void;
  accentColor: string;
  tipEnabled: boolean;
  compact?: boolean;
}

export interface NewProfileCardProps {
  user: ProfileCardUserV2;
  mode: 'popout' | 'preview';
  variant?: 'mini' | 'full';
  onMessage?: () => void;
  onTip?: () => void;
  onAddFriend?: () => void;
  onViewProfile?: () => void;
  onClose?: () => void;
  className?: string;
}
