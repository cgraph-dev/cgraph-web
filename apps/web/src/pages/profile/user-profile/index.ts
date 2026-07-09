/**
 * User Profile Module
 *
 * Modular components for the user profile page.
 * Main export is the UserProfile component.
 */

// Main component
export { UserProfile } from './user-profile';
export { UserProfile as default } from './user-profile';

// Sub-components
export { ProfileBanner } from './profile-banner';
export { ProfileAvatar } from './profile-avatar';
export { ProfileNameSection } from './profile-name-section';
export { ProfileAbout } from './profile-about';
export { FriendshipActions } from './friendship-actions';

// Hooks
export { useProfileData } from './hooks/useProfileData';

// Types
export type {
  ProfileEditState,
  FileUploadState,
  ProfileBannerProps,
  ProfileAvatarProps,
  ProfileNameSectionProps,
  ProfileAboutProps,
  FriendshipActionsProps,
} from './types';
