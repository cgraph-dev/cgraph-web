/**
 * Conversation Channel Handlers
 *
 * Manages joining/leaving DM conversation channels with presence
 * tracking, message events, typing indicators, and reactions.
 *
 */

import type { Socket, Channel } from 'phoenix';
import { Presence } from 'phoenix';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { http } from '../api-client';
import { socketLogger as logger } from '../logger';
import { normalizeMessage } from '../api-utils';

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/** Validate a new_message / message_updated / link_preview_updated payload. */
function hasMessageRecord(payload: unknown): payload is { message: Record<string, unknown> } {
  if (!isRecord(payload)) return false;
  return isRecord(payload['message']);
}

/** Validate a msg_delivered payload. */
interface MsgDeliveredPayload {
  message_id: string;
  conversation_id?: string;
}
function isMsgDeliveredPayload(payload: unknown): payload is MsgDeliveredPayload {
  return isRecord(payload) && typeof payload['message_id'] === 'string';
}

/** Validate a message_read payload. */
interface MessageReadPayload {
  message_id: string;
  user_id: string;
  read_at: string;
  conversation_id?: string;
}
function isMessageReadPayload(payload: unknown): payload is MessageReadPayload {
  return (
    isRecord(payload) &&
    typeof payload['message_id'] === 'string' &&
    typeof payload['user_id'] === 'string' &&
    typeof payload['read_at'] === 'string'
  );
}

/** Validate a message_deleted payload. */
function isMessageDeletedPayload(payload: unknown): payload is { message_id: string } {
  return isRecord(payload) && typeof payload['message_id'] === 'string';
}

/** Validate a typing payload. */
interface TypingPayload {
  user_id: string;
  is_typing: boolean;
  started_at?: string;
}
function isTypingPayload(payload: unknown): payload is TypingPayload {
  return (
    isRecord(payload) &&
    typeof payload['user_id'] === 'string' &&
    typeof payload['is_typing'] === 'boolean'
  );
}

function hasMessageHistoryPayload(
  payload: unknown
): payload is { messages: Record<string, unknown>[] } {
  if (!isRecord(payload)) return false;
  if (!Array.isArray(payload['messages'])) return false;
  return payload['messages'].every((message) => isRecord(message));
}

/** Validate a reaction_added payload. */
interface ReactionAddedPayload {
  message_id: string;
  user_id: string;
  emoji: string;
  user?: { id: string; username: string; display_name?: string; avatar_url?: string };
}
function isReactionAddedPayload(payload: unknown): payload is ReactionAddedPayload {
  return (
    isRecord(payload) &&
    typeof payload['message_id'] === 'string' &&
    typeof payload['user_id'] === 'string' &&
    typeof payload['emoji'] === 'string'
  );
}

/** Validate a reaction_removed payload. */
interface ReactionRemovedPayload {
  message_id: string;
  user_id: string;
  emoji: string;
}
function isReactionRemovedPayload(payload: unknown): payload is ReactionRemovedPayload {
  return (
    isRecord(payload) &&
    typeof payload['message_id'] === 'string' &&
    typeof payload['user_id'] === 'string' &&
    typeof payload['emoji'] === 'string'
  );
}

const gapRepairInFlight = new Map<string, Promise<void>>();

/**
 * Maximum number of entries we keep in `lastJoinAttempts`. JS Maps preserve
 * insertion order, so when we exceed the cap we delete the oldest key
 * (effectively LRU since every fresh join also re-orders by re-inserting).
 *
 * Sized to comfortably hold the topics a long-running tab can churn through
 * (conversations, group channels, threads) without ever growing unbounded.
 */
const LAST_JOIN_ATTEMPTS_MAX = 200;

/**
 * Insert/update a `lastJoinAttempts` entry while bounding the map at
 * `LAST_JOIN_ATTEMPTS_MAX`. We delete the oldest entry first — the Map
 * iterator yields keys in insertion order, so the first key returned by
 * `keys()` is the least-recently-inserted.
 */
