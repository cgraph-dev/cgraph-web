/**
 * Route adapter for the shared chat message surface.
 */

import { AnimatedMessageWrapper } from '@/modules/chat/components/animated-message-wrapper';
import { MessageBubble } from '@/modules/chat/components/message-bubble';
import { DEFAULT_UI_PREFERENCES } from '@/pages/messages/conversation/types';
import type { EnhancedMessageBubbleProps } from './types';

/**
 * The routed Cloud DM page keeps route-specific gestures and scroll anchors here,
 * while message rendering, media, receipts, reactions, and actions come from the
 * shared chat module used by the rest of the app.
 */
export function EnhancedMessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
  isMenuOpen = false,
  onToggleMenu,
  isEditing = false,
  editContent = '',
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  index,
  onAvatarClick,
}: EnhancedMessageBubbleProps) {
  return (
    <AnimatedMessageWrapper
      isOwnMessage={isOwn}
      index={index}
      isNew={false}
      messageId={message.id}
      onSwipeReply={onReply}
      enableGestures
    >
      <MessageBubble
        message={message}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onReply={onReply}
        uiPreferences={DEFAULT_UI_PREFERENCES}
        onAvatarClick={onAvatarClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={onPin}
        onForward={onForward}
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        isEditing={isEditing}
        editContent={editContent}
        onEditContentChange={onEditContentChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />
    </AnimatedMessageWrapper>
  );
}
