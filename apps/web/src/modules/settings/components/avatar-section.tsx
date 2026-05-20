/**
 * Profile avatar upload and display section.
 */
import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import {
  AvatarUploadCropper,
  type CroppedAvatarPayload,
} from '@/components/avatar/avatar-upload-cropper';
import { toast } from '@/components/feedback/toast';
import { getAvatarBorderId } from '@/lib/utils';
import { uploadCurrentUserAvatar } from '@/lib/avatar-upload';
import { useAuthStore } from '@/modules/auth/store';
import type { User } from '@/modules/auth/store/authStore.types';

interface AvatarSectionProps {
  user: User | null;
}

/**
 */
/**
 * Avatar Section component.
 */
export function AvatarSection({ user }: AvatarSectionProps) {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAvatarCropped(payload: CroppedAvatarPayload) {
    if (!user) return;

    setIsSaving(true);
    try {
      const avatarUrl = await uploadCurrentUserAvatar(payload.blob);
      if (!avatarUrl) throw new Error('Avatar URL missing from upload response');

      updateUser({ avatarUrl });
      toast.success('Avatar updated');
    } catch {
      toast.error('Could not update avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GlassCard variant="crystal" className="aurora-social-panel relative mb-6 overflow-hidden p-6">
      <div className="via-primary-500/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
      <label className="mb-4 block text-sm font-semibold text-[var(--token-text-secondary)]">
        Profile Picture
      </label>
      <AvatarUploadCropper
        avatarUrl={user?.avatarUrl}
        displayName={user?.displayName || user?.username}
        avatarBorderId={getAvatarBorderId(user)}
        disabled={isSaving || !user}
        maxFileSizeMb={5}
        size="large"
        label={isSaving ? 'Saving avatar...' : 'Avatar preview'}
        helperText="Crop once and it updates your profile, sidebar, chats, and profile cards."
        onAvatarCropped={handleAvatarCropped}
      />
    </GlassCard>
  );
}
