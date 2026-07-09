/**
 * Profile blocked users and media store actions.
 */
import { http } from '@/lib/api-client';
import { ensureArray, isRecord, asString, asBool, asOptionalString, asEnum } from '@/lib/api-utils';
import { uploadCurrentUserAvatarAndSync } from '@/lib/avatar-upload';
import { applyOwnIdentityPatch } from '@/lib/identity/ownIdentitySync';
import { createLogger } from '@/lib/logger';
import type { StoreApi } from 'zustand';
import { removeBlockedUserFromFriendCaches } from './friendStore.sync';
import type { ProfileField, ProfileState } from './profileStore.types';

const logger = createLogger('profileStore');

type Set = StoreApi<ProfileState>['setState'];
type Get = () => ProfileState;

/** Fetch the list of blocked users. */
export function createFetchBlockedUsers(set: Set) {
  return async () => {
    set({ isLoadingBlocked: true });
    try {
      const response = await http.get('/api/v1/friends/blocked');
      const blockedUsers = ensureArray(response.data, 'blocked')
        .filter(isRecord)
        .map((entry) => {
          const user = isRecord(entry.user) ? entry.user : entry;
          return {
            id: asString(user.id),
            username: asString(user.username),
            displayName: asString(user.display_name) || null,
            avatarUrl: asString(user.avatar_url) || null,
            blockedAt: asString(entry.blocked_at),
            reason: asOptionalString(entry.reason),
          };
        });
      set({ blockedUsers, isLoadingBlocked: false });
    } catch (error) {
      logger.error('Failed to fetch blocked users:', error);
      set({ isLoadingBlocked: false });
      throw error;
    }
  };
}

/** Block a user. */
export function createBlockUser(set: Set, get: Get) {
  return async (userId: string, reason?: string) => {
    try {
      await http.post(`/api/v1/friends/${userId}/block`, {
        reason,
      });
      // Refresh blocked list
      await get().fetchBlockedUsers();
      // Update current profile if viewing blocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({
          currentProfile: {
            ...current,
            isFriend: false,
            isBlocked: true,
            friendshipStatus: 'blocked',
          },
        });
      }

      // Remove blocked user from friend store (friends list + pending requests + presence)
      removeBlockedUserFromFriendCaches(userId);
    } catch (error) {
      logger.error('Failed to block user:', error);
      throw error;
    }
  };
}

/** Unblock a user. */
export function createUnblockUser(set: Set, get: Get) {
  return async (userId: string) => {
    try {
      await http.delete(`/api/v1/friends/${userId}/block`);
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
      }));
      // Update current profile if viewing unblocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({
          currentProfile: {
            ...current,
            isFriend: false,
            isBlocked: false,
            friendshipStatus: 'none',
          },
        });
      }
    } catch (error) {
      logger.error('Failed to unblock user:', error);
      throw error;
    }
  };
}

/** Check if a user is blocked. */
export function createIsUserBlocked(get: Get) {
  return (userId: string) => {
    return get().blockedUsers.some((u) => u.id === userId);
  };
}

/** Upload an avatar image. */
export function createUploadAvatar(set: Set) {
  return async (file: File) => {
    const result = await uploadCurrentUserAvatarAndSync(file);
    const avatarUrl = result.user?.avatarUrl ?? result.avatarUrl;

    applyOwnIdentityPatch({ avatarUrl });
    set((state) => ({
      myProfile: state.myProfile ? { ...state.myProfile, avatarUrl } : null,
    }));

    return avatarUrl;
  };
}

/** Fetch available profile fields. */
export function createFetchProfileFields(set: Set) {
  return async () => {
    try {
      const response = await http.get('/api/v1/profile-fields');
      const fields = ensureArray(response.data, 'fields')
        .filter(isRecord)
        .map((f) => ({
          id: asString(f.id),
          name: asString(f.name),

          type: asEnum<ProfileField['type']>(
            f.type,
            ['text', 'textarea', 'select', 'url', 'date'],
            'text'
          ),
          value: null,
          options: Array.isArray(f.options)
            ? f.options.filter((o): o is string => typeof o === 'string')
            : undefined,
          required: asBool(f.required),
          editable: asBool(f.editable, true),
          visible: asBool(f.visible, true),
        }));
      set({ availableFields: fields });
    } catch (error) {
      logger.error('Failed to fetch profile fields:', error);
    }
  };
}

/** Clear the currently viewed profile. */
export function createClearProfile(set: Set) {
  return () => {
    set({
      currentProfile: null,
      profileError: null,
    });
  };
}
