/**
 * Presence Manager
 *
 * Handles the presence lobby channel for tracking online friends,
 * status changes, and presence queries across all channels.
 *
 */

import type { Socket, Channel } from 'phoenix';
import { Presence } from 'phoenix';
import { useFriendStore } from '@/modules/social/store';
import { socketLogger as logger } from '../logger';
import { identityFieldsFromApi } from '../identity';

/** Customization data received from presence broadcasts. */
export interface FriendCustomization {
  avatar_border_id?: string | null;
  bubble_style?: string | null;
  bubble_color?: string | null;
  message_effect?: string | null;
  profile_theme?: string | null;
  title_id?: string | null;
  equipped_badges?: string[];
  particle_effect?: string | null;
  entrance_animation?: string | null;
}

/** Per-user customization cache, keyed by user ID. */
const friendCustomizations = new Map<string, FriendCustomization>();

/** Type guard: checks that value is a non-null object (plain record). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Safely extract string field from an unknown record. */
function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key];
  return typeof val === 'string' ? val : undefined;
}

/** Type guard: validates FriendCustomization shape from unknown payload. */
function isFriendCustomization(value: unknown): value is FriendCustomization {
  return isRecord(value);
}

function applyFriendCustomization(userId: string, customization: FriendCustomization): void {
  const identity = identityFieldsFromApi({ id: userId, customization });
  const patch = {
    avatarBorderId: identity.avatarBorderId,
    avatar_border_id: identity.avatarBorderId,
    equippedTitleId: identity.equippedTitleId,
    equippedBadgeIds: identity.equippedBadgeIds,
    equippedNameplateId: identity.equippedNameplateId,
    profileTheme: identity.profileTheme,
    chatTheme: identity.chatTheme,
    displayNameFont: identity.displayNameFont,
    displayNameEffect: identity.displayNameEffect,
    displayNameColor: identity.displayNameColor,
    displayNameSecondaryColor: identity.displayNameSecondaryColor,
  };

  useFriendStore.getState().applyIdentityPatch(userId, patch);
}

/**
 * Join the global presence lobby for tracking friend online status.
 */
export function joinPresenceLobby(
  socket: Socket | null,
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void
): Channel | null {
  const topic = 'presence:lobby';

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join presence lobby: socket not connected');
    return null;
  }

  const channel = socket.channel(topic, { include_contact_presence: true });
  const presence = new Presence(channel);

  presence.onSync(() => {
    const onlineFriends = new Set<string>();
    presence.list((id: string) => {
      onlineFriends.add(id);
      return id;
    });
    onlineUsers.set('lobby', onlineFriends);
    logger.log('Presence sync: online friends count =', onlineFriends.size);
  });

  // Handle initial presence state with customizations
  channel.on('presence_state', (payload: unknown) => {
    if (!isRecord(payload)) return;
    if (isRecord(payload.users)) {
      for (const [userId, info] of Object.entries(payload.users)) {
        if (isRecord(info) && isFriendCustomization(info.customization)) {
          friendCustomizations.set(userId, info.customization);
          applyFriendCustomization(userId, info.customization);
        }
      }
    }
  });

  channel.on('friend_online', (payload: unknown) => {
    if (!isRecord(payload)) return;
    const userId = getString(payload, 'user_id');
    if (!userId) return;
    onlineUsers.get('lobby')?.add(userId);
    if (isFriendCustomization(payload.customization)) {
      friendCustomizations.set(userId, payload.customization);
      applyFriendCustomization(userId, payload.customization);
    }
    notifyStatusChange('lobby', userId, true);
    logger.log('Friend came online:', userId);
  });

  channel.on('friend_offline', (payload: unknown) => {
    if (!isRecord(payload)) return;
    const userId = getString(payload, 'user_id');
    if (!userId) return;
    onlineUsers.get('lobby')?.delete(userId);
    friendCustomizations.delete(userId);
    notifyStatusChange('lobby', userId, false);
    logger.log('Friend went offline:', userId);
  });

  channel.on('friend_customization_changed', (payload: unknown) => {
    if (!isRecord(payload)) return;
    const userId = getString(payload, 'user_id');
    if (!userId) return;
    if (isFriendCustomization(payload.customization)) {
      friendCustomizations.set(userId, payload.customization);
      applyFriendCustomization(userId, payload.customization);
    }
    logger.log('Friend customization updated:', userId);
  });

  const handleStatusUpdate = (payload: unknown) => {
    if (!isRecord(payload)) return;
    const userId = getString(payload, 'user_id') ?? '';
    const status = getString(payload, 'status') ?? '';
    logger.log('Friend status update:', userId, '->', status);
  };

  channel.on('status_update', handleStatusUpdate);
  channel.on('friend_status_changed', handleStatusUpdate);

  channel
    .join()
    .receive('ok', () => {
      logger.log('Joined presence lobby');
      onlineUsers.set('lobby', new Set());
    })
    .receive('error', (resp: unknown) => {
      logger.error('Failed to join presence lobby:', resp);
      channels.delete(topic);
    });

  channels.set(topic, channel);
  presences.set(topic, presence);
  return channel;
}

/**
 * Leave and clean up the presence lobby.
 */
export function leavePresenceLobby(
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>
): void {
  const topic = 'presence:lobby';
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
    presences.delete(topic);
    onlineUsers.delete('lobby');
    friendCustomizations.clear();
  }
}

/**
 * Check if a specific friend is currently online.
 */
export function isFriendOnline(userId: string, onlineUsers: Map<string, Set<string>>): boolean {
  const lobbyUsers = onlineUsers.get('lobby');
  if (!lobbyUsers) return false;
  if (lobbyUsers.has(userId)) return true;

  const userIdStr = String(userId);
  for (const id of lobbyUsers) {
    if (String(id) === userIdStr) return true;
  }
  return false;
}

/**
 * Get all currently online friends.
 */
export function getOnlineFriends(onlineUsers: Map<string, Set<string>>): string[] {
  return Array.from(onlineUsers.get('lobby') || []);
}

/**
 * Get online users for a specific conversation/channel.
 */
export function getOnlineUsers(
  conversationId: string,
  onlineUsers: Map<string, Set<string>>
): string[] {
  return Array.from(onlineUsers.get(conversationId) || []);
}

/**
 * Check if a specific user is online in a conversation/channel.
 */
export function isUserOnline(
  conversationId: string,
  userId: string,
  onlineUsers: Map<string, Set<string>>
): boolean {
  const onlineSet = onlineUsers.get(conversationId);
  if (!onlineSet || !userId) return false;
  if (onlineSet.has(userId)) return true;

  const userIdStr = String(userId);
  for (const id of onlineSet) {
    if (String(id) === userIdStr) return true;
  }
  return false;
}

/**
 * Get a snapshot of all online statuses across all channels.
 */
export function getAllOnlineStatuses(
  onlineUsers: Map<string, Set<string>>
): Map<string, Set<string>> {
  return new Map(onlineUsers);
}

/**
 * Get cached customization data for a friend.
 * Returns null if the friend's customization data hasn't been received yet.
 */
export function getFriendCustomization(userId: string): FriendCustomization | null {
  return friendCustomizations.get(userId) ?? null;
}
