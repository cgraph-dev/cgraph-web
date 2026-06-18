import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import type { ChatIdentityPatch } from '@/modules/chat/store/chatStore.types';
import { useFriendStore } from '@/modules/social/store/friendStore.impl';
import type { Friend, FriendIdentityPatch } from '@/modules/social/store/friend-types';
import { resolveAvatarUrl } from '@/lib/media-url';
import { identityFieldsFromApi } from './canonicalIdentity';

export type OtherUserIdentityPatch = ChatIdentityPatch & FriendIdentityPatch;

const FRIEND_STATUSES: readonly Friend['status'][] = ['online', 'idle', 'dnd', 'offline'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identityRecords(raw: Record<string, unknown>): readonly Record<string, unknown>[] {
  return isRecord(raw.customization) ? [raw, raw.customization] : [raw];
}

function hasKey(records: readonly Record<string, unknown>[], keys: readonly string[]) {
  return records.some((record) => keys.some((key) => key in record));
}

function isFriendStatus(value: string): value is Friend['status'] {
  return FRIEND_STATUSES.some((status) => status === value);
}

/**
 * Builds a selective identity patch from backend/socket payloads. Only fields
 * present on the payload are applied, so a partial cosmetic event cannot erase
 * unrelated cached profile data.
 */
export function otherUserIdentityPatchFromPayload(
  userId: string,
  payload: Record<string, unknown>
): OtherUserIdentityPatch {
  const records = identityRecords(payload);
  const identity = identityFieldsFromApi({ ...payload, id: userId });
  const patch: OtherUserIdentityPatch = {};

  if (hasKey(records, ['username', 'from_username']) && identity.username) {
    patch.username = identity.username;
  }
  if (hasKey(records, ['displayName', 'display_name', 'from_display_name'])) {
    patch.displayName = identity.displayName;
  }
  if (hasKey(records, ['avatarUrl', 'avatar_url', 'from_avatar_url'])) {
    patch.avatarUrl = resolveAvatarUrl(identity.avatarUrl);
  }
  if (hasKey(records, ['status', 'presence']) && isFriendStatus(identity.status)) {
    patch.status = identity.status;
  }
  if (hasKey(records, ['statusMessage', 'status_message', 'custom_status'])) {
    patch.statusMessage = identity.statusMessage;
  }
  if (hasKey(records, ['avatarBorderId', 'avatar_border_id', 'from_avatar_border_id'])) {
    patch.avatarBorderId = identity.avatarBorderId;
    patch.avatar_border_id = identity.avatarBorderId;
  }
  if (hasKey(records, ['equippedTitleId', 'equipped_title_id', 'titleId', 'title_id'])) {
    patch.equippedTitleId = identity.equippedTitleId;
  }
  if (
    hasKey(records, [
      'equippedBadgeIds',
      'equipped_badge_ids',
      'equippedBadges',
      'equipped_badges',
      'badges',
    ])
  ) {
    patch.equippedBadgeIds = identity.equippedBadgeIds;
  }
  if (
    hasKey(records, [
      'equippedNameplateId',
      'equipped_nameplate_id',
      'equipped_nameplate',
      'nameplateId',
      'nameplate_id',
      'preset_name',
    ])
  ) {
    patch.equippedNameplateId = identity.equippedNameplateId;
  }
  if (hasKey(records, ['profileTheme', 'profile_theme'])) {
    patch.profileTheme = identity.profileTheme;
  }
  if (hasKey(records, ['chatTheme', 'chat_theme'])) {
    patch.chatTheme = identity.chatTheme;
  }
  if (hasKey(records, ['displayNameFont', 'display_name_font', 'nameFont', 'name_font'])) {
    patch.displayNameFont = identity.displayNameFont;
  }
  if (hasKey(records, ['displayNameEffect', 'display_name_effect', 'nameEffect', 'name_effect'])) {
    patch.displayNameEffect = identity.displayNameEffect;
  }
  if (hasKey(records, ['displayNameColor', 'display_name_color', 'nameColor', 'name_color'])) {
    patch.displayNameColor = identity.displayNameColor;
  }
  if (
    hasKey(records, [
      'displayNameSecondaryColor',
      'display_name_secondary_color',
      'nameSecondaryColor',
      'name_secondary_color',
    ])
  ) {
    patch.displayNameSecondaryColor = identity.displayNameSecondaryColor;
  }

  return patch;
}

/**
 * Applies a normalized other-user identity patch to every routed identity cache.
 */
export function applyOtherUserIdentityPatch(userId: string, patch: OtherUserIdentityPatch): void {
  if (!userId || Object.keys(patch).length === 0) return;

  useFriendStore.getState().applyIdentityPatch(userId, patch);
  useChatStore.getState().applyUserIdentityPatch(userId, patch);
}

/**
 * Normalizes a backend or socket payload before applying it to routed identity caches.
 */
export function applyOtherUserIdentityPayload(
  userId: string,
  payload: Record<string, unknown>
): void {
  applyOtherUserIdentityPatch(userId, otherUserIdentityPatchFromPayload(userId, payload));
}
