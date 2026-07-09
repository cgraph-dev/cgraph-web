/**
 * Hook for profile action operations.
 */
import { useState} from 'react';
import { useFriendStore } from '@/modules/social/store';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

// Profile Actions Hook (Friend requests, messaging, etc.)

interface UseProfileActionsReturn {
  isActioning: boolean;
  handleSendRequest: () => Promise<void>;
  handleAcceptRequest: () => Promise<void>;
  handleRemoveFriend: () => Promise<void>;
}

/**
 */
/**
 * Hook for managing profile actions.
 *
 * @param profile - The profile.
 * @param setFriendshipStatus - The set friendship status.
 */
export function useProfileActions(
  profile: UserProfileData | null,
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>
): UseProfileActionsReturn {
  const { sendRequest, acceptRequest, removeFriend } = useFriendStore();
  const [isActioning, setIsActioning] = useState(false);

  async function handleSendRequest() {
    if (!profile) return;
    setIsActioning(true);
    try {
      await sendRequest(profile.username);
      setFriendshipStatus('pending_sent');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  }

  async function handleAcceptRequest() {
    if (!profile) return;
    setIsActioning(true);
    try {
      await acceptRequest(profile.id);
      setFriendshipStatus('friends');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  }

  async function handleRemoveFriend() {
    if (!profile) return;
    setIsActioning(true);
    try {
      await removeFriend(profile.id);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  }

  return {
    isActioning,
    handleSendRequest,
    handleAcceptRequest,
    handleRemoveFriend,
  };
}
