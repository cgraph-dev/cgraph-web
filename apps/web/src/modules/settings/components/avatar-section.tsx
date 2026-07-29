import { useState } from 'react';
import { Card } from '@/shared/components/ui';
import {
  AvatarUploadCropper,
  type CroppedAvatarPayload,
} from '@/components/avatar/avatar-upload-cropper';
import { toast } from '@/shared/components/ui';
import { getAvatarBorderId } from '@/lib/utils';
import { uploadCurrentUserAvatarAndSync } from '@/lib/avatar-upload';
import { applyOwnIdentityPatch } from '@/lib/identity/ownIdentitySync';
import { useAuthStore } from '@/modules/auth/store';
import { getApiErrorMessage } from '@/modules/auth/store/authStore.utils';
import type { User } from '@/modules/auth/store/authStore.types';

interface AvatarSectionProps {
  user: User | null;
}

export function AvatarSection({ user }: AvatarSectionProps) {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAvatarCropped(payload: CroppedAvatarPayload) {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await uploadCurrentUserAvatarAndSync(payload.file);
      const userPatch: Partial<User> = result.user
        ? {
            avatarUrl: result.user.avatarUrl ?? result.avatarUrl,
            avatarBorderId: result.user.avatarBorderId,
            equippedTitleId: result.user.equippedTitleId,
            equippedBadgeIds: result.user.equippedBadgeIds,
            equippedNameplateId: result.user.equippedNameplateId,
            profileTheme: result.user.profileTheme,
            chatTheme: result.user.chatTheme,
            displayName: result.user.displayName,
            username: result.user.username,
            bio: result.user.bio,
            pronouns: result.user.pronouns,
          }
        : { avatarUrl: result.avatarUrl };

      updateUser(userPatch);
      applyOwnIdentityPatch({
        avatarUrl: userPatch.avatarUrl,
        avatarBorderId: userPatch.avatarBorderId,
        equippedTitleId: userPatch.equippedTitleId,
        equippedBadgeIds: userPatch.equippedBadgeIds,
        equippedNameplateId: userPatch.equippedNameplateId,
        profileTheme: userPatch.profileTheme,
        chatTheme: userPatch.chatTheme,
      });
      toast.success('Avatar updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update avatar. Please try again.'));
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card padding="lg">
      <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
        Profile picture
      </h2>
      <AvatarUploadCropper
        avatarUrl={user?.avatarUrl}
        displayName={user?.displayName || user?.username}
        avatarBorderId={getAvatarBorderId(user)}
        disabled={isSaving || !user}
        maxFileSizeMb={5}
        size="large"
        saveLabel="Save avatar"
        label={isSaving ? 'Saving avatar...' : 'Avatar preview'}
        helperText="Crop once and it updates your profile, sidebar, chats, and profile cards."
        onAvatarCropped={handleAvatarCropped}
      />
    </Card>
  );
}
