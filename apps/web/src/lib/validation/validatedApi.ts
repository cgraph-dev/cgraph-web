/**
 * Validated API Client
 *
 * Wraps the base API client with Zod schema validation for
 * runtime type safety and better error handling.
 *
 */

// Uses raw api instance directly — this file is the Zod validation wrapper layer;
// migrating to apiClient would create a circular abstraction on top of itself.
import { http } from '@/lib/api-client';
import {
  validateWithFallback,
  loginResponseSchema,
  registerResponseSchema,
  refreshResponseSchema,
  conversationsListSchema,
  messagesListSchema,
  userSchema,
  conversationSchema,
  messageSchema,
  type LoginResponse,
  type Tokens,
  type Conversation,
  type Message,
  type User,
} from './schemas';

// Validated API Methods

/**
 * Validated authentication endpoints
 */
export const authApi = {
  /**
   * Login with email/password
   */
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await http.post('/api/v1/auth/login', {
      identifier,
      password,
    });
    return validateWithFallback(loginResponseSchema, response.data, 'login');
  },

  /**
   * Register a new user
   */
  async register(email: string, username: string, password: string): Promise<LoginResponse> {
    const response = await http.post('/api/v1/auth/register', {
      user: {
        email,
        username,
        password,
        password_confirmation: password,
      },
    });
    return validateWithFallback(registerResponseSchema, response.data, 'register');
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<Tokens> {
    const response = await http.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    const validated = validateWithFallback(refreshResponseSchema, response.data, 'refresh');
    // Normalize response - some endpoints return { tokens: {...} }, others return tokens directly
    return 'tokens' in validated ? validated.tokens : validated;
  },

  /**
   * Get current user profile
   */
  async me(): Promise<User> {
    const response = await http.get('/api/v1/me');
    // Backend may wrap in { data: {...} } or { user: {...} }
    const userData = response.data?.data || response.data?.user || response.data;
    return validateWithFallback(userSchema, userData, 'me');
  },

  /**
   * Logout (invalidate tokens)
   */
  async logout(): Promise<void> {
    await http.post('/api/v1/auth/logout');
  },
};

/**
 * Validated conversation endpoints
 */
export const conversationsApi = {
  /**
   * List user's conversations
   */
  async list(): Promise<Conversation[]> {
    const response = await http.get('/api/v1/conversations');
    const validated = validateWithFallback(
      conversationsListSchema,
      response.data,
      'conversations.list'
    );

    // Normalize response format
    if (Array.isArray(validated)) {
      return validated;
    }
    return validated.conversations || validated.data || [];
  },

  /**
   * Get a single conversation
   */
  async get(conversationId: string): Promise<Conversation> {
    const response = await http.get(`/api/v1/conversations/${conversationId}`);
    const data = response.data?.conversation || response.data?.data || response.data;
    return validateWithFallback(conversationSchema, data, 'conversations.get');
  },

  /**
   * Create a new conversation
   */
  async create(userIds: string[]): Promise<Conversation> {
    const response = await http.post('/api/v1/conversations', {
      user_ids: userIds,
    });
    const data = response.data?.conversation || response.data?.data || response.data;
    return validateWithFallback(conversationSchema, data, 'conversations.create');
  },
};

/**
 * Validated message endpoints
 */
export const messagesApi = {
  /**
   * List messages in a conversation
   */
  async list(
    conversationId: string,
    params?: { before?: string; limit?: number }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const response = await http.get(`/api/v1/conversations/${conversationId}/messages`, { params });
    const validated = validateWithFallback(messagesListSchema, response.data, 'messages.list');

    // Normalize response format
    let messages: Message[];
    if (Array.isArray(validated)) {
      messages = validated;
    } else {
      messages = validated.messages || validated.data || [];
    }

    const hasMore = Array.isArray(validated)
      ? messages.length >= (params?.limit || 50)
      : (validated.meta?.has_more ?? messages.length >= (params?.limit || 50));

    return { messages, hasMore };
  },

  /**
   * Send a message
   */
  async send(
    conversationId: string,
    content: string,
    options?: {
      messageType?: string;
      replyToId?: string;
      encryptedContent?: string;
      ephemeralPublicKey?: string;
      nonce?: string;
    }
  ): Promise<Message> {
    const response = await http.post(`/api/v1/conversations/${conversationId}/messages`, {
      content,
      message_type: options?.messageType || 'text',
      reply_to_id: options?.replyToId,
      encrypted_content: options?.encryptedContent,
      ephemeral_public_key: options?.ephemeralPublicKey,
      nonce: options?.nonce,
    });
    const data = response.data?.message || response.data?.data || response.data;
    return validateWithFallback(messageSchema, data, 'messages.send');
  },

  /**
   * Edit a message
   */
  async edit(conversationId: string, messageId: string, content: string): Promise<Message> {
    const response = await http.patch(
      `/api/v1/conversations/${conversationId}/messages/${messageId}`,
      { content }
    );
    const data = response.data?.message || response.data?.data || response.data;
    return validateWithFallback(messageSchema, data, 'messages.edit');
  },

  /**
   * Delete a message
   */
  async delete(conversationId: string, messageId: string): Promise<void> {
    await http.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
  },
};

// Export validated API client

export const validatedApi = {
  auth: authApi,
  conversations: conversationsApi,
  messages: messagesApi,
};

export default validatedApi;
