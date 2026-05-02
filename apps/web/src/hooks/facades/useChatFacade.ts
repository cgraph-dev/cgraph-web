/**
 * Chat Facade Hook
 *
 * Composition hook that aggregates chat store,
 * effects store, and bubble store into a single domain interface.
 *
 * Provides a unified API for conversations, messages, typing indicators,
 * reactions, E2EE state, and visual effects — without exposing store internals.
 *
 * @example
 * ```tsx
 * const {
 *   conversations,
 *   activeMessages,
 *   sendMessage,
 *   setActiveConversation,
 * } = useChatFacade();
 * ```
 *
 */

import {
  useChatStore,
  useChatBubbleStore,
  type Conversation,
  type Message,
} from '@/modules/chat/store';
import type { ChatBubbleConfig } from '@/stores/theme';

export interface ChatFacade {
  // Conversation state
  conversations: readonly Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;

  // Message state
  activeMessages: readonly Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;

  // Typing
  typingUsers: Readonly<Record<string, readonly string[]>>;

  // Actions — Conversations
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  createConversation: (
    userIds: string[],
    options?: { readonly type?: 'secret' | 'cloud' }
  ) => Promise<Conversation>;

  // Actions — Messages
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: { type?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;

  // Actions — Reactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;

  // Actions — Typing
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
    startedAt?: string
  ) => void;

  // Effects — read-only derived state (archived: chat effects removed)
  activeEffect: { type: string; intensity: number };
  activeBubbleStyle: ChatBubbleConfig;
}

const DEFAULT_EFFECT = { type: 'none', intensity: 0 } as const;

/**
 * Composes chat domain state from chatStore and chatBubbleStore.
 */
export function useChatFacade(): ChatFacade {
  // Chat store — primitive selectors
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) => s.messages);
  const isLoadingConversations = useChatStore((s) => s.isLoadingConversations);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMoreMessagesMap = useChatStore((s) => s.hasMoreMessages);
  const typingUsers = useChatStore((s) => s.typingUsers);

  // Chat store — actions
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const setTypingUser = useChatStore((s) => s.setTypingUser);

  // Effects store — read-only
  // Effects store — read-only (archived: constant default)
  const activeBubbleStyle = useChatBubbleStore().style;

  // Derived: messages for the active conversation
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  const hasMoreMessages = activeConversationId
    ? (hasMoreMessagesMap[activeConversationId] ?? true)
    : false;

  return {
    conversations,
    activeConversationId,
    isLoadingConversations,
    activeMessages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchConversations,
    setActiveConversation,
    createConversation,
    fetchMessages,
    sendMessage,
    deleteMessage,
    editMessage,
    addReaction,
    removeReaction,
    setTypingUser,
    activeEffect: DEFAULT_EFFECT,
    activeBubbleStyle,
  };
}
