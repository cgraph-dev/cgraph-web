/**
 * Profile card preview component (large panel variant).
 * Uses NewProfileCard in 'preview' mode — cosmetics read via useProfileCardData.
 */

import { memo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { NewProfileCard, useProfileCardData } from '@/modules/social/components/user-profile-card';
import type { ProfileCardUser } from '@/modules/social/components/user-profile-card';

export const ProfileCardPreviewLarge = memo(function ProfileCardPreviewLarge() {
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

  return (
    <div className="flex justify-center">
      <NewProfileCard user={enrichedUser} mode="preview" className="w-[360px]" />
    </div>
  );
});
