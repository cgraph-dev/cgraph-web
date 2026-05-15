/**
 * Chat Store — Typed Normalizer Bridges
 *
 * These functions convert Record<string,unknown> outputs from the generic
 * normalizeMessage/normalizeConversations utilities into typed domain objects.
 * They exist to bridge the declared vs actual return types at the API boundary
 * without using `as` type assertions.
 */

import type { Message, MessageMetadata } from './chatStore.types';
import { normalizeMessage } from '@/lib/api-utils';
import { identityFieldsFromApi } from '@/lib/identity';

function rawSender(raw: Record<string, unknown>): Message['sender'] {
  const s = raw.sender instanceof Object ? Object.fromEntries(Object.entries(raw.sender)) : {};
  const identity = identityFieldsFromApi(s);
  const sender: Message['sender'] = {
    id: identity.id,
    username: identity.username,
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
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
  };
  return sender;
}

function rawMessageType(raw: Record<string, unknown>): Message['messageType'] {
  const t = raw.messageType ?? raw.contentType;
  if (
    t === 'image' ||
    t === 'video' ||
    t === 'file' ||
    t === 'audio' ||
    t === 'voice' ||
    t === 'sticker' ||
    t === 'gif' ||
    t === 'system'
  )
    return t;
  return 'text';
}

function rawMetadata(raw: Record<string, unknown>): MessageMetadata {
  if (raw.metadata instanceof Object) {
    const m: MessageMetadata = Object.fromEntries(Object.entries(raw.metadata));
    return m;
  }
  return {};
}

/**
 * Convert a normalized message Record<string,unknown> to a typed Message.
 * Ensures required string fields never remain null/undefined.
 */
export function toTypedMessage(raw: Record<string, unknown>): Message {
  const message: Message = {
    id: typeof raw.id === 'string' ? raw.id : String(raw.id ?? ''),
    conversationId: typeof raw.conversationId === 'string' ? raw.conversationId : '',
    senderId: typeof raw.senderId === 'string' ? raw.senderId : '',
    content: typeof raw.content === 'string' ? raw.content : '',
    encryptedContent: typeof raw.encryptedContent === 'string' ? raw.encryptedContent : null,
    isEncrypted: raw.isEncrypted === true,
    messageType: rawMessageType(raw),
    replyToId: typeof raw.replyToId === 'string' ? raw.replyToId : null,
    replyTo: null,
    isPinned: raw.isPinned === true,
    isEdited: raw.isEdited === true,
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
    metadata: rawMetadata(raw),
    reactions: [],
    sender: rawSender(raw),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };

  if ('clientMessageId' in raw || 'client_message_id' in raw) {
    message.clientMessageId =
      typeof raw.clientMessageId === 'string'
        ? raw.clientMessageId
        : typeof raw.client_message_id === 'string'
          ? raw.client_message_id
          : null;
  }

  if ('sequence' in raw) {
    message.sequence = typeof raw.sequence === 'number' ? raw.sequence : null;
  }

  if ('ephemeralPublicKey' in raw) {
    message.ephemeralPublicKey =
      typeof raw.ephemeralPublicKey === 'string' ? raw.ephemeralPublicKey : undefined;
  }

  if ('nonce' in raw) {
    message.nonce = typeof raw.nonce === 'string' ? raw.nonce : undefined;
  }

  if ('senderIdentityKey' in raw) {
    message.senderIdentityKey =
      typeof raw.senderIdentityKey === 'string' ? raw.senderIdentityKey : undefined;
  }

  if ('decryptionFailed' in raw || 'decryptFailed' in raw) {
    message.decryptionFailed =
      raw.decryptionFailed === true || raw.decryptFailed === true ? true : undefined;
  }

  if ('requiresMobile' in raw) {
    message.requiresMobile =
      typeof raw.requiresMobile === 'boolean' ? raw.requiresMobile : undefined;
  }

  if ('scheduledAt' in raw) {
    message.scheduledAt = typeof raw.scheduledAt === 'string' ? raw.scheduledAt : null;
  }

  if ('scheduleStatus' in raw) {
    message.scheduleStatus =
      raw.scheduleStatus === 'scheduled' ||
      raw.scheduleStatus === 'sent' ||
      raw.scheduleStatus === 'cancelled'
        ? raw.scheduleStatus
        : 'immediate';
  }

  if ('forwardedFromId' in raw) {
    message.forwardedFromId = typeof raw.forwardedFromId === 'string' ? raw.forwardedFromId : null;
  }

  if ('forwardedFromUserId' in raw) {
    message.forwardedFromUserId =
      typeof raw.forwardedFromUserId === 'string' ? raw.forwardedFromUserId : null;
  }

  if ('forwardedFromUserName' in raw) {
    message.forwardedFromUserName =
      typeof raw.forwardedFromUserName === 'string' ? raw.forwardedFromUserName : null;
  }

  return message;
}

/**
 * Convenience: normalize a raw API response object to a typed Message in one step.
 */
export function normalizeToMessage(raw: Record<string, unknown>): Message {
  return toTypedMessage(normalizeMessage(raw));
}
