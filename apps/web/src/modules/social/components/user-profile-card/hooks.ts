/**
 * User Profile Card Hooks
 *
 * Custom hooks for profile card state and behavior
 */

import { createLogger } from '@/lib/logger';
import { publicProfilePath } from '@/lib/profile-route';

const logger = createLogger('UserProfileCard');

/**
 * Hook for profile card navigation actions
 */
export function useProfileCardNavigation(userId: string, username?: string | null) {
  function handleViewProfile() {
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.warn('UserProfileCard: Cannot view profile - invalid userId');
      return;
    }
    window.location.href = publicProfilePath({ id: userId, username });
  }

  function handleMessage() {
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.warn('UserProfileCard: Cannot message - invalid userId');
      return;
    }
    window.location.href = `/messages?userId=${userId}`;
  }

  return { handleViewProfile, handleMessage };
}

/**
 * Hook for getting user's avatar border
 */
export function useUserBorder(
  userId: string,
  currentUserId: string | undefined,
  userAvatarBorderId: string | undefined,
  getEquippedBorder: () => unknown,
  getBorderByIdFn: (id: string) => unknown
) {
  const isOwnProfile = userId === currentUserId;

  const userBorder = isOwnProfile
    ? getEquippedBorder()
    : userAvatarBorderId
      ? getBorderByIdFn(userAvatarBorderId)
      : undefined;

  return { isOwnProfile, userBorder };
}
