/**
 * ProfileAvatar - Avatar section with edit mode overlay and level badge.
 * Always uses ThemedAvatar with the user's equipped Lottie border.
 */

import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { getAvatarBorderId } from '@/lib/utils';
import type { UserProfileData } from '@/types/profile.types';
import { springs } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

interface ProfileAvatarProps {
  profile: UserProfileData;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploading: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
}

/**
 * Profile Avatar component.
 * For own profile: reads the selected border from the customization store.
 * For other users: reads the border from the profile data.
 */
export function ProfileAvatar({
  profile,
  isOwnProfile,
  editMode,
  isUploading,
  avatarInputRef,
  onAvatarChange,
  onAvatarClick,
}: ProfileAvatarProps) {
  // For own profile, use the global customization store's selected border
  const ownBorderId = useCustomizationStore((s) => s.selectedBorderId);
  // For other users, extract from their profile data
  const otherBorderId = getAvatarBorderId(profile);
  const borderId = isOwnProfile ? ownBorderId : otherBorderId;

  return (
    <motion.div
      className="group relative"
      whileHover={{ opacity: 0.9 }}
      transition={springs.snappy}
    >
      <ThemedAvatar
        src={profile.avatarUrl || undefined}
        alt={profile.displayName || profile.username || 'User'}
        size="xlarge"
        avatarBorderId={borderId}
      />

      {/* Avatar Edit Overlay */}
      {isOwnProfile && editMode && (
        <motion.div
          {...FADE_IN}
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/45 backdrop-blur-md transition-colors hover:bg-black/55"
          onClick={onAvatarClick}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <PhotoIcon className="mx-auto h-8 w-8 text-white" />
            )}
          </div>
        </motion.div>
      )}

      {/* Hidden file input for avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
      />

      {/* Level badge overlay */}
      {profile.level && profile.level > 1 && (
        <motion.div
          className="absolute -bottom-1 -right-1 rounded-full border-2 border-dark-900 bg-gradient-to-r from-primary-600 to-purple-600 px-2 py-0.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <span className="text-xs font-bold text-white">Lvl {profile.level}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
