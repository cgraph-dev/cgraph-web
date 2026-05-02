/**
 * Messaging endpoints.
 *
 * Endpoints under /api/v1/conversations.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unwrapRecordKey(value: unknown, key: string): unknown {
  return isRecord(value) && key in value ? value[key] : value;
}

function unwrapArrayKey(value: unknown, key: string): unknown {
  const unwrapped = unwrapRecordKey(value, key);
  return Array.isArray(unwrapped) ? unwrapped : value;
}

const MessageRecordSchema = z
  .object({
    id: z.string(),
    conversation_id: z.string().optional(),
    conversationId: z.string().optional(),
    sender_id: z.string().optional(),
    senderId: z.string().optional(),
    sender: z.unknown().optional(),
    content: z.string().nullable().optional(),
    encrypted_content: z.string().nullable().optional(),
    encryptedContent: z.string().nullable().optional(),
    displayContent: z.string().nullable().optional(),
    display_content: z.string().nullable().optional(),
    content_type: z.string().optional(),
    contentType: z.string().optional(),
    messageType: z.string().optional(),
    file_url: z.string().nullable().optional(),
    file_name: z.string().nullable().optional(),
    file_size: z.number().nullable().optional(),
    voice_url: z.string().nullable().optional(),
    voice_duration: z.number().nullable().optional(),
    is_encrypted: z.boolean().optional(),
    isEncrypted: z.boolean().optional(),
    requiresMobile: z.boolean().optional(),
    requires_mobile: z.boolean().optional(),
    decryptFailed: z.boolean().optional(),
    decrypt_failed: z.boolean().optional(),
    chain_index: z.number().nullable().optional(),
    sender_key_id: z.string().nullable().optional(),
    edited_at: z.string().nullable().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

const MessageSchema = z.preprocess(
  (value) => unwrapRecordKey(unwrapRecordKey(value, 'data'), 'message'),
  MessageRecordSchema
);

const ConversationRecordSchema = z
  .object({
    id: z.string(),
    type: z.enum(['direct', 'group']).optional(),
    conversation_type: z.enum(['secret', 'cloud']).optional(),
    conversationType: z.enum(['secret', 'cloud']).optional(),
    participants: z.array(z.unknown()).optional(),
    last_message: MessageSchema.nullable().optional(),
    lastMessage: MessageSchema.nullable().optional(),
    unread_count: z.number().optional(),
    unreadCount: z.number().optional(),
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

const ConversationSchema = z.preprocess(
  (value) => unwrapRecordKey(unwrapRecordKey(value, 'data'), 'conversation'),
  ConversationRecordSchema
);

// The backend wraps paginated collections as `{ data: [...], page_info: {...} }`.
// `apiCall` strips the outer `data`, so the schema here is the bare array.
// `result.pageInfo` (exposed on ApiSuccess) carries cursors / has_next_page.
const MessageListSchema = z.preprocess(
  (value) => unwrapArrayKey(unwrapArrayKey(value, 'data'), 'messages'),
  z.array(MessageSchema)
);
const ConversationListSchema = z.preprocess(
  (value) => unwrapArrayKey(unwrapArrayKey(value, 'data'), 'conversations'),
  z.array(ConversationSchema)
);

export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type MessageList = z.infer<typeof MessageListSchema>;
export type ConversationList = z.infer<typeof ConversationListSchema>;

// ---------------------------------------------------------------------------
// Send-message params
// ---------------------------------------------------------------------------

export interface SendMessageParams {
  readonly content?: string;
  /** Base64-encoded ciphertext for E2EE messages. */
  readonly encrypted_content?: string;
  readonly content_type?: 'text' | 'file' | 'voice' | 'image' | 'gif' | 'sticker';
  readonly file_url?: string;
  readonly file_name?: string;
  readonly file_size?: number;
  readonly voice_url?: string;
  readonly voice_duration?: number;
  readonly is_encrypted?: boolean;
  readonly chain_index?: number;
  readonly sender_key_id?: string;
  readonly reply_to_id?: string;
}

// ---------------------------------------------------------------------------
// Fetch-messages params
// ---------------------------------------------------------------------------

export interface FetchMessagesParams {
  readonly cursor?: string;
  readonly limit?: number;
  readonly direction?: 'before' | 'after';
}

// ---------------------------------------------------------------------------
// Fetch-conversations params
// ---------------------------------------------------------------------------

export interface GetConversationsParams {
  readonly cursor?: string;
  readonly limit?: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates messaging endpoints bound to the provided Axios instance. */
export function createMessagingEndpoints(http: AxiosInstance) {
  return {
    /**
     * Send a message to a conversation.
     *
     * Supports plain text, E2EE (Signal / Ghost Chat), file attachments, and
     * voice messages — pass the relevant fields in `params`.
     */
    async send(conversationId: string, params: SendMessageParams): Promise<ApiResult<Message>> {
      return apiCall(
        () => http.post(`/api/v1/conversations/${conversationId}/messages`, params),
        MessageSchema
      );
    },

    /**
     * Edit the text content of an existing message.
     *
     * Only the original sender may edit a message; the server enforces this.
     */
    async edit(
      conversationId: string,
      messageId: string,
      content: string
    ): Promise<ApiResult<Message>> {
      return apiCall(
        () =>
          http.patch(`/api/v1/conversations/${conversationId}/messages/${messageId}`, { content }),
        MessageSchema
      );
    },

    /**
     * Delete a message from a conversation.
     *
     * Returns an empty-object result on success (server returns 204 / `{}`).
     */
    async remove(
      conversationId: string,
      messageId: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () => http.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`),
        z.unknown().transform((): Record<string, never> => ({}))
      );
    },

    /**
     * Fetch a page of messages for a conversation using cursor pagination.
     *
     * Pass `cursor` from a previous response to retrieve the next page.
     * Never use offset — the backend uses cursor pagination exclusively.
     */
    async fetch(
      conversationId: string,
      params?: FetchMessagesParams
    ): Promise<ApiResult<MessageList>> {
      return apiCall(
        () =>
          http.get(`/api/v1/conversations/${conversationId}/messages`, {
            params,
          }),
        MessageListSchema
      );
    },

    /**
     * List the current user's conversations with cursor pagination.
     */
    async getConversations(params?: GetConversationsParams): Promise<ApiResult<ConversationList>> {
      return apiCall(() => http.get('/api/v1/conversations', { params }), ConversationListSchema);
    },
  };
}
