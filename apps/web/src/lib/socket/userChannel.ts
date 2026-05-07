/**
 * User Channel Handlers
 *
 * Manages the per-user Phoenix channel for receiving friend requests,
 * message previews, conversation events, contact presence, and incoming calls.
 *
 * Web does not participate in the Signal E2EE protocol (ADR-022). Key revocation,
 * device linking, and cross-signing events are handled exclusively on mobile and
 * desktop, so this channel does not subscribe to them.
 */

import type { Socket, Channel } from 'phoenix';
import {
  useChatStore,
  type Message,
  type Conversation,
  type ConversationParticipant,
} from '@/modules/chat/store';
import { toTypedMessage } from '@/modules/chat/store/chatStore.normalizers';
import { useIncomingCallStore, type IncomingCall } from '@/modules/calls/store';
import { useNotificationStore, type Notification } from '@/modules/social/store';
import { useFriendStore } from '@/modules/social/store';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { useSettingsStore } from '@/modules/settings/store/settingsStore.impl';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { socketLogger as logger } from '../logger';
import { normalizeConversation, normalizeMessage } from '../api-utils';
import { shouldDropIncomingCall } from './incomingCallDedup';

interface SessionResumeState {
  sessionId: string | null;
  lastSequence: number;
}

function updateSessionResumeState(
  payload: unknown,
  sessionState: SessionResumeState
): Record<string, unknown> {
  const data = toRecord(payload);
  const sequence = data['_seq'];
  const sessionId = data['_session_id'];

  if (typeof sequence === 'number') {
    sessionState.lastSequence = sequence;
    try {
      sessionStorage.setItem(STORAGE_KEYS.socketLastSequence, String(sequence));
    } catch {
      // sessionStorage unavailable — reconnect still works without persistence
    }
  }

  if (typeof sessionId === 'string') {
    sessionState.sessionId = sessionId;
    try {
      sessionStorage.setItem(STORAGE_KEYS.socketSessionId, sessionId);
    } catch {
      // sessionStorage unavailable — reconnect still works without persistence
    }
  }

  return data;
}

/**
 * Narrow an opaque channel payload to a key-value map.
 *
 * Phoenix types channel payloads as `{}`. Using `Object.entries` / destructuring
 * on `unknown` is not legal without a cast, so we centralize the single
 * structural narrowing here. The runtime check (typeof === 'object', not null,
 * not array) guarantees correctness.
 */
function toRecord(payload: unknown): Record<string, unknown> {
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    return { ...payload };
  }
  return {};
}

/**
 * Narrow an unknown value that has already been runtime-checked as a non-null,
 * non-array object into a flat key-value map.
 */
function objectToRecord(value: object): Record<string, unknown> {
  return { ...value };
}

/**
 * Runtime type guard for normalized Message objects.
 * normalizeMessage() guarantees the shape, so we check only the minimum
 * structural invariant (`id` string) to narrow the type safely.
 */
function isNormalizedMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = objectToRecord(value);
  return typeof record['id'] === 'string' && typeof record['content'] === 'string';
}

/**
 * Map a raw string to a valid `Notification['type']`, defaulting to `'system'`
 * for unrecognised values so notifications are always surfaced.
 *
 * Uses an explicit typed Record to avoid any type assertion.
 */
const NOTIFICATION_TYPE_MAP: Readonly<Record<string, Notification['type']>> = {
  message: 'message',
  friend_request: 'friend_request',
  group_invite: 'group_invite',
  mention: 'mention',
  forum_reply: 'forum_reply',
  system: 'system',
};

function toNotificationType(raw: string): Notification['type'] {
  return NOTIFICATION_TYPE_MAP[raw] ?? 'system';
}

/**
 * Build a typed `Conversation` from a normalised record.
 *
 * `normalizeConversation` returns `Record<string, unknown>` for type-safety at
 * the normalizer layer; this function re-extracts the known fields so no cast
 * is needed at call sites.
 */
