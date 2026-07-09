/**
 * Mappers for transforming API profile response data.
 */
import {
  ensureArray,
  isRecord,
  asString,
  asNumber,
  asBool,
  asOptionalString,
} from '@/lib/api-utils';
import { identityFieldsFromApi } from '@/lib/identity';
import { resolveAvatarUrl, resolveAvatarUrlFromRecord } from '@/lib/media-url';
import { resolveFriendshipStatus } from '@/modules/social/friendship-status';
import type { UserBadge, ExtendedProfile } from './profileStore.types';
/** Safely extract a string or null from an unknown value */
function asNullableString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

/**
 * Narrows an unknown value to one of the allowed union members.
 * Returns the fallback if the value is not in the allowed set.
 */
function asOneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof v !== 'string') {
    return fallback;
  }

  return allowed.find((item) => item === v) ?? fallback;
}

const TITLE_TYPES = ['system', 'custom', 'earned'] as const;
const BADGE_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
const STATUS_VALUES = ['online', 'away', 'busy', 'dnd', 'offline'] as const;
function mapBadge(b: Record<string, unknown>): UserBadge {
  return {
    id: asString(b.id),
    name: asString(b.name),
    description: asString(b.description),
    iconUrl: asString(b.icon_url),
    color: asString(b.color, '#6366f1'),
    rarity: asOneOf(b.rarity, BADGE_RARITIES, 'common'),
    earnedAt: asString(b.earned_at, new Date().toISOString()),
    isEquipped: asBool(b.is_equipped),
  };
}

/**
 * Maps a raw API response object to an ExtendedProfile.
 */
export function mapProfileFromApi(data: Record<string, unknown>): ExtendedProfile {
  const user: Record<string, unknown> = isRecord(data.user) ? data.user : data;
  const identity = identityFieldsFromApi(user);
  const currentTitleObj: Record<string, unknown> | null = isRecord(user.current_title)
    ? user.current_title
    : null;
  const friendshipStatus = resolveFriendshipStatus(
    {
      id: identity.id,
      friendship_status: user.friendship_status,
      is_blocked: user.is_blocked,
      is_friend: user.is_friend,
      friend_request_received: user.friend_request_received,
      friend_request_sent: user.friend_request_sent,
    },
    {}
  );

  return {
    id: identity.id,

    username: identity.username,

    displayName: identity.displayName,

    avatarUrl: resolveAvatarUrl(identity.avatarUrl) ?? resolveAvatarUrlFromRecord(user),

    avatarBorderId: identity.avatarBorderId,

    bannerUrl: identity.bannerUrl,

    bio: asNullableString(user.bio),

    signature: {
      enabled: asBool(user.signature_enabled),
      content: asString(user.signature),
      maxLength: asNumber(user.signature_max_length, 500),
    },

    location: asNullableString(user.location),

    website: asNullableString(user.website),

    occupation: asNullableString(user.occupation),

    interests: asNullableString(user.interests),

    birthDate: asNullableString(user.birth_date),

    showBirthDate: asBool(user.show_birth_date),

    gender: asNullableString(user.gender),

    socialLinks: {
      twitter: asOptionalString(user.twitter),
      github: asOptionalString(user.github),
      discord: asOptionalString(user.discord),
      youtube: asOptionalString(user.youtube),
      twitch: asOptionalString(user.twitch),
      instagram: asOptionalString(user.instagram),
      linkedin: asOptionalString(user.linkedin),
    },

    customFields: ensureArray(user.custom_fields, 'custom_fields'),

    currentTitle: currentTitleObj
      ? {
          id: String(currentTitleObj.id ?? ''),
          name: String(currentTitleObj.name ?? ''),
          color: String(currentTitleObj.color ?? ''),
          type: asOneOf(currentTitleObj.type, TITLE_TYPES, 'system'),
        }
      : null,

    equippedTitleId: identity.equippedTitleId,

    availableTitles: ensureArray(user.available_titles, 'available_titles')
      .filter(isRecord)
      .map((t) => ({
        id: asString(t.id),
        name: asString(t.name),
        color: asString(t.color, '#ffffff'),
        type: asOneOf(t.type, TITLE_TYPES, 'system'),
      })),

    badges: ensureArray(user.badges, 'badges').filter(isRecord).map(mapBadge),

    equippedBadges: ensureArray(user.equipped_badges, 'equipped_badges')
      .filter(isRecord)
      .map((b) => ({
        ...mapBadge(b),
        isEquipped: true as const,
      })),

    equippedBadgeIds: identity.equippedBadgeIds,

    equippedNameplateId: identity.equippedNameplateId,

    profileTheme: identity.profileTheme,

    chatTheme: identity.chatTheme,

    displayNameFont: identity.displayNameFont,

    displayNameEffect: identity.displayNameEffect,

    displayNameColor: identity.displayNameColor,

    displayNameSecondaryColor: identity.displayNameSecondaryColor,

    stars: {
      count: Math.min(5, Math.floor(asNumber(user.post_count) / 100) + 1),
      color: '#fbbf24',
    },

    isProfilePrivate: asBool(user.is_profile_private),

    showOnlineStatus: asBool(user.show_online_status, true),

    showLastActive: asBool(user.show_last_active, true),

    showEmail: asBool(user.show_email),

    showLocation: asBool(user.show_location, true),

    postCount: asNumber(user.post_count) || asNumber(user.total_posts_created),

    topicCount: asNumber(user.topic_count),

    commentCount: asNumber(user.comment_count),

    reputation: asNumber(user.pulse) || asNumber(user.karma) || asNumber(user.reputation),

    reputationPositive: asNumber(user.reputation_positive),

    reputationNegative: asNumber(user.reputation_negative),

    warnLevel: asNumber(user.warn_level),

    registeredAt:
      asString(user.inserted_at) || asString(user.registered_at) || new Date().toISOString(),

    lastActive: asNullableString(user.last_active_at) || asNullableString(user.last_seen_at),

    lastPostAt: asNullableString(user.last_post_at),

    isOnline: asBool(user.is_online) || user.status === 'online',

    status: asOneOf(user.status, STATUS_VALUES, 'offline'),

    statusMessage: asNullableString(user.status_message) || asNullableString(user.custom_status),

    isFriend: friendshipStatus === 'friends',

    isBlocked: friendshipStatus === 'blocked',

    friendshipStatus,
  };
}
