/**
 * Cosmetic Event Handlers — registers Phoenix channel listeners for real-time
 * cosmetic updates on user and group channels.
 *
 * The backend broadcasts to `user:{id}` with events:
 *   - `profile_updated`       — own profile cosmetic changes
 *   - `item_equipped`         — cosmetic item equipped
 *   - `item_unequipped`       — cosmetic item unequipped
 *
 * Group channels broadcast `member_profile_updated` when a member's
 * cosmetics change within that group context.
 *
 */

import type { Channel } from 'phoenix';

/** Payload for own profile cosmetic changes. */
export interface ProfileUpdatedEvent {
  readonly avatarHash?: string;
  readonly accentColor?: string;
  readonly avatarBorderId?: string;
  readonly nameplateId?: string;
  readonly profileEffectId?: string;
  readonly profileFrameId?: string;
}

/** Payload for another member's cosmetic changes within a group. */
export interface MemberProfileUpdatedEvent {
  readonly userId: string;
  readonly changes: ProfileUpdatedEvent;
}

/** Payload for cosmetic item equip events (from cosmetics.ex PubSub). */
export interface ItemEquippedEvent {
  readonly itemType: string;
  readonly itemId: string;
  readonly userId: string;
}

const USER_EVENTS = {
  PROFILE_UPDATED: 'profile_updated',
  ITEM_EQUIPPED: 'item_equipped',
  ITEM_UNEQUIPPED: 'item_unequipped',
} as const;

const GROUP_EVENTS = {
  MEMBER_PROFILE_UPDATED: 'member_profile_updated',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseProfileUpdated(payload: unknown): ProfileUpdatedEvent | null {
  if (!isRecord(payload)) return null;

  const event: ProfileUpdatedEvent = {
    ...(typeof payload.avatar_hash === 'string'
      ? { avatarHash: payload.avatar_hash }
      : typeof payload.avatarHash === 'string'
        ? { avatarHash: payload.avatarHash }
        : {}),
    ...(typeof payload.accent_color === 'string'
      ? { accentColor: payload.accent_color }
      : typeof payload.accentColor === 'string'
        ? { accentColor: payload.accentColor }
        : {}),
    ...(typeof payload.avatar_border_id === 'string'
      ? { avatarBorderId: payload.avatar_border_id }
      : typeof payload.avatarBorderId === 'string'
        ? { avatarBorderId: payload.avatarBorderId }
        : {}),
    ...(typeof payload.nameplate_id === 'string'
      ? { nameplateId: payload.nameplate_id }
      : typeof payload.nameplateId === 'string'
        ? { nameplateId: payload.nameplateId }
        : {}),
  };

  return event;
}

function parseMemberProfileUpdated(payload: unknown): MemberProfileUpdatedEvent | null {
  if (!isRecord(payload)) return null;

  const userId =
    typeof payload.user_id === 'string'
      ? payload.user_id
      : typeof payload.userId === 'string'
        ? payload.userId
        : null;

  if (!userId) return null;

  const changesRaw = isRecord(payload.changes) ? payload.changes : payload;
  const changes = parseProfileUpdated(changesRaw);
  if (!changes) return null;

  return { userId, changes };
}

function parseItemEvent(payload: unknown): ItemEquippedEvent | null {
  if (!isRecord(payload)) return null;

  const itemType =
    typeof payload.item_type === 'string'
      ? payload.item_type
      : typeof payload.itemType === 'string'
        ? payload.itemType
        : null;
  const itemId =
    typeof payload.item_id === 'string'
      ? payload.item_id
      : typeof payload.itemId === 'string'
        ? payload.itemId
        : null;
  const userId =
    typeof payload.user_id === 'string'
      ? payload.user_id
      : typeof payload.userId === 'string'
        ? payload.userId
        : null;

  if (!itemType || !itemId || !userId) return null;

  return { itemType, itemId, userId };
}

interface ListenerRef {
  readonly channel: Channel;
  readonly event: string;
  readonly ref: number;
}

type ProfileUpdateCallback = (event: ProfileUpdatedEvent) => void;
type MemberUpdateCallback = (event: MemberProfileUpdatedEvent) => void;
type ItemEventCallback = (event: ItemEquippedEvent) => void;

export interface CosmeticEventCallbacks {
  readonly onProfileUpdate: ProfileUpdateCallback;
  readonly onMemberUpdate: MemberUpdateCallback;
  readonly onItemEquipped?: ItemEventCallback;
  readonly onItemUnequipped?: ItemEventCallback;
}

/**
 * Registers cosmetic event handlers on the user channel and group channels.
 *
 * Returns a cleanup function that removes ALL listeners — tracks {event, ref}
 * pairs so `channel.off` receives both arguments (avoids the PhoenixProvider
 * bug where calling off with just the event name removes all handlers).
 *
 * @param userChannel    - The user's personal Phoenix channel.
 * @param groupChannels  - Array of group Phoenix channels to monitor.
 * @param callbacks      - Event handler callbacks.
 * @returns Cleanup function that removes all registered listeners.
 */
export function registerCosmeticEventHandlers(
  userChannel: Channel | null,
  groupChannels: ReadonlyArray<Channel>,
  callbacks: CosmeticEventCallbacks
): () => void {
  const refs: ListenerRef[] = [];

  if (userChannel) {
    const profileRef = userChannel.on(USER_EVENTS.PROFILE_UPDATED, (payload) => {
      const parsed = parseProfileUpdated(payload);
      if (parsed) {
        callbacks.onProfileUpdate(parsed);
      }
    });
    refs.push({
      channel: userChannel,
      event: USER_EVENTS.PROFILE_UPDATED,
      ref: profileRef,
    });

    const equippedRef = userChannel.on(USER_EVENTS.ITEM_EQUIPPED, (payload) => {
      const parsed = parseItemEvent(payload);
      if (parsed) {
        callbacks.onItemEquipped?.(parsed);
      }
    });
    refs.push({
      channel: userChannel,
      event: USER_EVENTS.ITEM_EQUIPPED,
      ref: equippedRef,
    });

    const unequippedRef = userChannel.on(USER_EVENTS.ITEM_UNEQUIPPED, (payload) => {
      const parsed = parseItemEvent(payload);
      if (parsed) {
        callbacks.onItemUnequipped?.(parsed);
      }
    });
    refs.push({
      channel: userChannel,
      event: USER_EVENTS.ITEM_UNEQUIPPED,
      ref: unequippedRef,
    });
  }

  for (const groupChannel of groupChannels) {
    const memberRef = groupChannel.on(GROUP_EVENTS.MEMBER_PROFILE_UPDATED, (payload) => {
      const parsed = parseMemberProfileUpdated(payload);
      if (parsed) {
        callbacks.onMemberUpdate(parsed);
      }
    });
    refs.push({
      channel: groupChannel,
      event: GROUP_EVENTS.MEMBER_PROFILE_UPDATED,
      ref: memberRef,
    });
  }

  return () => {
    for (const { channel, event, ref } of refs) {
      channel.off(event, ref);
    }
  };
}
