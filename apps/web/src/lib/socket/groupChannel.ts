/**
 * Group Channel Handlers
 *
 * Manages joining/leaving group (server) channels with message events,
 * typing indicators, and presence logging.
 *
 * Web is not a Signal-participant device (ADR-022): group sender-key
 * distribution, rotation, and decryption run only on mobile/desktop. The
 * browser still joins the channel for plaintext messages and ignores any
 * E2EE-related events from the server.
 */

import type { Socket, Channel } from 'phoenix';
import { useGroupStore, type ChannelMessage } from '@/modules/groups/store';
import { socketLogger as logger } from '../logger';
import { normalizeMessage } from '../api-utils';
import { identityFieldsFromApi } from '../identity';

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object';
}

function getString(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function getStringOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

const MESSAGE_TYPES = [
  'text',
  'image',
  'video',
  'file',
  'audio',
  'voice',
  'sticker',
  'gif',
  'system',
] as const;

type MessageType = ChannelMessage['messageType'];

function toMessageType(val: string): MessageType {
  const found = MESSAGE_TYPES.find((t) => t === val);
  return found ?? 'text';
}

/**
 * Convert a normalizeMessage() result to ChannelMessage shape.
 * normalizeMessage returns sender/senderId but ChannelMessage uses author/authorId.
 */
function toChannelMessage(raw: Record<string, unknown>): ChannelMessage {
  const n = normalizeMessage(raw);
  const sender = isRecord(n.sender) ? n.sender : {};
  const identity = identityFieldsFromApi(sender);

  return {
    id: getString(n['id']),
    channelId: getString(n['channelId'] ?? n['channel_id']),
    authorId: getString(n['senderId'] ?? sender['id']),
    content: getString(n['content']),
    messageType: toMessageType(getString(n['messageType'] ?? n['message_type'])),
    replyToId: getStringOrNull(n['replyToId'] ?? n['reply_to_id']),
    replyTo: null,
    isPinned: n['isPinned'] === true,
    isEdited: n['isEdited'] === true,
    deletedAt: getStringOrNull(n['deletedAt'] ?? n['deleted_at']),
    metadata: isRecord(n['metadata']) ? n['metadata'] : {},
    reactions: Array.isArray(n['reactions'])
      ? n['reactions'].filter(
          (r): r is { emoji: string; count: number; hasReacted: boolean } =>
            isRecord(r) &&
            typeof r['emoji'] === 'string' &&
            typeof r['count'] === 'number' &&
            typeof r['hasReacted'] === 'boolean'
        )
      : [],
    createdAt: getString(n['createdAt'] ?? n['created_at']),
    author: {
      id: identity.id,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      member: null,
      avatarBorderId: identity.avatarBorderId,
      equippedTitleId: identity.equippedTitleId,
      equippedBadgeIds: identity.equippedBadgeIds,
      equippedNameplateId: identity.equippedNameplateId,
      profileTheme: identity.profileTheme,
      chatTheme: identity.chatTheme,
      displayNameFont: identity.displayNameFont,
      displayNameEffect: identity.displayNameEffect,
      displayNameColor: identity.displayNameColor,
      displayNameSecondaryColor: identity.displayNameSecondaryColor,
    },
    // E2EE fields
    is_encrypted: n['is_encrypted'] === true || n['isEncrypted'] === true,
    encrypted_content:
      getStringOrNull(n['encrypted_content'] ?? n['encryptedContent']) ?? undefined,
    sender_key_id: getStringOrNull(n['sender_key_id']) ?? undefined,
    chain_index: typeof n['chain_index'] === 'number' ? n['chain_index'] : undefined,
  };
}

/**
 * Module-level map for typing indicator auto-clear timeouts.
 * Keys are `${channelId}:${userId}`. Auto-clears after 10 s if no stop event.
 */
const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function handleTypingEvent(channelId: string, userId: string, isTyping: boolean): void {
  const key = `${channelId}:${userId}`;

  const existing = typingTimeouts.get(key);
  if (existing !== undefined) {
    clearTimeout(existing);
    typingTimeouts.delete(key);
  }

  if (isTyping) {
    const timeout = setTimeout(() => {
      typingTimeouts.delete(key);
      useGroupStore.getState().setTypingUser(channelId, userId, false);
    }, 10_000);
    typingTimeouts.set(key, timeout);
  }

  useGroupStore.getState().setTypingUser(channelId, userId, isTyping);
}

/**
 * Join a group channel and wire up message/typing handlers.
 */
export function joinGroupChannel(
  socket: Socket | null,
  channelId: string,
  channels: Map<string, Channel>,
  connectFn: () => Promise<void>
): Channel | null {
  const topic = `group:${channelId}`;

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join group channel: socket not connected');
    connectFn();
    return null;
  }

  const channel = socket.channel(topic, {});

  channel.on('new_message', (payload) => {
    if (!isRecord(payload) || !isRecord(payload['message'])) return;

    const normalized = toChannelMessage(payload['message']);
    if (normalized.is_encrypted && normalized.encrypted_content) {
      normalized.content = '🔒 Open on mobile or desktop to read';
    }
    useGroupStore.getState().addChannelMessage(normalized);
  });

  channel.on('message_updated', (payload) => {
    if (!isRecord(payload) || !isRecord(payload['message'])) return;

    const normalized = toChannelMessage(payload['message']);
    useGroupStore.getState().updateChannelMessage(normalized);
  });

  channel.on('message_deleted', (payload) => {
    if (!isRecord(payload) || typeof payload['message_id'] !== 'string') return;

    useGroupStore.getState().removeChannelMessage(payload['message_id'], channelId);
  });

  channel.on('link_preview_updated', (payload) => {
    if (!isRecord(payload) || !isRecord(payload['message'])) return;

    const normalized = toChannelMessage(payload['message']);
    useGroupStore.getState().updateChannelMessage(normalized);
  });

  channel.on('reaction_added', (payload) => {
    if (
      !isRecord(payload) ||
      typeof payload['message_id'] !== 'string' ||
      typeof payload['emoji'] !== 'string' ||
      typeof payload['user_id'] !== 'string'
    ) {
      return;
    }

    useGroupStore
      .getState()
      .addReactionToChannelMessage(
        channelId,
        payload['message_id'],
        payload['emoji'],
        payload['user_id']
      );
  });

  channel.on('reaction_removed', (payload) => {
    if (
      !isRecord(payload) ||
      typeof payload['message_id'] !== 'string' ||
      typeof payload['emoji'] !== 'string' ||
      typeof payload['user_id'] !== 'string'
    ) {
      return;
    }

    useGroupStore
      .getState()
      .removeReactionFromChannelMessage(
        channelId,
        payload['message_id'],
        payload['emoji'],
        payload['user_id']
      );
  });

  channel.on('typing', (payload) => {
    if (
      !isRecord(payload) ||
      typeof payload['user_id'] !== 'string' ||
      typeof payload['is_typing'] !== 'boolean'
    ) {
      return;
    }

    handleTypingEvent(channelId, payload['user_id'], payload['is_typing']);
  });

  channel.on('presence_state', (state) => logger.log('Channel presence state:', state));
  channel.on('presence_diff', (diff) => logger.log('Channel presence diff:', diff));

  channel
    .join()
    .receive('ok', () => logger.log(`Joined channel ${channelId}`))
    .receive('error', (resp: unknown) =>
      logger.error(`Failed to join channel ${channelId}:`, resp)
    );

  channels.set(topic, channel);
  return channel;
}

/**
 * Leave and clean up a group channel.
 */
export function leaveGroupChannel(channelId: string, channels: Map<string, Channel>): void {
  const topic = `group:${channelId}`;
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }

  // Clear any pending typing timeouts for this channel
  for (const key of typingTimeouts.keys()) {
    if (key.startsWith(`${channelId}:`)) {
      clearTimeout(typingTimeouts.get(key));
      typingTimeouts.delete(key);
    }
  }
}
