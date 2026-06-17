/**
 * Type definitions for user profile pages.
 */
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

/**
 * Profile edit mode state
 */
export interface ProfileEditState {
  editMode: boolean;
  editedBio: string;
  isActioning: boolean;
}

/**
 * File upload state for avatar.
 */
export interface FileUploadState {
  isUploadingAvatar: boolean;
}

/**
 * Props for ProfileBanner component
 */
export interface ProfileBannerProps {
  isOwnProfile: boolean;
  editMode: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  isActioning: boolean;
}

/**
 * Props for ProfileHeader component
 */
export interface ProfileHeaderProps {
  profile: UserProfileData;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploadingAvatar: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
}

/**
 * Props for FriendshipActions component
 */
export interface FriendshipActionsProps {
  profile: UserProfileData;
  friendshipStatus: FriendshipStatus;
  isActioning: boolean;
  onSendRequest: () => void;
  onAcceptRequest: () => void;
  onDeclineRequest: () => void;
  onCancelRequest: () => void;
  onRemoveFriend: () => void;
  onBlockUser: () => void;
  onMessage: () => void;
}

/**
 * Props for ProfileEditActions component
 */
export interface ProfileEditActionsProps {
  editMode: boolean;
  onNavigateCustomize: () => void;
}

/**
 * Props for ProfileAbout component
 */
export interface ProfileAboutProps {
  bio?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  editedBio: string;
  onBioChange: (value: string) => void;
}

/**
 * Props for ProfileAvatar component
 */
export interface ProfileAvatarProps {
  avatarUrl?: string;
  displayName?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploading: boolean;
  onAvatarClick: () => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Props for ProfileNameSection component
 */
export interface ProfileNameSectionProps {
  displayName?: string;
  username: string;
  title?: string;
  isOnline: boolean;
  joinedAt?: string;
}

// Re-export profile types for convenience
export type { UserProfileData, FriendshipStatus };
