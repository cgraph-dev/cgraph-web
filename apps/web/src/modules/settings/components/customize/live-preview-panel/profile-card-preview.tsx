/**
 * ProfileCardPreview - Profile card preview with live customization.
 * Uses the new NewProfileCard in 'preview' mode — customization store
 * reading is handled internally by useProfileCardData.
 */

import { memo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { NewProfileCard, useProfileCardData } from '@/modules/social/components/user-profile-card';
import type { ProfileCardUser } from '@/modules/social/components/user-profile-card';

export const ProfileCardPreview = memo(function ProfileCardPreview() {
  const user = useAuthStore((s) => s.user);

  const profileUser: ProfileCardUser = {
    id: user?.id ?? '',
    username: user?.username ?? 'you',
    displayName: user?.displayName ?? user?.username ?? 'You',
    avatarUrl: user?.avatarUrl ?? '',
    bio: user?.bio,
    level: 0,
    xp: 0,
    xpToNextLevel: 100,
    pulse: user?.pulse ?? 0,
    streak: user?.streak ?? 0,
    isOnline: true,
  };

  const enrichedUser = useProfileCardData(profileUser, 'preview');
  const previewKey = [
    enrichedUser.accentTheme ?? enrichedUser.profile_theme ?? 'theme',
    enrichedUser.avatarUrl ?? 'avatar',
    enrichedUser.avatarBorderId ?? 'border',
    enrichedUser.nameplateId ?? enrichedUser.equipped_nameplate ?? 'nameplate',
    enrichedUser.equippedTitle?.id ?? 'title',
  ].join(':');

  return (
    <div className="flex justify-center">
      <NewProfileCard
        key={previewKey}
        user={enrichedUser}
        mode="preview"
        variant="mini"
        className="w-[288px] max-w-full"
      />
    </div>
  );
});
