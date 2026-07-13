/**
 * Profile blocked users and media store actions.
 */
import { apiClient, http } from '@/lib/api-client';
import { ensureArray, isRecord, asString, asBool, asEnum } from '@/lib/api-utils';
import { uploadCurrentUserAvatarAndSync } from '@/lib/avatar-upload';
import { applyOwnIdentityPatch } from '@/lib/identity/ownIdentitySync';
import { createLogger } from '@/lib/logger';
import type { BlockedUser as ApiBlockedUser } from '@cgraph-dev/api-client';
import type { StoreApi } from 'zustand';
import { removeBlockedUserFromFriendCaches } from './friendStore.sync';
import type {
  BlockedUser,
  BlockedUsersPage,
  FetchBlockedUsersOptions,
  ProfileField,
  ProfileState,
} from './profileStore.types';

const logger = createLogger('profileStore');

type Set = StoreApi<ProfileState>['setState'];
type Get = () => ProfileState;

const DEFAULT_BLOCKED_USER_PAGE_SIZE = 50;

function toBlockedUser(entry: ApiBlockedUser): BlockedUser {
  const user = entry.user;

  return {
    id: user?.id ?? entry.blocked_user_id ?? entry.id,
    username: user?.username ?? entry.username ?? '',
    displayName: user?.display_name ?? entry.display_name ?? null,
    avatarUrl: user?.avatar_url ?? entry.avatar_url ?? null,
    blockedAt: entry.blocked_at ?? entry.created_at ?? '',
  };
}

function mergeBlockedUsers(current: BlockedUser[], next: BlockedUser[]): BlockedUser[] {
  const existingIds = new Set(current.map((user) => user.id));
  return current.concat(next.filter((user) => !existingIds.has(user.id)));
}

function blockedUsersError(result: { error: { message: string } }): Error {
  return new Error(result.error.message || 'Failed to update blocked users');
}

/** Fetch the list of blocked users. */
export function createFetchBlockedUsers(set: Set) {
  return async (options: FetchBlockedUsersOptions = {}): Promise<BlockedUsersPage> => {
    set({ isLoadingBlocked: true });

    try {
      const result = await apiClient.friends.getBlockedUsers({
        cursor: options.cursor,
        limit: options.limit ?? DEFAULT_BLOCKED_USER_PAGE_SIZE,
        include_total: options.includeTotal,
      });

      if (!result.ok) throw blockedUsersError(result);

      const blockedUsers = result.data.map(toBlockedUser);
      set((state) => ({
        blockedUsers: options.append
          ? mergeBlockedUsers(state.blockedUsers, blockedUsers)
          : blockedUsers,
        isLoadingBlocked: false,
      }));

      return {
        endCursor: result.pageInfo?.end_cursor ?? null,
        hasNextPage: result.pageInfo?.has_next_page ?? false,
        totalCount: result.pageInfo?.total_count ?? null,
      };
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
      const result = await apiClient.friends.blockUser(userId, reason);
      if (!result.ok) throw blockedUsersError(result);

      // Refresh blocked list
      await get().fetchBlockedUsers({ includeTotal: true });
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
      const result = await apiClient.friends.unblockUser(userId);
      if (!result.ok) throw blockedUsersError(result);

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
