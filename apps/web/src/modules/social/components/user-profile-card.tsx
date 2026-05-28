/**
 * User Profile Card - Re-export from modularized module
 *
 * @see ./user-profile-card for implementation
 */

export {
  UserProfileCard,
  NewProfileCard,
  MiniProfileCard,
  FullProfileCard,
  useProfileCardNavigation,
  useProfileCardData,
  HOVER_DELAY_MS,
  DEFAULT_PLACEHOLDER_USER,
  normalizeAccentThemeId,
} from './user-profile-card/index';

export type {
  UserProfileCardProps,
  MiniProfileCardProps,
  FullProfileCardProps,
  MutualFriend,
  ProfileCardUser,
  ProfileCardUserV2,
  BadgeDisplayTier,
  ProfileBadge,
  NewProfileCardProps,
} from './user-profile-card/index';

export { UserProfileCard as default } from './user-profile-card/index';
