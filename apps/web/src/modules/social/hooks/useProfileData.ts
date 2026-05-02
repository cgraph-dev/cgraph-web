/**
 * Hook for profile data fetching with abort-on-change semantics.
 *
 * When the `userId` route param changes (or the component unmounts) the
 * previous request is aborted, which prevents stale `setProfile` calls
 * that otherwise cause an infinite-spinner bug when navigating quickly
 * between profiles.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('useProfileData');

interface OwnStats {
  readonly level: number;
  readonly totalXP: number;
  readonly loginStreak: number;
  readonly totalUnlocked: number;
}

export interface UseProfileDataReturn {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  friendshipStatus: FriendshipStatus;
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>;
  refreshProfile: () => Promise<void>;
}

const STATUS_VALUES: readonly UserProfileData['status'][] = ['online', 'idle', 'dnd', 'offline'];
const FRIENDSHIP_VALUES: readonly FriendshipStatus[] = [
  'none',
  'pending_sent',
  'pending_received',
  'friends',
  'blocked',
];

function toStatus(value: unknown): UserProfileData['status'] {
  if (typeof value !== 'string') return 'offline';
  const match = STATUS_VALUES.find((candidate) => candidate === value);
  return match ?? 'offline';
}

function toFriendshipStatus(value: unknown): FriendshipStatus {
  if (typeof value !== 'string') return 'none';
  const match = FRIENDSHIP_VALUES.find((candidate) => candidate === value);
  return match ?? 'none';
}

function isCommunityRecord(value: unknown): value is {
  forumId: string;
  forumName: string;
  score: number;
  tier: string;
} {
  if (!value || typeof value !== 'object') return false;
  const record: Record<string, unknown> = { ...value };
  return (
    typeof record.forumId === 'string' &&
    typeof record.forumName === 'string' &&
    typeof record.score === 'number' &&
    typeof record.tier === 'string'
  );
}

function toTopCommunities(value: unknown): UserProfileData['topCommunities'] {
  if (!Array.isArray(value)) return [];
  const result: NonNullable<UserProfileData['topCommunities']> = [];
  for (const entry of value) {
    if (isCommunityRecord(entry)) {
      result.push({
        forumId: entry.forumId,
        forumName: entry.forumName,
        score: entry.score,
        tier: entry.tier,
      });
    }
  }
  return result;
}

/**
 * Normalise a raw server user payload into the client-side `UserProfileData`
 * shape, falling back to caller-supplied stats for fields the server may omit.
 */
function mapUserDataToProfile(
  userData: Record<string, unknown>,
  own: boolean,
  stats: OwnStats
): UserProfileData {
  const num = (key: string, fallback = 0): number => {
    const value = userData[key];
    return typeof value === 'number' ? value : fallback;
  };
  const str = (key: string): string | null => {
    const value = userData[key];
    return typeof value === 'string' ? value : null;
  };

  return {
    id: typeof userData.id === 'string' ? userData.id : '',
    username: typeof userData.username === 'string' ? userData.username : '',
    displayName: str('display_name'),
    avatarUrl: str('avatar_url'),
    bannerUrl: str('banner_url'),
    bio: str('bio'),
    status: toStatus(userData.status),
    statusMessage: str('custom_status') ?? str('status_message'),
    isVerified: Boolean(userData.is_verified),
    isPremium: Boolean(userData.is_premium),
    createdAt:
      typeof userData.inserted_at === 'string'
        ? userData.inserted_at
        : typeof userData.created_at === 'string'
          ? userData.created_at
          : '',
    topCommunities: toTopCommunities(userData.top_communities),
    mutualFriends: num('mutual_friends_count'),
    location: str('location') ?? undefined,
    website: str('website') ?? undefined,
    level: num('level', own ? stats.level : 1),
    totalXP: num('total_xp', own ? stats.totalXP : 0),
    currentXP: num('current_xp'),
    loginStreak: num('login_streak', own ? stats.loginStreak : 0),
    achievementCount: num('achievement_count', own ? stats.totalUnlocked : 0),
    totalAchievements: num('total_achievements'),
    messagesSent: num('messages_sent'),
    postsCreated: num('posts_created'),
    friendsCount: num('friends_count'),
    equippedTitle: str('equipped_title') ?? str('title_id'),
    avatarBorderId: str('avatar_border_id'),
    profileTheme: str('profile_theme'),
    displayNameFont: str('display_name_font') ?? str('name_font'),
    displayNameEffect: str('display_name_effect') ?? str('name_effect'),
    displayNameColor: str('display_name_color') ?? str('name_color'),
    displayNameSecondaryColor: str('display_name_secondary_color'),
  };
}

/**
 * Fetch a user profile with abort-on-change semantics.
 *
 * A fresh `AbortController` is created each time `userId` changes; the
 * previous request is aborted so stale responses can never call `setProfile`
 * against the wrong target user.
 */
export function useProfileData(
  userId: string | undefined,
  isOwnProfile: boolean,
  ownStats: OwnStats
): UseProfileDataReturn {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');

  const isOwnProfileRef = useRef(isOwnProfile);
  isOwnProfileRef.current = isOwnProfile;
  const ownStatsRef = useRef(ownStats);
  ownStatsRef.current = ownStats;
  const activeControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(
    async (targetUserId: string, signal: AbortSignal): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await http.get(`/api/v1/users/${targetUserId}`, { signal });
        if (signal.aborted) return;

        const userData: Record<string, unknown> = response.data?.user ?? response.data ?? {};

        setProfile(mapUserDataToProfile(userData, isOwnProfileRef.current, ownStatsRef.current));
        setFriendshipStatus(toFriendshipStatus(userData.friendship_status));
      } catch (err: unknown) {
        if (axios.isCancel(err) || signal.aborted) return;
        logger.error('Failed to load profile', err);
        setError('Failed to load user profile');
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    void fetchProfile(userId, controller.signal);

    return () => {
      controller.abort();
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    };
  }, [userId, fetchProfile]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!userId) return;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    await fetchProfile(userId, controller.signal);
  }, [userId, fetchProfile]);

  return {
    profile,
    setProfile,
    isLoading,
    error,
    friendshipStatus,
    setFriendshipStatus,
    refreshProfile,
  };
}
