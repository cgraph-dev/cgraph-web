/**
 * WelcomeStep component - avatar upload and display name
 */

import { motion } from 'motion/react';
import {
  AvatarUploadCropper,
  type CroppedAvatarPayload,
} from '@/components/avatar/avatar-upload-cropper';
import { containerVariants, itemVariants } from './animations';

interface WelcomeStepProps {
  avatarPreview: string | null;
  displayName: string;
  onAvatarCropped: (payload: CroppedAvatarPayload) => void;
  onDisplayNameChange: (name: string) => void;
}

/**
 * Welcome Step component.
 */
export function WelcomeStep({
  avatarPreview,
  displayName,
  onAvatarCropped,
  onDisplayNameChange,
}: WelcomeStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Avatar Upload */}
      <motion.div variants={itemVariants} className="flex flex-col items-center">
        <AvatarUploadCropper
          avatarUrl={avatarPreview}
          displayName={displayName}
          size="xlarge"
          label="Set your avatar"
          helperText="Crop it now so it looks good in chats, profile cards, and the sidebar."
          onAvatarCropped={onAvatarCropped}
        />
      </motion.div>

      {/* Display Name */}
      <motion.div variants={itemVariants}>
        <label className="mb-2 block text-sm font-medium text-gray-300">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="How should we call you?"
          className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-white/30 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </motion.div>
    </motion.div>
  );
}
