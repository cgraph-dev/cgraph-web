/**
 * Avatar & Profile Settings Component
 * Avatar upload, banner upload, and profile editing
 *
 */

import { motion } from 'motion/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import SyncStatusIndicator from '@/modules/settings/components/sync-status-indicator';
import { useAvatarSettings } from './useAvatarSettings';
import { AvatarPreviewCard } from './avatar-preview-card';
import { AvatarUploadCard } from './avatar-upload-card';
import { BannerUploadCard } from './banner-upload-card';
import { ProfileInfoCard } from './profile-info-card';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

export default function AvatarSettings() {
  const { user } = useAuthStore();
  const {
    formData,
    setFormData,
    handleProfileSave,
    avatarUpload,
    handleAvatarChange,
    handleAvatarUpload,
    clearAvatarUpload,
    bannerUpload,
    handleBannerChange,
    handleBannerUpload,
    clearBannerUpload,
    syncStatus,
  } = useAvatarSettings();

  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, y: -20 }}
      transition={tweens.standard}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="h-8 w-8 text-primary-400" />
          <div>
            <h2 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
              Avatar & Profile
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Upload your avatar, banner, and edit profile info
            </p>
          </div>
        </div>
        <SyncStatusIndicator status={syncStatus} />
      </div>

      {/* Preview Card */}
      <AvatarPreviewCard
        avatarUrl={(avatarUpload.preview || user?.avatarUrl) ?? undefined}
        displayName={user?.displayName ?? undefined}
      />

      {/* Avatar Upload */}
      <AvatarUploadCard
        upload={avatarUpload}
        onChange={handleAvatarChange}
        onUpload={handleAvatarUpload}
        onCancel={clearAvatarUpload}
      />

      {/* Banner Upload */}
      <BannerUploadCard
        upload={bannerUpload}
        currentBannerUrl={user?.bannerUrl}
        onChange={handleBannerChange}
        onUpload={handleBannerUpload}
        onCancel={clearBannerUpload}
      />

      {/* Profile Information */}
      <ProfileInfoCard formData={formData} onChange={setFormData} onSave={handleProfileSave} />
    </motion.div>
  );
}