function setBoundedJoinAttempt(
  lastJoinAttempts: Map<string, number>,
  topic: string,
  now: number
): void {
  // Re-inserting bumps recency: delete first so the new key lands at the tail.
  lastJoinAttempts.delete(topic);
  lastJoinAttempts.set(topic, now);

  while (lastJoinAttempts.size > LAST_JOIN_ATTEMPTS_MAX) {
    const oldestKey = lastJoinAttempts.keys().next().value;
    if (oldestKey === undefined) break;
    lastJoinAttempts.delete(oldestKey);
  }
}

/**
 * Drop the in-flight gap-repair entry for a conversation. Used when leaving
 * a conversation channel or when the channel closes — both signal that the
 * pending repair (if any) is no longer relevant and the entry must not leak.
 */
function clearGapRepairInFlight(conversationId: string): void {
  gapRepairInFlight.delete(conversationId);
}

/**
 * Test-only accessor for the gap-repair map. Used by unit tests to verify
 * cleanup; not exported through the socket barrel.
 */
export function _gapRepairInFlightHas(conversationId: string): boolean {
  return gapRepairInFlight.has(conversationId);
}

/**
 * Convert a normalizeMessage() result (Record<string, unknown>) to a typed Message.
 *
 * normalizeMessage guarantees the structural shape of Message fields;
 * this builder extracts them with runtime checks so no `as` cast is needed.
 */
function recordToMessage(record: Record<string, unknown>): Message {
  const sender = isRecord(record['sender']) ? record['sender'] : {};
  const rawReactions = Array.isArray(record['reactions']) ? record['reactions'] : [];

  return {
    id: typeof record['id'] === 'string' ? record['id'] : '',
    clientMessageId:
      typeof record['clientMessageId'] === 'string'
        ? record['clientMessageId']
        : typeof record['client_message_id'] === 'string'
          ? record['client_message_id']
          : null,
    sequence: typeof record['sequence'] === 'number' ? record['sequence'] : null,
    conversationId: typeof record['conversationId'] === 'string' ? record['conversationId'] : '',
    senderId: typeof record['senderId'] === 'string' ? record['senderId'] : '',
    content: typeof record['content'] === 'string' ? record['content'] : '',
    encryptedContent:
      typeof record['encryptedContent'] === 'string' ? record['encryptedContent'] : null,
    isEncrypted: record['isEncrypted'] === true,
    messageType: toMessageType(record['messageType']),
    replyToId: typeof record['replyToId'] === 'string' ? record['replyToId'] : null,
    replyTo: null,
    isPinned: record['isPinned'] === true,
    isEdited: record['isEdited'] === true,
    deletedAt: typeof record['deletedAt'] === 'string' ? record['deletedAt'] : null,
    metadata: isRecord(record['metadata'])
      ? (record['metadata'] satisfies Message['metadata'])
      : {},
    reactions: rawReactions.filter(
      (r): r is Message['reactions'][number] =>
        isRecord(r) && typeof r['emoji'] === 'string' && typeof r['count'] === 'number'
    ),
    sender: {
      id: typeof sender['id'] === 'string' ? sender['id'] : '',
      username: typeof sender['username'] === 'string' ? sender['username'] : '',
      displayName: typeof sender['displayName'] === 'string' ? sender['displayName'] : null,
      avatarUrl: typeof sender['avatarUrl'] === 'string' ? sender['avatarUrl'] : null,
    },
    createdAt: typeof record['createdAt'] === 'string' ? record['createdAt'] : '',
    updatedAt: typeof record['updatedAt'] === 'string' ? record['updatedAt'] : '',
    deliveryStatus: toDeliveryStatus(record['deliveryStatus']),
    decryptionFailed:
      record['decryptionFailed'] === true || record['decryptFailed'] === true ? true : undefined,
    requiresMobile:
      typeof record['requiresMobile'] === 'boolean' ? record['requiresMobile'] : undefined,
  };
}