function recordToConversation(record: Record<string, unknown>): Conversation {
  const rawParticipants = record['participants'];
  // normalizeParticipant guarantees each element is ConversationParticipant;
  // further runtime validation would duplicate the normalizer's work.
  const participants: ConversationParticipant[] = Array.isArray(rawParticipants)
    ? rawParticipants.filter(
        (p): p is ConversationParticipant =>
          typeof p === 'object' && p !== null && typeof p['userId'] === 'string'
      )
    : [];

  const lastMessageRaw = record['lastMessage'];
  // normalizeMessage guarantees the Message shape at the normalizer boundary.
  // We check `id` structurally to narrow without a type assertion.
  const lastMessage: Conversation['lastMessage'] = isNormalizedMessage(lastMessageRaw)
    ? lastMessageRaw
    : null;

  return {
    id: typeof record['id'] === 'string' ? record['id'] : '',
    type: record['type'] === 'group' ? 'group' : 'direct',
    name: typeof record['name'] === 'string' ? record['name'] : null,
    avatarUrl: typeof record['avatarUrl'] === 'string' ? record['avatarUrl'] : null,
    participants,
    lastMessage,
    unreadCount: typeof record['unreadCount'] === 'number' ? record['unreadCount'] : 0,
    isGroup: record['isGroup'] === true,
    isPinned: record['pinned'] === true || record['isPinned'] === true,
    isMuted: record['muted'] === true || record['isMuted'] === true,
    createdAt:
      typeof record['createdAt'] === 'string' ? record['createdAt'] : new Date().toISOString(),
    updatedAt:
      typeof record['updatedAt'] === 'string' ? record['updatedAt'] : new Date().toISOString(),
  };
}

/**
 * Build a typed partial `Conversation` update from a validated record that
 * already has a string `id` field.
 */
function recordToConversationUpdate(
  record: Record<string, unknown>,
  id: string
): Partial<Conversation> & { id: string } {
  const partial: Partial<Conversation> & { id: string } = { id };

  if (typeof record['name'] === 'string') partial.name = record['name'];
  if (typeof record['avatarUrl'] === 'string') partial.avatarUrl = record['avatarUrl'];
  if (typeof record['unreadCount'] === 'number') partial.unreadCount = record['unreadCount'];
  if (record['type'] === 'group' || record['type'] === 'direct') partial.type = record['type'];
  if (typeof record['updatedAt'] === 'string') partial.updatedAt = record['updatedAt'];

  return partial;
}

/**
 * Join the user-specific channel and wire up all event handlers.
 */
