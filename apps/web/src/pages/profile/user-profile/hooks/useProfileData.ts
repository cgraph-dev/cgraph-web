/**
 * Custom hook for fetching and managing profile data
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import { http } from '@/lib/api-client';
import { asStringOrNull, isRecord } from '@/lib/api-utils';
import { identityFieldsFromApi } from '@/lib/identity';
import { resolveAvatarUrl, resolveAvatarUrlFromRecord, resolveMediaUrl } from '@/lib/media-url';
import { profileApiPathForHandle, type ProfileLookupMode } from '@/lib/profile-route';
import { resolveFriendshipStatus } from '@/modules/social/friendship-status';
import type { Achievement } from '@cgraph-dev/shared-types';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('useProfileData');

/** Stable empty array for stub achievements (avoids new reference each render) */
const EMPTY_ACHIEVEMENTS: Achievement[] = [];
const COSMETIC_ID_KEYS = [
  'id',
  'itemId',
  'item_id',
  'titleId',
  'title_id',
  'nameplateId',
  'nameplate_id',
  'profileTheme',
  'profile_theme',
  'profileThemeId',
  'profile_theme_id',
  'avatarBorderId',
  'avatar_border_id',
] as const;

type ProfileTopCommunity = NonNullable<UserProfileData['topCommunities']>[number];

interface UseProfileDataOptions {
  profileHandle: string | undefined;
  lookupMode: ProfileLookupMode;
  isOwnProfile: boolean;
}

interface UseProfileDataReturn {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  friendshipStatus: FriendshipStatus;
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>;
  unlockedAchievements: Achievement[];
  totalUnlocked: number;
  showAllAchievements: boolean;
  setShowAllAchievements: React.Dispatch<React.SetStateAction<boolean>>;
}

function profileStatusFromIdentity(status: unknown): UserProfileData['status'] {
  switch (status) {
    case 'online':
    case 'idle':
    case 'dnd':
    case 'offline':
      return status;
    default:
      return 'offline';
  }
}

function cosmeticIdFromApi(value: unknown): string | null {
  const direct = asStringOrNull(value);
  if (direct !== null) return direct;
  if (!isRecord(value)) return null;

  for (const key of COSMETIC_ID_KEYS) {
    const nested = asStringOrNull(value[key]);
    if (nested !== null) return nested;
  }

  return null;
}

function firstCosmeticId(...values: unknown[]): string | null {
  for (const value of values) {
    const id = cosmeticIdFromApi(value);
    if (id !== null) return id;
  }

  return null;
}

function profileStringFromApi(value: unknown): string | null {
  const text = asStringOrNull(value);
  if (text === null) return null;

  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstProfileString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = profileStringFromApi(value);
    if (text !== null) return text;
  }

  return null;
}

function optionalProfileNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstProfileNumber(values: unknown[], fallback: number): number {
  for (const value of values) {
    const numberValue = optionalProfileNumber(value);
    if (numberValue !== undefined) return numberValue;
  }

  return fallback;
}

function profileBooleanFromApi(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }

  return false;
}

function profileWebsiteFromApi(value: unknown): string | undefined {
  const website = profileStringFromApi(value);
  if (website === null) return undefined;

  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(website);
  if (hasProtocol && !/^https?:\/\//i.test(website)) return undefined;

  const href = hasProtocol ? website : `https://${website}`;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? href : undefined;
  } catch {
    return undefined;
  }
}

function profileDateFromApi(...values: unknown[]): string {
  for (const value of values) {
    const date = profileStringFromApi(value);
    if (date !== null && Number.isFinite(Date.parse(date))) return date;
  }

  return new Date().toISOString();
}

function topCommunitiesFromApi(value: unknown): ProfileTopCommunity[] {
  if (!Array.isArray(value)) return [];

  const communities: ProfileTopCommunity[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const forumId = firstProfileString(item.forumId, item.forum_id);
    const forumName = firstProfileString(item.forumName, item.forum_name);
    if (forumId === null || forumName === null) continue;

    communities.push({
      forumId,
      forumName,
      score: firstProfileNumber([item.score], 0),
      tier: profileStringFromApi(item.tier) ?? 'newcomer',
    });
  }

  return communities;
}

/**
 */
/**
 * Hook for managing profile data.
 */
