/**
 * AvatarSettings type definitions
 */

export interface AvatarSettingsFormData {
  bio: string;
  location: string;
  website: string;
  occupation: string;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
}

export interface UseAvatarSettingsReturn {
  // Profile form state
  formData: AvatarSettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<AvatarSettingsFormData>>;
  handleProfileSave: () => Promise<void>;

  // Avatar upload
  avatarUpload: FileUploadState;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarUpload: () => Promise<void>;
  clearAvatarUpload: () => void;

  // Banner upload
  bannerUpload: FileUploadState;
  handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBannerUpload: () => Promise<void>;
  clearBannerUpload: () => void;

  // Sync status
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
}