export function joinUserChannel(
  socket: Socket | null,
  userId: string,
  channels: Map<string, Channel>,
  onlineUsers: Map<string, Set<string>>,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void,
  sessionState: SessionResumeState
): Channel | null {
  const topic = `user:${userId}`;

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join user channel: socket not connected');
    return null;
  }

  const joinParams: Record<string, unknown> = { include_contact_presence: true };

  try {
    const savedSessionId =
      sessionStorage.getItem(STORAGE_KEYS.socketSessionId) ?? sessionStorage.getItem('ws_session_id');
    const savedLastSequence =
      sessionStorage.getItem(STORAGE_KEYS.socketLastSequence) ??
      sessionStorage.getItem('ws_last_sequence');

    if (savedSessionId && savedLastSequence) {
      const parsedSequence = Number.parseInt(savedLastSequence, 10);
      if (Number.isFinite(parsedSequence) && parsedSequence >= 0) {
        joinParams.resume_session_id = savedSessionId;
        joinParams.last_sequence = parsedSequence;
      }
    }
  } catch {
    // sessionStorage unavailable — connect without resume state
  }

  const channel = socket.channel(topic, joinParams);
  const originalOnMessage = channel.onMessage.bind(channel);

  channel.onMessage = (event, payload, ref) => {
    updateSessionResumeState(payload, sessionState);
    return originalOnMessage(event, payload, ref);
  };

  channel.on('friend_request', (payload) => {
    logger.log('Friend request received:', payload);
    // Refresh pending requests in real-time
    useFriendStore.getState().fetchPendingRequests();
  });

  // Real-time notification delivery — backend broadcasts serialized notifications
  channel.on('notification', (payload) => {
    logger.log('Real-time notification received:', payload);
    const data = toRecord(payload);
    const id = data['id'];
    const type = data['type'];
    const title = data['title'];
    const body = data['body'];
    const read = data['read'];
    const notifData = data['data'];
    const createdAt = data['created_at'];

    if (typeof id !== 'string' || typeof type !== 'string' || typeof title !== 'string') {
      logger.warn('Malformed notification payload — missing required fields:', payload);
      return;
    }

    const actorRaw = data['actor'];
    let sender: Notification['sender'];
    if (typeof actorRaw === 'object' && actorRaw !== null && !Array.isArray(actorRaw)) {
      const actor = objectToRecord(actorRaw);
      sender = {
        id: typeof actor['id'] === 'string' ? actor['id'] : '',
        username: typeof actor['username'] === 'string' ? actor['username'] : '',
        displayName: null,
        avatarUrl: typeof actor['avatar_url'] === 'string' ? actor['avatar_url'] : null,
      };
    }

    const dataField: Record<string, unknown> =
      typeof notifData === 'object' && notifData !== null && !Array.isArray(notifData)
        ? objectToRecord(notifData)
        : {};

    const notification: Notification = {
      id,
      type: toNotificationType(type),
      title,
      body: typeof body === 'string' ? body : '',
      isRead: typeof read === 'boolean' ? read : false,
      data: dataField,
      sender,
      createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    };

    // Deduplicate: don't add if we already have this notification ID
    const existing = useNotificationStore.getState().notifications;
    if (!existing.some((n) => n.id === notification.id)) {
      useNotificationStore.getState().addNotification(notification);
    }
  });

  // Real-time notification dismissal — removes cancelled/declined friend request notifications
  channel.on('notifications:dismissed', (payload) => {
    logger.log('Notifications dismissed:', payload);
    const data = toRecord(payload);
    const rawIds = data['notification_ids'];
    const reason = data['reason'];
    const notificationIds = Array.isArray(rawIds)
      ? rawIds.filter((x): x is string => typeof x === 'string')
      : [];
    const idsToRemove = new Set(notificationIds);

    if (idsToRemove.size > 0) {
      const store = useNotificationStore.getState();
      const remaining = store.notifications.filter((n) => !idsToRemove.has(n.id));
      const removedUnread = store.notifications.filter(
        (n) => idsToRemove.has(n.id) && !n.isRead
      ).length;

      useNotificationStore.setState({
        notifications: remaining,
        unreadCount: Math.max(0, store.unreadCount - removedUnread),
      });
    }

    // Also refresh friend lists since this likely means a request was cancelled
    if (reason === 'friend_request_cancelled') {
      useFriendStore.getState().fetchPendingRequests();
    }
  });

  // Real-time friend list sync — any friend action (send/accept/decline/cancel/unfriend)
  // triggers a refresh of the relevant stores
  channel.on('friend_list:updated', (payload) => {
    logger.log('Friend list updated:', payload);
    const friendStore = useFriendStore.getState();
    friendStore.fetchFriends();
    friendStore.fetchPendingRequests();
    friendStore.fetchSentRequests();
  });

  channel.on('message_preview', (payload) => {
    logger.log('Message preview:', payload);
  });

  channel.on('conversation_created', (payload) => {
    logger.log('New conversation created:', payload);
    const data = toRecord(payload);
    const conv = data['conversation'];
    if (typeof conv === 'object' && conv !== null && !Array.isArray(conv)) {
      const normalized = recordToConversation(normalizeConversation(objectToRecord(conv)));
      logger.debug('Normalized conversation:', normalized);
      useChatStore.getState().addConversation(normalized);
    }
  });

  channel.on('conversation_updated', (payload) => {
    logger.log('Conversation updated:', payload);
    const data = toRecord(payload);
    const conv = data['conversation'];
    if (typeof conv === 'object' && conv !== null && !Array.isArray(conv)) {
      const record = objectToRecord(conv);
      const convId = record['id'];
      if (typeof convId === 'string') {
        useChatStore.getState().updateConversation(recordToConversationUpdate(record, convId));
      }
    }
  });

  channel.on('contact_presence', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const rawContacts = data['contacts'];
    const onlineSet = new Set<string>();

    if (typeof rawContacts === 'object' && rawContacts !== null && !Array.isArray(rawContacts)) {
      Object.entries(objectToRecord(rawContacts)).forEach(([uid, status]) => {
        if (
          typeof status === 'object' &&
          status !== null &&
          !Array.isArray(status) &&
          objectToRecord(status)['online'] === true
        ) {
          onlineSet.add(uid);
        }
      });
    }

    onlineUsers.set('lobby', onlineSet);
    logger.log('Contact presence snapshot:', onlineSet.size);
  });

  channel.on('contact_status_changed', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const targetUserId = data['user_id'];
    const online = data['online'];
    const onlineSet = onlineUsers.get('lobby') ?? new Set<string>();

    if (typeof targetUserId === 'string') {
      if (online === true) {
        onlineSet.add(targetUserId);
        notifyStatusChange('lobby', targetUserId, true);
      } else {
        onlineSet.delete(targetUserId);
        notifyStatusChange('lobby', targetUserId, false);
      }
      onlineUsers.set('lobby', onlineSet);
    }
  });

  // === Task 3 (C2): Customization sync — real-time cosmetic listeners ===

  // Profile updated — own avatar/banner/accent changes from another device
  channel.on('profile_updated', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const changes = data['changes'];
    const changesRecord =
      typeof changes === 'object' && changes !== null && !Array.isArray(changes)
        ? objectToRecord(changes)
        : data;

    logger.log('Profile updated event received:', changesRecord);

    // Update auth store for avatar/banner changes
    const userUpdates: Record<string, unknown> = {};
    if (typeof changesRecord['avatar_hash'] === 'string') {
      userUpdates.avatarUrl = changesRecord['avatar_hash'];
    }
    if (typeof changesRecord['banner_hash'] === 'string') {
      userUpdates.bannerUrl = changesRecord['banner_hash'];
    }

    if (Object.keys(userUpdates).length > 0) {
      useAuthStore.getState().updateUser(userUpdates);
    }

    // Update customization store for cosmetic changes
    const cosmeticUpdates: Record<string, unknown> = {};
    if (typeof changesRecord['avatar_border_id'] === 'string') {
      cosmeticUpdates.selectedBorderId = changesRecord['avatar_border_id'];
    }
    if (typeof changesRecord['nameplate_id'] === 'string') {
      cosmeticUpdates.equippedNameplate = changesRecord['nameplate_id'];
    }
    if (typeof changesRecord['accent_color'] === 'string') {
      cosmeticUpdates.avatarBorderColor = changesRecord['accent_color'];
    }

    if (Object.keys(cosmeticUpdates).length > 0) {
      useCustomizationStore.getState().updateSettings(cosmeticUpdates);
    }
  });

  // Item equipped — cosmetic item equipped on another device
  channel.on('item_equipped', (payload) => {
    const data = toRecord(payload);
    const itemType = typeof data['item_type'] === 'string' ? data['item_type'] : data['itemType'];
    const itemId = typeof data['item_id'] === 'string' ? data['item_id'] : data['itemId'];

    if (typeof itemType === 'string' && typeof itemId === 'string') {
      logger.log('Item equipped event:', { itemType, itemId });

      const updates: Record<string, unknown> = {};
      if (itemType === 'border') updates.selectedBorderId = itemId;
      if (itemType === 'title') updates.equippedTitle = itemId;
      if (itemType === 'nameplate') updates.equippedNameplate = itemId;
      if (itemType === 'name_style' || itemType === 'name_effect')
        updates.displayNameEffect = itemId;

      if (Object.keys(updates).length > 0) {
        useCustomizationStore.getState().updateSettings(updates);
      }
    }
  });

  // Item unequipped — cosmetic item removed on another device
  channel.on('item_unequipped', (payload) => {
    const data = toRecord(payload);
    const itemType = typeof data['item_type'] === 'string' ? data['item_type'] : data['itemType'];

    if (typeof itemType === 'string') {
      logger.log('Item unequipped event:', { itemType });

      const updates: Record<string, unknown> = {};
      if (itemType === 'border') updates.selectedBorderId = null;
      if (itemType === 'title') updates.equippedTitle = null;
      if (itemType === 'nameplate') updates.equippedNameplate = null;
      if (itemType === 'name_style' || itemType === 'name_effect') updates.displayNameEffect = null;

      if (Object.keys(updates).length > 0) {
        useCustomizationStore.getState().updateSettings(updates);
      }
    }
  });

  // Cosmetic purchased — item added to inventory
  channel.on('cosmetic_purchased', (payload) => {
    const data = toRecord(payload);
    logger.log('Cosmetic purchased event:', data);
    // Re-fetch customizations to sync inventory
    useCustomizationStore.getState().fetchCustomizations();
  });

  // === Task 16 (C4): Settings sync — apply changes made on another device ===

  channel.on('settings_synced', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const section = data['section'];
    const changes = data['changes'];
    const lastUpdatedAt = data['last_updated_at'];

    if (typeof section !== 'string') {
      logger.warn('Malformed settings_synced payload — missing section:', payload);
      return;
    }

    const incomingAt = typeof lastUpdatedAt === 'string' ? lastUpdatedAt : new Date().toISOString();
    const changesRecord: Record<string, unknown> =
      typeof changes === 'object' && changes !== null && !Array.isArray(changes)
        ? objectToRecord(changes)
        : {};

    logger.log('Settings synced from another device:', { section, changes: changesRecord });
    useSettingsStore.getState().mergeSettingsFromSync(section, changesRecord, incomingAt);
  });

  // === Task 5 (C5): Connection displacement ===

  channel.on('displaced', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const reason =
      typeof data['reason'] === 'string' ? data['reason'] : 'Connected from another location';
    logger.warn('Connection displaced:', reason);
    // The channel will be stopped by the server; the socket reconnect-backoff
    // handles reconnection automatically. Notify the user via a store update.
    useAuthStore.getState().updateUser({ status: 'offline' });
  });

  // === Task 6 (C1): Multi-device sync protocol ===

  // Sync message — message sent from another device
  channel.on('sync_message', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const conversationId = data['conversation_id'];
    const messageRaw = data['message'];
    const syncType = data['type'];

    if (typeof conversationId !== 'string' || typeof syncType !== 'string') return;

    if (
      syncType === 'sent' &&
      typeof messageRaw === 'object' &&
      messageRaw !== null &&
      !Array.isArray(messageRaw)
    ) {
      logger.log('Sync message received for conversation:', conversationId);
      const normalizedMessage = toTypedMessage(normalizeMessage(objectToRecord(messageRaw)));
      useChatStore.getState().addMessage({ ...normalizedMessage, deliveryStatus: 'sent' });
    }
  });

  // Sync read — conversation read from another device
  channel.on('sync_read', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const conversationId = data['conversation_id'];

    if (typeof conversationId === 'string') {
      logger.log('Sync read received for conversation:', conversationId);
      // Update unread count to 0 for this conversation
      useChatStore.getState().updateConversation({
        id: conversationId,
        unreadCount: 0,
      });
    }
  });

  channel.on('resume_complete', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const newSessionId = typeof data['new_session_id'] === 'string' ? data['new_session_id'] : null;
    const fullSyncRequired = data['full_sync_required'] === true;

    if (newSessionId) {
      sessionState.sessionId = newSessionId;
    }

    if (fullSyncRequired) {
      void Promise.allSettled([
        useChatStore.getState().fetchConversations(),
        useNotificationStore.getState().fetchNotifications(),
        useFriendStore.getState().fetchPendingRequests(),
      ]);
    }

    logger.log('User-channel resume completed', data);
  });

  // Incoming WebRTC calls
  channel.on('incoming_call', (payload) => {
    logger.log('Incoming call received:', payload);
    const data = updateSessionResumeState(payload, sessionState);
    const roomId = data['room_id'];
    const callerId = data['caller_id'];
    const callType = data['type'];

    if (typeof roomId !== 'string' || typeof callerId !== 'string') {
      logger.warn('Malformed incoming_call payload:', payload);
      return;
    }

    // Defense-in-depth: drop duplicate ring deliveries (server hiccup,
    // bfcache replay, session resume) before the store ever sees them.
    if (shouldDropIncomingCall(roomId)) {
      logger.log('Suppressing duplicate incoming_call for room', roomId);
      return;
    }

    const callerUser = useChatStore
      .getState()
      .conversations.flatMap((conv) => conv.participants)
      .find((p) => p.userId === callerId);

    const incomingCall: IncomingCall = {
      roomId,
      callerId,
      callerName: callerUser?.user?.username ?? callerUser?.user?.displayName ?? 'Unknown User',
      callerAvatar: callerUser?.user?.avatarUrl ?? null,
      type: callType === 'video' ? 'video' : 'audio',
      timestamp: Date.now(),
    };

    useIncomingCallStore.getState().setIncomingCall(incomingCall);
  });

  // === Linked device revocation (Phase 36-01) ===
  // Web is not a Signal-participant device (ADR-022): when the backend revokes
  // this device, we simply log out. All crypto cleanup happens on mobile/desktop.
  channel.on('device_revoked', (payload) => {
    const data = updateSessionResumeState(payload, sessionState);
    const revokedDeviceId = data['device_id'];
    const reason = typeof data['reason'] === 'string' ? data['reason'] : 'revoked_by_user';

    logger.warn('Device revocation received:', { revokedDeviceId, reason });
    useAuthStore.getState().logout();
  });

  channel
    .join()
    .receive('ok', (response: unknown) => {
      const data = toRecord(response);
      const sessionId = typeof data['session_id'] === 'string' ? data['session_id'] : null;

      if (sessionId) {
        sessionState.sessionId = sessionId;
        try {
          sessionStorage.setItem(STORAGE_KEYS.socketSessionId, sessionId);
        } catch {
          // sessionStorage unavailable — keep in memory only
        }
      }

      logger.log(`Joined user channel: ${topic}`);
    })
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join user channel: ${topic}`, resp);
      channels.delete(topic);
    });

  channels.set(topic, channel);
  return channel;
}

/**
 * Leave and clean up the user channel.
 */
export function leaveUserChannel(userId: string, channels: Map<string, Channel>): void {
  const topic = `user:${userId}`;
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }
}
