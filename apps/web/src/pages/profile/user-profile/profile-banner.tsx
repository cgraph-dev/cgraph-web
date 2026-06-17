/**
 * ProfileBanner - profile theme header for public profiles.
 */

import { motion } from 'motion/react';
import { PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { tweens } from '@/lib/animation-presets';
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface ProfileBannerProps {
  theme: ProfileThemeConfig;
  isOwnProfile: boolean;
  editMode: boolean;
  isActioning: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Profile theme header component.
 */
export function ProfileBanner({
  theme,
  isOwnProfile,
  editMode,
  isActioning,
  onEditToggle,
  onSave,
  onCancel,
}: ProfileBannerProps) {
  const themeHeaderImage = theme.profileBackgroundImage ?? theme.previewImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.smooth}
      className="group relative h-56 overflow-hidden"
      data-profile-theme-header-image={themeHeaderImage}
      style={{
        background: `radial-gradient(circle at 18% 18%, ${theme.accentPrimary}55, transparent 32%), radial-gradient(circle at 82% 28%, ${theme.accentSecondary}45, transparent 34%), linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
      }}
    >
      {themeHeaderImage && (
        <img
          src={themeHeaderImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_36%]"
          loading="lazy"
        />
      )}
      {!themeHeaderImage && theme.surfacePattern === 'terminal-grid' && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(${theme.accentPrimary}24 1px, transparent 1px), linear-gradient(90deg, ${theme.accentPrimary}18 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      )}
      {!themeHeaderImage && theme.surfacePattern === 'scanline' && (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_8px,rgba(255,255,255,0.055)_8px_9px)]" />
      )}
      {!themeHeaderImage && theme.surfacePattern === 'starfield' && (
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
    </motion.div>
  );
}