function compareMessageOrder(left: Message, right: Message): number {
  if (typeof left.sequence === 'number' && typeof right.sequence === 'number') {
    return left.sequence - right.sequence;
  }

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

function getHighestConversationSequence(conversationId: string): number {
  const messages = useChatStore.getState().messages[conversationId] || [];

  return messages.reduce((highest, message) => {
    if (typeof message.sequence === 'number' && message.sequence > highest) {
      return message.sequence;
    }

    return highest;
  }, 0);
}

async function repairConversationGap(conversationId: string, afterSequence: number): Promise<void> {
  const existingRepair = gapRepairInFlight.get(conversationId);
  if (existingRepair) {
    await existingRepair;
    return;
  }

  const repairPromise = (async () => {
    try {
      const response = await http.get(`/api/v1/conversations/${conversationId}/messages`, {
        params: { after_sequence: afterSequence, limit: 100 },
      });

      const rawMessages = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.messages)
          ? response.data.messages
          : [];

      const repairedMessages = rawMessages
        .filter((value: unknown): value is Record<string, unknown> => isRecord(value))
        .map((rawMessage: Record<string, unknown>) => recordToMessage(normalizeMessage(rawMessage)))
        .sort(compareMessageOrder);

      for (const repairedMessage of repairedMessages) {
        await useChatStore.getState().decryptAndAddMessage(repairedMessage);
      }
    } finally {
      gapRepairInFlight.delete(conversationId);
    }
  })();

  gapRepairInFlight.set(conversationId, repairPromise);
  await repairPromise;
}

async function addMessageWithGapRepair(conversationId: string, message: Message): Promise<void> {
  const inFlightRepair = gapRepairInFlight.get(conversationId);
  if (inFlightRepair) {
    await inFlightRepair;
    await addMessageWithGapRepair(conversationId, message);
    return;
  }

  const highestSequence = getHighestConversationSequence(conversationId);
  if (
    typeof message.sequence === 'number' &&
    highestSequence > 0 &&
    message.sequence > highestSequence + 1
  ) {
    logger.warn(
      `Gap detected in ${conversationId}: expected ${highestSequence + 1}, got ${message.sequence}`
    );
    await repairConversationGap(conversationId, highestSequence);

    if (getHighestConversationSequence(conversationId) >= message.sequence) {
      return;
    }
  }

  await useChatStore.getState().decryptAndAddMessage(message);
}

async function addHistoryWithGapRepair(
  conversationId: string,
  rawMessages: Record<string, unknown>[]
): Promise<void> {
  const normalizedMessages = rawMessages
    .map((rawMessage) => recordToMessage(normalizeMessage(rawMessage)))
    .sort(compareMessageOrder);

  const highestSequence = getHighestConversationSequence(conversationId);
  const firstSequencedMessage = normalizedMessages.find(
    (message) => typeof message.sequence === 'number'
  );

  if (
    highestSequence > 0 &&
    typeof firstSequencedMessage?.sequence === 'number' &&
    firstSequencedMessage.sequence > highestSequence + 1
  ) {
    logger.warn(
      `History gap detected in ${conversationId}: expected ${highestSequence + 1}, got ${firstSequencedMessage.sequence}`
    );
    await repairConversationGap(conversationId, highestSequence);
    return;
  }

  let previousSequence = 0;

  for (const message of normalizedMessages) {
    if (typeof message.sequence === 'number') {
      if (previousSequence > 0 && message.sequence > previousSequence + 1) {
        logger.warn(
          `History gap detected in ${conversationId}: expected ${previousSequence + 1}, got ${message.sequence}`
        );
        await repairConversationGap(conversationId, previousSequence);
        return;
      }

      previousSequence = message.sequence;
    }

    await useChatStore.getState().decryptAndAddMessage(message);
  }
}

const VALID_DELIVERY_STATUSES = [
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
] as const satisfies readonly NonNullable<Message['deliveryStatus']>[];

function toDeliveryStatus(val: unknown): Message['deliveryStatus'] {
  return VALID_DELIVERY_STATUSES.find((s) => s === val) ?? 'sent';
}

const VALID_MESSAGE_TYPES = [
  'text',
  'image',
  'video',
  'file',
  'audio',
  'voice',
  'sticker',
  'gif',
  'system',
] as const satisfies readonly Message['messageType'][];

