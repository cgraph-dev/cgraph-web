/**
 * EnhancedMessageBubble - individual message display with reactions
 */

import { useState, useRef, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import type { Reaction } from '@/modules/chat/store/chatStore.types';
import { useAuthStore } from '@/modules/auth/store';
import { AnimatedMessageWrapper } from '@/modules/chat/components/animated-message-wrapper';
import { springs } from '@/lib/animation-presets';
import {
  AnimatedReactionBubble,
  ReactionPicker,
} from '@/modules/chat/components/animated-reaction-bubble';
import { MessageActionMenu } from '@/modules/chat/components/message-bubble/message-action-menu';
import { MessageEditForm } from '@/modules/chat/components/message-bubble/message-edit-form';
import { MessageMediaContent } from '@/modules/chat/components/message-bubble/message-media-content';
import { ReadReceipts } from '@/modules/chat/components/message-bubble/read-receipts';
import type { ReadByEntry } from '@/modules/chat/components/message-bubble/types';
import { GlassCard } from '@/shared/components/ui';
import { InlineTitle } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/advanced-voice-visualizer';
import { FileMessage } from '@/modules/chat/components/file-message';
import { GifMessage } from '@/modules/chat/components/gif-message';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import type { EnhancedMessageBubbleProps } from './types';
import { FADE_IN } from '@/lib/animations/transitions';

const logger = createLogger('EnhancedMessageBubble');

function isLockedNodesFile(message: EnhancedMessageBubbleProps['message']): boolean {
  return (
    (message.metadata?.is_file_locked === true || message.metadata?.isFileLocked === true) &&
    (typeof message.metadata?.nodes_price === 'number' ||
      typeof message.metadata?.nodesPrice === 'number')
  );
}

/** Convert backend receipt metadata into the avatar receipt component shape. */
function readReceiptEntries(
  readBy: EnhancedMessageBubbleProps['message']['metadata']['readBy'],
  currentUserId?: string
): ReadByEntry[] {
  if (!Array.isArray(readBy)) return [];

  return readBy
    .filter((entry) => entry && entry.userId !== currentUserId)
    .map((entry) => ({
      id: entry.id ?? entry.userId,
      userId: entry.userId,
      readAt: entry.readAt,
      username: entry.displayName ?? entry.username ?? undefined,
      avatarUrl: entry.avatarUrl ?? undefined,
    }));
}

/**
 * Enhanced Message Bubble component.
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
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const { addReaction } = useChatStore();
  const { user } = useAuthStore();
  const [isReacting, setIsReacting] = useState(false);
  const hasFileAttachment =
    message.messageType === 'image' ||
    message.messageType === 'video' ||
    message.messageType === 'file';
  const isGifMessage = message.messageType === 'gif';
  const isStickerMessage = message.messageType === 'sticker';
  const readers = isOwn ? readReceiptEntries(message.metadata?.readBy, user?.id) : [];

  // React 19 useOptimistic: show new reactions immediately before the API responds.
  // When the parent re-renders with updated message.reactions from the store,
  // the optimistic overlay is automatically discarded.
  const [optimisticReactions, addOptimisticReaction] = useOptimistic(
    message.reactions,
    (state: Reaction[], newReaction: { emoji: string; userId: string; username: string }) => [
      ...state,
      {
        id: `optimistic-${Date.now()}`,
        emoji: newReaction.emoji,
        userId: newReaction.userId,
        user: { id: newReaction.userId, username: newReaction.username },
      },
    ]
  );

  const formatMessageTime = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const handleAddReaction = async (emoji: string) => {
    if (isReacting) return;
    setIsReacting(true);
    HapticFeedback.medium();
    // Optimistic: show the reaction immediately
    addOptimisticReaction({ emoji, userId: user?.id ?? '', username: user?.username ?? '' });
    try {
      await addReaction(message.id, emoji);
      setShowReactionPicker(false);
    } catch (err) {
      logger.error('Failed to add reaction:', err);
      HapticFeedback.error();
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <AnimatedMessageWrapper
      isOwnMessage={isOwn}
      index={index}
      isNew={false}
      messageId={message.id}
      onSwipeReply={onReply}
      onLongPress={() => setShowReactionPicker(true)}
      enableGestures
    >
      <motion.div
        ref={bubbleRef}
        className={`group flex w-full items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        layout
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 flex-shrink-0">
            {showAvatar && (
              <motion.button
                onClick={() => message.sender?.id && onAvatarClick?.(message.sender.id)}
                className="ring-primary-500/20 h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-white/[0.08] ring-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                whileTap={{ scale: 0.88 }}
                transition={springs.snappy}
                title={`View ${message.sender?.displayName || message.sender?.username || 'user'}'s profile`}
              >
                <ThemedAvatar
                  src={message.sender.avatarUrl}
                  alt={message.sender.displayName || 'User'}
                  size="small"
                  className="h-8 w-8"
                  avatarBorderId={getAvatarBorderId(message.sender)}
                />
              </motion.button>
            )}
          </div>
        )}

        {/* Message content */}
        <div
          className={`flex w-full min-w-0 max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        >
          {/* Message bubble with glassmorphism */}
          <div className="relative w-full">
            {/* Actions (floating on hover) */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1`}
                  initial={{ opacity: 0, scale: 0.8, x: isOwn ? 10 : -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springs.snappy}
                >
                  <motion.button
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className="rounded-full border border-[var(--token-card-border)] bg-white/[0.08] p-2 text-gray-400 backdrop-blur-sm hover:text-primary-400"
                    whileTap={{ scale: 0.88 }}
                    title="React"
                    aria-label="React to message"
                  >
                    <FaceSmileIcon className="h-4 w-4" />
                  </motion.button>

                  <MessageActionMenu
                    onReply={onReply}
                    onEdit={isOwn ? onEdit : undefined}
                    onPin={onPin}
                    onForward={onForward}
                    onDelete={onDelete}
                    isMenuOpen={isMenuOpen}
                    onToggleMenu={onToggleMenu}
                    isOwn={isOwn}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glassmorphic bubble */}
            <GlassCard
              variant={isOwn ? 'neon' : 'frosted'}
              intensity="medium"
              glow={isOwn}
              glowColor={isOwn ? 'rgba(16, 185, 129, 0.4)' : undefined}
              hover3D
              className={`w-full px-4 py-3 ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            >
              {/* Sender name (for received messages) */}
              {!isOwn && showAvatar && message.sender && (
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary-300">
                    {message.sender.displayName || message.sender.username}
                  </span>
                  {message.sender.equippedTitleId && (
                    <InlineTitle titleId={message.sender.equippedTitleId} size="xs" />
                  )}
                </div>
              )}

              {message.replyTo && (
                <div className="mb-2 rounded-md border-l-2 border-primary-400 bg-white/[0.06] px-3 py-2">
                  <p className="text-xs font-medium text-primary-200">
                    {message.replyTo.sender?.displayName ||
                      message.replyTo.sender?.username ||
                      'Replied message'}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {message.replyTo.content ||
                      message.replyTo.metadata?.filename ||
                      message.replyTo.messageType}
                  </p>
                </div>
              )}

              {message.isPinned && (
                <div className="bg-primary-500/15 mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-primary-200">
                  Pinned
                </div>
              )}

              {message.deletedAt ? (
                <p className="italic text-white/50">Message deleted</p>
              ) : isEditing ? (
                <MessageEditForm
                  editContent={editContent}
                  onEditContentChange={onEditContentChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
              ) : (
                <>
                  {/* Text content */}
                  {message.content &&
                    message.messageType !== 'voice' &&
                    message.messageType !== 'audio' &&
                    !isGifMessage &&
                    !isStickerMessage && (
                      <motion.p
                        className="whitespace-pre-wrap break-words text-white"
                        {...FADE_IN}
                        transition={{ delay: 0.1 }}
                      >
                        {message.content}
                      </motion.p>
                    )}

                  {isGifMessage && <GifMessage message={message} isOwnMessage={isOwn} />}

                  {isStickerMessage && (
                    <div
                      className="flex flex-col items-center gap-1"
                      aria-label={`Sticker ${
                        typeof message.metadata?.stickerLabel === 'string'
                          ? message.metadata.stickerLabel
                          : message.content
                      }`}
                    >
                      <span className="text-5xl leading-none">
                        {typeof message.metadata?.stickerEmoji === 'string'
                          ? message.metadata.stickerEmoji
                          : message.content}
                      </span>
                      {typeof message.metadata?.stickerLabel === 'string' && (
                        <span className="text-xs text-white/55">
                          {message.metadata.stickerLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Voice message visualization */}
                  {(message.messageType === 'voice' || message.messageType === 'audio') &&
                    message.metadata?.url && (
                      <AdvancedVoiceVisualizer
                        audioUrl={message.metadata.url}
                        variant="spectrum"
                        theme="matrix-green"
                        height={80}
                        width={250}
                        className="my-2"
                      />
                    )}

                  {hasFileAttachment &&
                    (isLockedNodesFile(message) && !isOwn ? (
                      <div className="mt-2">
                        <MessageMediaContent
                          message={message}
                          isOwn={isOwn}
                          voiceVisualizerTheme="matrix-green"
                        />
                      </div>
                    ) : (
                      <FileMessage message={message} isOwnMessage={isOwn} className="mt-2" />
                    ))}
                </>
              )}

              {/* Timestamp and status */}
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}
              >
                <motion.span {...FADE_IN} transition={{ delay: 0.2 }}>
                  {formatMessageTime(message.createdAt)}
                </motion.span>
                {message.isEdited && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    (edited)
                  </motion.span>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Reactions */}
          <AnimatePresence>
            {optimisticReactions.length > 0 && (
              <motion.div
                className="mt-2 flex flex-wrap gap-1.5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                {Object.entries(
                  optimisticReactions.reduce<
                    Record<string, { count: number; hasReacted: boolean }>
                  >((acc, r) => {
                    const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                    entry.count++;
                    if (user && r.userId === user.id) entry.hasReacted = true;
                    return acc;
                  }, {})
                ).map(([emoji, { count, hasReacted }]) => (
                  <AnimatedReactionBubble
                    key={emoji}
                    reaction={{
                      emoji,
                      count,
                      hasReacted,
                    }}
                    isOwnMessage={isOwn}
                    onPress={() => handleAddReaction(emoji)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div className="mt-2">
                <ReactionPicker
                  onSelect={handleAddReaction}
                  onClose={() => setShowReactionPicker(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {readers.length > 0 && <ReadReceipts readBy={readers} />}
        </div>
      </motion.div>
    </AnimatedMessageWrapper>
  );
}
