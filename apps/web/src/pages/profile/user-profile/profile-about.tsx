/**
 * ProfileAbout - Bio section with edit mode
 */

import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';

interface ProfileAboutProps {
  bio?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  editedBio: string;
  onBioChange: (value: string) => void;
}

export function ProfileAbout({
  bio,
  isOwnProfile,
  editMode,
  editedBio,
  onBioChange,
}: ProfileAboutProps) {
  // Only show if there's a bio or we're editing our own profile
  if (!bio && !(isOwnProfile && editMode)) {
    return null;
  }

  return (
    <GlassCard variant="default" className="aurora-social-panel p-6">
      <h2 className="mb-3 flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
        About
        {isOwnProfile && editMode && (
          <span className="text-xs font-normal text-white/40">(Click to edit)</span>
        )}
      </h2>

      {isOwnProfile && editMode ? (
        <motion.textarea
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          value={editedBio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell us about yourself..."
          className="aurora-social-select w-full resize-none rounded-xl px-4 py-3 text-white placeholder-white/30"
          rows={4}
          maxLength={500}
        />
      ) : (
        <p className="whitespace-pre-wrap text-white/70">{bio}</p>
      )}

      {isOwnProfile && editMode && (
        <p className="mt-2 text-right text-xs text-white/40">{editedBio.length} / 500 characters</p>
      )}
    </GlassCard>
  );
}