function toMessageType(val: unknown): Message['messageType'] {
  return VALID_MESSAGE_TYPES.find((t) => t === val) ?? 'text';
}

/**
 * Join a conversation channel with full presence and event handling.
 */
export function joinConversation(
  socket: Socket | null,
  conversationId: string,
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  channelHandlersSetUp: Set<string>,
  lastJoinAttempts: Map<string, number>,
  joinDebounceMs: number,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void,
  connectFn: () => Promise<void>
): Channel | null {
  const topic = `conversation:${conversationId}`;

  // Debounce rapid join attempts
  const now = Date.now();
  const lastAttempt = lastJoinAttempts.get(topic) || 0;
  if (now - lastAttempt < joinDebounceMs) {
    logger.log(`Debouncing join for ${topic}`);
    return channels.get(topic) || null;
  }

  const existingChannel = channels.get(topic);
  if (existingChannel) {
    const state = existingChannel.state;
    if (state === 'joined' || state === 'joining') {
      return existingChannel;
    }
    channels.delete(topic);
    channelHandlersSetUp.delete(topic);
    presences.delete(topic);
    onlineUsers.delete(conversationId);
  }

  if (!socket) {
    logger.warn('Cannot join conversation: socket not connected');
    connectFn().then(() => {
      if (!channels.has(topic)) {
        // Retry after reconnect — caller should re-invoke
        logger.log('Socket reconnected, conversation join can be retried');
      }
    });
    return null;
  }

  if (!socket.isConnected()) {
    logger.warn('Socket exists but not connected, waiting...');
    return null;
  }

  setBoundedJoinAttempt(lastJoinAttempts, topic, now);
  const channel = socket.channel(topic, {});
  channels.set(topic, channel);

  if (!channelHandlersSetUp.has(topic)) {
    channelHandlersSetUp.add(topic);

    // Drop any pending gap-repair entry when the underlying channel closes.
    // Without this, gapRepairInFlight grows unbounded on long-running tabs.
    channel.onClose(() => {
      clearGapRepairInFlight(conversationId);
    });

    const presence = new Presence(channel);
    presences.set(topic, presence);
    onlineUsers.set(conversationId, new Set());

    presence.onSync(() => {
      const onlineSet = new Set<string>();
      presence.list((id: string) => {
        onlineSet.add(id);
        return id;
      });

      const previousSet = onlineUsers.get(conversationId) || new Set();
      onlineSet.forEach((uid) => {
        if (!previousSet.has(uid)) notifyStatusChange(conversationId, uid, true);
      });
      previousSet.forEach((uid) => {
        if (!onlineSet.has(uid)) notifyStatusChange(conversationId, uid, false);
      });

      onlineUsers.set(conversationId, onlineSet);
      if (
        import.meta.env.DEV &&
        (previousSet.size !== onlineSet.size ||
          Array.from(previousSet).some((u) => !onlineSet.has(u)))
      ) {
        logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
      }
    });

    presence.onJoin((id: string) => {
      onlineUsers.get(conversationId)?.add(id);
    });

    presence.onLeave(() => {
      // Handled by onSync
    });

    channel.on('new_message', (payload) => {
      if (!hasMessageRecord(payload)) return;

      const normalized = recordToMessage(normalizeMessage(payload.message));

      const conversation = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const isMobileOnlyPayload =
        conversation?.conversationType === 'secret' ||
        (normalized.isEncrypted && normalized.requiresMobile !== false);

      if (isMobileOnlyPayload) {
        logger.warn('Dropping encrypted/secret payload on web', {
          conversationId,
          isEncrypted: normalized.isEncrypted,
          requiresMobile: normalized.requiresMobile,
          conversationType: conversation?.conversationType,
        });
        return;
      }

      logger.log('Received new_message:', normalized);

      void addMessageWithGapRepair(conversationId, normalized)
        .catch((error: unknown) => {
          logger.warn(
            `Gap repair failed for ${conversationId}, falling back to direct insert`,
            error
          );
          void useChatStore.getState().decryptAndAddMessage(normalized);
        })
        .finally(() => {
          const currentUserId = useAuthStore.getState().user?.id;
          if (currentUserId && normalized.senderId !== currentUserId) {
            channel.push('msg_ack', { message_id: normalized.id });
          }
        });
    });

    channel.on('message_history', (payload) => {
      if (!hasMessageHistoryPayload(payload)) return;

      void addHistoryWithGapRepair(conversationId, payload.messages).catch((error: unknown) => {
        logger.warn(
          `History gap repair failed for ${conversationId}, falling back to raw history`,
          error
        );

        payload.messages.forEach((rawMessage) => {
          const normalized = recordToMessage(normalizeMessage(rawMessage));
          void useChatStore.getState().decryptAndAddMessage(normalized);
        });
      });
    });

    channel.on('msg_delivered', (payload) => {
      if (!isMsgDeliveredPayload(payload)) return;
      const convId = payload.conversation_id || conversationId;
      useChatStore.getState().updateMessageStatus(convId, payload.message_id, 'delivered');
    });

    channel.on('message_read', (payload) => {
      if (!isMessageReadPayload(payload)) return;
      const convId = payload.conversation_id || conversationId;
      const store = useChatStore.getState();
      store.addReadReceipt(convId, payload.message_id, payload.user_id, payload.read_at);
      store.updateMessageStatus(convId, payload.message_id, 'read');
    });

    channel.on('message_updated', (payload) => {
      if (!hasMessageRecord(payload)) return;
      const normalized = recordToMessage(normalizeMessage(payload.message));
      useChatStore.getState().updateMessage(normalized);
    });

    channel.on('message_deleted', (payload) => {
      if (!isMessageDeletedPayload(payload)) return;
      useChatStore.getState().markMessageDeleted(payload.message_id);
    });

    channel.on('link_preview_updated', (payload) => {
      if (!hasMessageRecord(payload)) return;
      const normalized = recordToMessage(normalizeMessage(payload.message));
      useChatStore.getState().updateMessage(normalized);
    });

    channel.on('typing', (payload) => {
      if (!isTypingPayload(payload)) return;
      useChatStore
        .getState()
        .setTypingUser(conversationId, payload.user_id, payload.is_typing, payload.started_at);
    });

    channel.on('presence_state', (state) => logger.log('Presence state:', state));
    channel.on('presence_diff', (diff) => logger.log('Presence diff:', diff));

    channel.on('reaction_added', (payload) => {
      if (!isReactionAddedPayload(payload)) return;
      useChatStore
        .getState()
        .addReactionToMessage(
          payload.message_id,
          payload.emoji,
          payload.user_id,
          payload.user?.username
        );
    });

    channel.on('reaction_removed', (payload) => {
      if (!isReactionRemovedPayload(payload)) return;
      useChatStore
        .getState()
        .removeReactionFromMessage(payload.message_id, payload.emoji, payload.user_id);
    });
  }

  channel
    .join()
    .receive('ok', () => logger.log(`Joined conversation ${conversationId}`))
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join conversation ${conversationId}:`, resp);
      channels.delete(topic);
      channelHandlersSetUp.delete(topic);
      lastJoinAttempts.delete(topic);
    });

  return channel;
}

/**
 * Leave and clean up a conversation channel.
 */
export function leaveConversation(
  conversationId: string,
  channels: Map<string, Channel>,
  channelHandlersSetUp: Set<string>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  lastJoinAttempts: Map<string, number>
): void {
  const topic = `conversation:${conversationId}`;
  const channel = channels.get(topic);
  if (channel) {
    logger.log(`Leaving conversation: ${topic}`);
    channel.leave();
    channels.delete(topic);
    channelHandlersSetUp.delete(topic);
    presences.delete(topic);
    onlineUsers.delete(conversationId);
    lastJoinAttempts.delete(topic);
  }
  // Always clear pending gap-repair, even if the channel was already gone —
  // the conversation is leaving the foreground and any in-flight repair is moot.
  clearGapRepairInFlight(conversationId);
}
