/**
 * AvatarSettings module exports
 */

export { default } from './avatar-settings';

// Components
export { AvatarPreviewCard } from './avatar-preview-card';
export { AvatarUploadCard } from './avatar-upload-card';
export { ProfileInfoCard } from './profile-info-card';

// Hooks
export { useAvatarSettings } from './useAvatarSettings';

// Types
export type { AvatarSettingsFormData, FileUploadState, UseAvatarSettingsReturn } from './types';

// Constants
export {
  MAX_BIO_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_OCCUPATION_LENGTH,
  MAX_AVATAR_SIZE_MB,
} from './constants';
