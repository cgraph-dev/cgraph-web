import { formatRelativeTime } from '@cgraph-dev/utils';
import type { Conversation } from '@/modules/chat/store/chatStore.impl';
import { getAvatarBorderId } from '@/lib/utils';

/** Get Conversation Name. */
export function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) {
    return conversation.name;
  }

  if (conversation.isGroup) {
    return conversation.name || 'Group Chat';
  }

  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return (
    otherParticipant?.nickname ||
    otherParticipant?.user?.displayName ||
    otherParticipant?.user?.username ||
    'Unknown'
  );
}

/** Get Conversation Avatar. */
export function getConversationAvatar(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.avatarUrl) {
    return conversation.avatarUrl;
  }

  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.avatarUrl || null;
}

/** Get Conversation Avatar Border Id. */
export function getConversationAvatarBorderId(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.isGroup) {
    return getAvatarBorderId(conversation);
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  const user = otherParticipant && 'user' in otherParticipant ? otherParticipant.user : undefined;
  return getAvatarBorderId(user);
}

/** Get Conversation Online Status. */
export function getConversationOnlineStatus(
  conversation: Conversation,
  currentUserId?: string
): boolean {
  if (conversation.isGroup) return false;
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.status === 'online';
}

/**
 * Format message timestamp using shared Signal-style relative formatting.
 * Delegates to @cgraph-dev/utils for cross-platform parity with mobile.
 */
export function formatMessageTime(dateString: string): string {
  return formatRelativeTime(dateString);
}

/** Filter conversations by display name. */
export function filterConversations(
  conversations: readonly Conversation[],
  searchQuery: string,
  currentUserId?: string
): readonly Conversation[] {
  if (!searchQuery) return conversations;

  const query = searchQuery.toLowerCase();
  return conversations.filter((conversation) =>
    getConversationName(conversation, currentUserId).toLowerCase().includes(query)
  );
}
