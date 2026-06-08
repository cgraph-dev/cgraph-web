import { format } from 'date-fns';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { createLogger } from '@/lib/logger';
import type { UIPreferences, MessageBubbleProps } from './types';

const logger = createLogger('MessageBubble');

/**
 * Safe time formatter that handles invalid dates
 */
export function formatMessageTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

/**
 * Handles adding a reaction to a message.
 */
export async function handleAddReaction(
  messageId: string,
  emoji: string,
  _conversationId?: string
): Promise<void> {
  try {
    const { addReaction } = useChatStore.getState();
    await addReaction(messageId, emoji);
  } catch (error) {
    logger.warn('Failed to add reaction:', error);
  }
}

type MessageReaction = MessageBubbleProps['message']['reactions'][number];

function reactionSignature(reaction: MessageReaction): string {
  const users = reaction.users?.map((user) => user.id).join(',') ?? reaction.userId;
  return [
    reaction.emoji,
    reaction.count ?? '',
    reaction.hasReacted === true ? '1' : '0',
    users,
  ].join(':');
}

function reactionsEqual(left: MessageReaction[], right: MessageReaction[]): boolean {
  return (
    left.length === right.length &&
    left.every((reaction, index) => reactionSignature(reaction) === reactionSignature(right[index]!))
  );
}

/**
 * Map UIPreferences voiceVisualizerTheme to AdvancedVoiceVisualizer theme
 * The visualizer expects 'amber' but UIPreferences uses 'sunset-orange'
 */
export function mapVisualizerTheme(
  theme: UIPreferences['voiceVisualizerTheme']
): 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber' {
  if (theme === 'sunset-orange') {
    return 'amber';
  }
  return theme;
}

/**
 * Custom equality comparator for MessageBubble memo.
 * Prevents unnecessary re-renders by comparing only rendering-relevant props.
 */
export function areMessageBubblePropsEqual(
  prevProps: MessageBubbleProps,
  nextProps: MessageBubbleProps
): boolean {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isEdited === nextProps.message.isEdited &&
    reactionsEqual(prevProps.message.reactions, nextProps.message.reactions) &&
    prevProps.message.isPinned === nextProps.message.isPinned &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.isMenuOpen === nextProps.isMenuOpen &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editContent === nextProps.editContent &&
    // Customization fields — must track all sender rendering fields
    prevProps.uiPreferences === nextProps.uiPreferences &&
    prevProps.message.sender?.bubbleStyle === nextProps.message.sender?.bubbleStyle &&
    prevProps.message.sender?.bubbleColor === nextProps.message.sender?.bubbleColor &&
    prevProps.message.sender?.bubbleRadius === nextProps.message.sender?.bubbleRadius &&
    prevProps.message.sender?.messageEffect === nextProps.message.sender?.messageEffect &&
    prevProps.message.sender?.equippedTitleId === nextProps.message.sender?.equippedTitleId &&
    prevProps.message.sender?.equippedNameplateId ===
      nextProps.message.sender?.equippedNameplateId &&
    prevProps.message.sender?.avatarBorderId === nextProps.message.sender?.avatarBorderId
  );
}
