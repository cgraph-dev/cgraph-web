import { asEnum, asRecordOrEmpty, asRecordOrUndef, asStringOrNull } from '@/lib/api-utils';
import { identityFieldsFromApi } from '@/lib/identity';
import type { ChannelMessage } from './group-types';

const MESSAGE_TYPES = new Set<ChannelMessage['messageType']>([
  'text',
  'image',
  'video',
  'file',
  'audio',
  'voice',
  'sticker',
  'gif',
  'system',
]);

/**
 * Normalize raw API message data to the app-owned ChannelMessage shape.
 * Backend payloads can arrive as snake_case while the routed group UI expects camelCase.
 */
export function normalizeChannelMessage(raw: Record<string, unknown>): ChannelMessage {
  const sender = asRecordOrEmpty(raw.sender ?? raw.author);
  const identity = identityFieldsFromApi(sender);
  const replyToRaw = asRecordOrUndef(raw.replyTo ?? raw.reply_to);

  return {
    id: String(raw.id ?? ''),
    authorId: String(raw.authorId ?? raw.senderId ?? raw.sender_id ?? sender.id ?? ''),
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
    channelId: String(raw.channelId ?? raw.channel_id ?? ''),
    content: String(raw.content ?? ''),
    messageType: asEnum(
      raw.messageType ?? raw.message_type ?? raw.contentType ?? raw.content_type,
      MESSAGE_TYPES,
      'text'
    ),
    replyToId: asStringOrNull(raw.replyToId ?? raw.reply_to_id),
    replyTo: replyToRaw ? normalizeChannelMessage(replyToRaw) : null,
    isPinned: Boolean(raw.isPinned ?? raw.is_pinned ?? false),
    isEdited: Boolean(raw.isEdited ?? raw.is_edited ?? false),
    deletedAt: asStringOrNull(raw.deletedAt ?? raw.deleted_at),
    metadata: asRecordOrEmpty(raw.metadata),
    fileUrl: asStringOrNull(raw.fileUrl ?? raw.file_url),
    fileName: asStringOrNull(raw.fileName ?? raw.file_name),
    fileSize:
      typeof raw.fileSize === 'number'
        ? raw.fileSize
        : typeof raw.file_size === 'number'
          ? raw.file_size
          : null,
    fileMimeType: asStringOrNull(raw.fileMimeType ?? raw.file_mime_type),
    thumbnailUrl: asStringOrNull(raw.thumbnailUrl ?? raw.thumbnail_url),
    reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.insertedAt ?? raw.inserted_at ?? ''),
    encrypted_content:
      typeof raw.encrypted_content === 'string' ? raw.encrypted_content : undefined,
    sender_key_id: typeof raw.sender_key_id === 'string' ? raw.sender_key_id : undefined,
    chain_index: typeof raw.chain_index === 'number' ? raw.chain_index : undefined,
    is_encrypted: typeof raw.is_encrypted === 'boolean' ? raw.is_encrypted : undefined,
  };
}
