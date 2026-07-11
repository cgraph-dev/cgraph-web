/**
 * Chat Module Store
 *
 * Consolidated chat state management.
 */

// Main chat store — import directly from impl to avoid barrel cycle
// (chatStore.ts is a passthrough that re-exports chatStore.impl.ts)
export { useChatStore } from './chatStore.impl';
export type {
  Message,
  Conversation,
  Reaction,
  ConversationParticipant,
  ChatState,
  TypingUserInfo,
  MessageMetadata,
  EditHistory,
} from './chatStore.types';
