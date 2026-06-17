/**
 * ProfileBanner - Banner section with edit mode overlay
 */

import { motion } from 'motion/react';
import { PencilSquareIcon, CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface ProfileBannerProps {
  bannerUrl?: string;
  theme: ProfileThemeConfig;
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

/**
 */
/**
 * Profile Banner component.
 */
export function ProfileBanner({
  bannerUrl,
  theme,
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
  const themeHeaderImage = theme.profileBackgroundImage ?? theme.previewImage;
  const headerImage = bannerUrl ?? themeHeaderImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.smooth}
      className="group relative h-56 overflow-hidden"
      data-profile-theme-header-image={!bannerUrl ? themeHeaderImage : undefined}
      style={{
        background: `radial-gradient(circle at 18% 18%, ${theme.accentPrimary}55, transparent 32%), radial-gradient(circle at 82% 28%, ${theme.accentSecondary}45, transparent 34%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      }}
    >
      {headerImage && (
        <img
          src={headerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_36%]"
          loading="lazy"
        />
      )}
      {!headerImage && theme.surfacePattern === 'terminal-grid' && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(${theme.accentPrimary}24 1px, transparent 1px), linear-gradient(90deg, ${theme.accentPrimary}18 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      )}
      {!headerImage && theme.surfacePattern === 'scanline' && (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_8px,rgba(255,255,255,0.055)_8px_9px)]" />
      )}
      {!headerImage && theme.surfacePattern === 'starfield' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 22% 22%, rgba(255,255,255,0.8) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 34%, ${theme.accentSecondary} 0 1px, transparent 1.5px), radial-gradient(circle at 54% 68%, ${theme.accentPrimary} 0 1px, transparent 1.5px)`,
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-dark-950/8 to-dark-950/70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.07] to-transparent" />
      <div
        className="pointer-events-none absolute inset-x-10 bottom-0 h-9 rounded-t-full border-x border-t border-white/[0.08]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${theme.accentPrimary} 14%, rgba(8,9,15,0.72)) 0%, rgba(8,9,15,0.95) 100%)`,
          boxShadow: `0 -18px 44px color-mix(in srgb, ${theme.accentPrimary} 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      />

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