export function useProfileData({
  profileHandle,
  lookupMode,
  isOwnProfile,
}: UseProfileDataOptions): UseProfileDataReturn {
  // Gamification defaults — data comes from API response, these are fallbacks
  const achievements = EMPTY_ACHIEVEMENTS;
  const myLevel = 1;
  const myTotalXP = 0;
  const myStreak = 0;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Calculate total unlocked achievements
  const totalUnlocked = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements]
  );

  // Calculate unlocked achievements for display
  const unlockedAchievements = useMemo(() => {
    if (!isOwnProfile) return [];
    return achievements.filter((a) => a.unlocked).slice(0, showAllAchievements ? undefined : 6);
  }, [achievements, isOwnProfile, showAllAchievements]);

  // Refs for gamification values used as fallbacks in fetch (not as triggers)
  const myLevelRef = useRef(myLevel);
  const myTotalXPRef = useRef(myTotalXP);
  const myStreakRef = useRef(myStreak);
  const totalUnlockedRef = useRef(totalUnlocked);

  useEffect(() => {
    myLevelRef.current = myLevel;
    myTotalXPRef.current = myTotalXP;
    myStreakRef.current = myStreak;
    totalUnlockedRef.current = totalUnlocked;
  }, [myLevel, myTotalXP, myStreak, totalUnlocked]);

  // Fetch profile data
  useEffect(() => {
    if (!profileHandle) return;

    const handle = profileHandle;
    const controller = new AbortController();

    async function fetchProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await http.get(profileApiPathForHandle(handle, lookupMode), {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        // Backend wraps in { data: { ... } }, axios also puts body in .data
        const userData = response.data?.data || response.data?.user || response.data;
        const identity = identityFieldsFromApi(userData);

        setProfile({
          id: firstProfileString(identity.id, userData.id) ?? handle,
          username: firstProfileString(identity.username, userData.username) ?? handle,
          displayName: firstProfileString(
            identity.displayName,
            userData.displayName,
            userData.display_name
          ),
          avatarUrl:
            resolveAvatarUrl(identity.avatarUrl) ?? resolveAvatarUrlFromRecord(userData),
          bannerUrl:
            resolveMediaUrl(identity.bannerUrl) ??
            resolveMediaUrl(profileStringFromApi(userData.banner_url)) ??
            null,
          bio: profileStringFromApi(userData.bio),
          status: profileStatusFromIdentity(identity.status || userData.status),
          statusMessage: firstProfileString(
            identity.statusMessage,
            userData.statusMessage,
            userData.custom_status,
            userData.status_message
          ),
          isVerified: profileBooleanFromApi(userData.isVerified, userData.is_verified),
          isPremium: profileBooleanFromApi(userData.isPremium, userData.is_premium),
          createdAt: profileDateFromApi(userData.inserted_at, userData.created_at),
          topCommunities: topCommunitiesFromApi(userData.topCommunities ?? userData.top_communities),
          mutualFriends: optionalProfileNumber(userData.mutual_friends_count),
          location: profileStringFromApi(userData.location) ?? undefined,
          website: profileWebsiteFromApi(userData.website),
          // Gamification stats (from API or own data if own profile)
          level: firstProfileNumber([userData.level], isOwnProfile ? myLevelRef.current : 1),
          totalXP: firstProfileNumber(
            [userData.total_xp, userData.xp],
            isOwnProfile ? myTotalXPRef.current : 0
          ),
          currentXP: firstProfileNumber([userData.current_xp], 0),
          loginStreak: firstProfileNumber(
            [userData.login_streak, userData.streak_days],
            isOwnProfile ? myStreakRef.current : 0
          ),
          achievementCount:
            firstProfileNumber(
              [userData.achievement_count],
              isOwnProfile ? totalUnlockedRef.current : 0
            ),
          totalAchievements: firstProfileNumber([userData.total_achievements], achievements.length),
          messagesSent: firstProfileNumber([userData.messages_sent], 0),
          postsCreated: firstProfileNumber([userData.posts_created], 0),
          friendsCount: firstProfileNumber([userData.friends_count], 0),
          // Title system - equipped title ID
          equippedTitle: firstCosmeticId(
            identity.equippedTitleId ??
              userData.equippedTitleId ??
              userData.equipped_title_id ??
              userData.title_id,
            userData.equipped_title,
            userData.current_title
          ),
          profileTheme: firstCosmeticId(
            identity.profileTheme ?? userData.profileTheme ?? userData.profile_theme_id,
            userData.profile_theme
          ),
          avatarBorderId: firstCosmeticId(
            identity.avatarBorderId ?? userData.avatarBorderId ?? userData.avatar_border_id,
            userData.avatar_border
          ),
          equippedNameplateId: firstCosmeticId(
            identity.equippedNameplateId ??
              userData.equippedNameplateId ??
              userData.equipped_nameplate_id ??
              userData.nameplateId ??
              userData.nameplate_id,
            userData.equipped_nameplate,
            userData.nameplate
          ),
          displayNameFont: firstProfileString(
            identity.displayNameFont,
            userData.displayNameFont,
            userData.display_name_font
          ),
          displayNameEffect: firstProfileString(
            identity.displayNameEffect,
            userData.displayNameEffect,
            userData.display_name_effect
          ),
          displayNameColor: firstProfileString(
            identity.displayNameColor,
            userData.displayNameColor,
            userData.display_name_color
          ),
          displayNameSecondaryColor: firstProfileString(
            identity.displayNameSecondaryColor,
            userData.displayNameSecondaryColor,
            userData.display_name_secondary_color
          ),
        });

        setFriendshipStatus(
          resolveFriendshipStatus(
            {
              id: identity.id || (typeof userData.id === 'string' ? userData.id : handle),
              friendship_status: userData.friendship_status,
              is_blocked: userData.is_blocked,
              is_friend: userData.is_friend,
              friend_request_received: userData.friend_request_received,
              friend_request_sent: userData.friend_request_sent,
            },
            {}
          )
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        logger.error('Failed to load profile:', err);
        setError('Failed to load user profile');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchProfile();
    return () => controller.abort();
  }, [profileHandle, lookupMode, isOwnProfile, achievements.length]);

  return {
    profile,
    setProfile,
    isLoading,
    error,
    friendshipStatus,
    setFriendshipStatus,
    unlockedAchievements,
    totalUnlocked,
    showAllAchievements,
    setShowAllAchievements,
  };
}
