/**
 * useAvatarSettings hook
 * Manages avatar upload and profile info editing.
 */

import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';
import { useAuthStore } from '@/modules/auth/store';
import { useProfileStore } from '@/modules/social/store';
import { useSyncStatus } from '@/modules/settings/components/sync-status-indicator';
import type { AvatarSettingsFormData, FileUploadState, UseAvatarSettingsReturn } from './types';

const logger = createLogger('AvatarSettings');

/**
 * Hook for managing avatar settings (uploads + profile info).
 */
export function useAvatarSettings(): UseAvatarSettingsReturn {
  const { user, updateUser } = useAuthStore();
  const { updateProfile, uploadAvatar } = useProfileStore();
  const { status: syncStatus, setSaving, setSaved, setError } = useSyncStatus();

  // Profile form state
  const [formData, setFormData] = useState<AvatarSettingsFormData>({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    occupation: user?.occupation || '',
  });

  // File upload state
  const [avatarUpload, setAvatarUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
  });

  // Sync form state with user data when it changes
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        occupation: user.occupation || '',
      });
    }
  }, [user]);

  // Handle profile update
  const handleProfileSave = async () => {
    setSaving();
    try {
      await updateProfile(formData);
      updateUser(formData);
      setSaved();
      toast.success('Profile updated successfully');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      setError('Failed to save profile');
      toast.error('Failed to update profile');
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result: string = typeof reader.result === 'string' ? reader.result : '';
        setAvatarUpload({ file, preview: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarUpload.file) return;

    setSaving();
    try {
      const newAvatarUrl = await uploadAvatar(avatarUpload.file);
      updateUser({ avatarUrl: newAvatarUrl });
      setAvatarUpload({ file: null, preview: null });
      setSaved();
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
      toast.error('Failed to upload avatar');
    }
  };

  const clearAvatarUpload = () => {
    setAvatarUpload({ file: null, preview: null });
  };

  return {
    formData,
    setFormData,
    handleProfileSave,
    avatarUpload,
    handleAvatarChange,
    handleAvatarUpload,
    clearAvatarUpload,
    syncStatus,
  };
}
