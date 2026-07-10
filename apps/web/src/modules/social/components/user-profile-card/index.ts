/**
 * User Profile Card Module
 *
 * Profile card with hover and click triggers
 */

// Main component
export { default } from './user-profile-card';
export { default as UserProfileCard } from './user-profile-card';

// V2 profile card
export { NewProfileCard } from './new-profile-card';

// Sub-components
export { CardShell } from './profile-card-shell';
export { BannerCanvas } from './banner-canvas';
export { AvatarZone } from './avatar-zone';
export { Nameplate } from './nameplate';
export { IdentitySection } from './identity-section';
export { BadgeGem } from './badge-gem';
export { PulseDots } from './pulse-dots';
export { ActionButtons } from './action-buttons';

// Types
export type {
  UserProfileCardProps,
  CardPosition,
  ProfileCardUser,
  // V2 types
  NameplateVariant,
  BadgeDisplayTier,
  AccentThemeId,
  PulseTier,
  ProfileBadge,
  ProfileCardUserV2,
  CardShellProps,
  BannerProps,
  AvatarZoneProps,
  NameplateProps,
  IdentityProps,
  PulseDotsProps,
  ActionButtonsProps,
  NewProfileCardProps,
} from './types';

// Hooks
export { useProfileCardNavigation, useUserBorder } from './hooks';
export { useProfileCardData } from './use-profile-card-data';

// Constants
export {
  HOVER_DELAY_MS,
  // V2 constants
  ACCENT_THEMES,
  NAMEPLATE_STYLES,
  BADGE_RARITY_CONFIG,
  normalizeAccentThemeId,
  pulseDotCountForTier,
  mapRarityToDisplayTier,
} from './constants';
