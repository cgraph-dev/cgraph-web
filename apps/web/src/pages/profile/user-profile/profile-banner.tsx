/**
 * ProfileBanner - Banner section with edit mode overlay
 */

import { motion } from 'motion/react';
import { PencilSquareIcon, CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

interface ProfileBannerProps {
  bannerUrl?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploading: boolean;
  isActioning: boolean;
  onUploadClick: () => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileBanner({
  bannerUrl,
  isOwnProfile,
  editMode,
  isUploading,
  isActioning,
  onUploadClick,
  onEditToggle,
  onSave,
  onCancel,
  bannerInputRef,
  onBannerChange,
}: ProfileBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.smooth}
      className="group relative h-48 overflow-hidden bg-gradient-to-r from-primary-600 to-purple-600"
    >
      {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950/50" />

      {/* Edit Mode Toggle - Top Right */}
      {isOwnProfile && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {editMode ? (
            <>
              <motion.button
                onClick={onCancel}
                className="aurora-social-button-muted flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white"
                whileTap={{ scale: 0.88 }}
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </motion.button>
              <motion.button
                onClick={onSave}
                disabled={isActioning}
                className="aurora-social-button flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white disabled:opacity-50"
                whileTap={{ scale: 0.88 }}
              >
                <CheckIcon className="h-4 w-4" />
                {isActioning ? 'Saving...' : 'Save'}
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={onEditToggle}
              className="aurora-social-button-muted flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white"
              whileTap={{ scale: 0.88 }}
            >
              <PencilSquareIcon className="h-4 w-4" />
              Edit Profile
            </motion.button>
          )}
        </div>
      )}

      {/* Banner Edit Overlay */}
      {isOwnProfile && editMode && (
        <motion.div
          {...FADE_IN}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 backdrop-blur-md transition-colors hover:bg-black/55"
          onClick={onUploadClick}
        >
          <div className="text-center">
            {isUploading ? (
              <>
                <div className="mx-auto mb-2 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="font-medium text-white">Uploading...</p>
              </>
            ) : (
              <>
                <PhotoIcon className="mx-auto mb-2 h-12 w-12 text-white" />
                <p className="font-medium text-white">Change Banner</p>
                <p className="mt-1 text-sm text-white/60">Click to upload</p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Hidden file input for banner */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onBannerChange}
      />
    </motion.div>
  );
}
