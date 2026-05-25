/**
 * Converstion message list with virtualization.
 */
import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'motion/react';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import { getMessageSenderId } from '@/lib/api-utils';
import { formatDateHeader, groupMessagesByDate } from '@/lib/chat/messageUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';
import { GlassCard } from '@/shared/components/ui';
import { springs } from '@/lib/animation-presets';
import { AnimatedMessageWrapper } from './animated-message-wrapper';
import { AnimatedReactionBubble } from './animated-reaction-bubble';
import { TypingIndicator } from './typing-indicator';
import { MessageBubble, type UIPreferences } from './message-bubble';
import { MediaAlbum } from './media-album';
import type { MediaAlbumItem } from '@cgraph/shared-types';
/** Album group: consecutive messages sharing the same albumId. */
interface AlbumGroup {
  readonly type: 'album';
  readonly albumId: string;
  readonly messages: Message[];
}

/** Type guard to distinguish AlbumGroup from Message. */
function isAlbumGroup(entry: Message | AlbumGroup): entry is AlbumGroup {
  return 'type' in entry && 'albumId' in entry && 'messages' in entry;
}

/**
 * Group consecutive messages with the same albumId into AlbumGroup entries.
 * Single messages with an albumId (orphaned) render individually.
 * Messages without albumId pass through unchanged.
 */
function groupByAlbum(messages: ReadonlyArray<Message>): ReadonlyArray<Message | AlbumGroup> {
  const result: Array<Message | AlbumGroup> = [];
  let currentAlbum: Message[] = [];
  let currentAlbumId: string | null = null;

  for (const msg of messages) {
    if (msg.albumId && msg.albumId === currentAlbumId) {
      currentAlbum.push(msg);
    } else {
      if (currentAlbum.length > 1 && currentAlbumId !== null) {
        result.push({ type: 'album', albumId: currentAlbumId, messages: currentAlbum });
      } else if (currentAlbum.length === 1 && currentAlbum[0] !== undefined) {
        result.push(currentAlbum[0]);
      }
      if (msg.albumId) {
        currentAlbumId = msg.albumId;
        currentAlbum = [msg];
      } else {
        currentAlbumId = null;
        currentAlbum = [];
        result.push(msg);
      }
    }
  }
  // Flush remaining album
  if (currentAlbum.length > 1 && currentAlbumId !== null) {
    result.push({ type: 'album', albumId: currentAlbumId, messages: currentAlbum });
  } else if (currentAlbum.length === 1 && currentAlbum[0] !== undefined) {
    result.push(currentAlbum[0]);
  }

  return result;
}

/**
 * Convert album group messages to MediaAlbumItem array for the MediaAlbum component.
 */
function toAlbumItems(messages: ReadonlyArray<Message>): ReadonlyArray<MediaAlbumItem> {
  return messages.map((msg) => ({
    id: msg.id,
    albumId: msg.albumId ?? '',
    fileUrl: msg.metadata?.url ?? '',
    fileName: msg.metadata?.filename ?? '',
    fileSize: msg.metadata?.size ?? 0,
    fileMimeType: msg.metadata?.mimeType ?? '',
    thumbnailUrl: msg.metadata?.thumbnailUrl,
    contentType: msg.messageType === 'video' ? 'video' : 'image',
  }));
}

// Types
interface MessageGroup {
  date: Date;
  messages: Message[];
}

interface MessageListProps {
  messages: Message[];
  userId: string | undefined;
  uiPreferences: UIPreferences;
  typing: string[];
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onForward: (message: Message) => void;
  activeMessageMenu: string | null;
  onToggleMenu: (messageId: string) => void;
  editingMessageId: string | null;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** unknown.  Scroll container ref for virtualizer. If omitted, a wrapper div is created. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Message id requested by route search/pinned navigation. */
  scrollToMessageId?: string | null;
  /** Changes when the route wants to repeat a scroll to the same message id. */
  scrollToMessageRequestKey?: string | number | null;
  onScrollToMessageComplete?: (messageId: string) => void;
}

// Flat row type for virtualizer
type VirtualRow =
  | { type: 'date-header'; date: Date; key: string }
  | { type: 'message'; message: Message; groupMessages: Message[]; msgIndex: number; key: string }
  | { type: 'album'; album: AlbumGroup; key: string };
// MessageList Component
/**
 * Message List component.
 */
export function MessageList({
  messages,
  userId,
  uiPreferences,
  typing,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
  activeMessageMenu,
  onToggleMenu,
  editingMessageId,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  messagesEndRef,
  scrollContainerRef,
  scrollToMessageId,
  scrollToMessageRequestKey,
  onScrollToMessageComplete,
}: MessageListProps) {
  const navigate = useNavigate();
  const fallbackRef = useRef<HTMLDivElement>(null);
  const containerRef = scrollContainerRef ?? fallbackRef;
  const lastScrollRequestRef = useRef<string | null>(null);

  // Group messages by date
  const groupedMessages = useMemo<MessageGroup[]>(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Flatten groups into virtualizable rows (with album grouping applied)
  const flatRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];
    for (const group of groupedMessages) {
      rows.push({ type: 'date-header', date: group.date, key: `dh-${group.date.toISOString()}` });
      // Group consecutive messages with same albumId into album rows
      const albumGrouped = groupByAlbum(group.messages);
      let msgIndex = 0;
      for (const entry of albumGrouped) {
        if (isAlbumGroup(entry)) {
          rows.push({
            type: 'album',
            album: entry,
            key: `album-${entry.albumId}`,
          });
          msgIndex += entry.messages.length;
        } else {
          rows.push({
            type: 'message',
            message: entry,
            groupMessages: group.messages,
            msgIndex,
            key: `msg-${entry.id}`,
          });
          msgIndex += 1;
        }
      }
    }
    return rows;
  }, [groupedMessages]);

  // Virtualizer — only renders visible rows + overscan buffer
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (flatRows[index]?.type === 'date-header' ? 56 : 80),
    overscan: 10,
    getItemKey: (index) => flatRows[index]?.key ?? String(index),
  });

  const scrollTargetIndex = useMemo(() => {
    if (!scrollToMessageId) return -1;

    return flatRows.findIndex((row) => {
      if (row.type === 'message') return row.message.id === scrollToMessageId;
      if (row.type === 'album') {
        return row.album.messages.some((message) => message.id === scrollToMessageId);
      }
      return false;
    });
  }, [flatRows, scrollToMessageId]);

  useEffect(() => {
    if (!scrollToMessageId || scrollTargetIndex < 0) {
      if (!scrollToMessageId) lastScrollRequestRef.current = null;
      return undefined;
    }

    const requestKey = `${scrollToMessageId}:${scrollTargetIndex}:${scrollToMessageRequestKey ?? 'route'}`;
    if (lastScrollRequestRef.current === requestKey) {
      return undefined;
    }
    lastScrollRequestRef.current = requestKey;

    const align = scrollTargetIndex >= flatRows.length - 1 ? 'end' : 'center';
    virtualizer.scrollToIndex(scrollTargetIndex, { align });

    let frame = 0;
    let attempts = 0;
    let cancelled = false;

    const scrollDomTarget = () => {
      if (cancelled) return;

      const target = document.getElementById(`message-${scrollToMessageId}`);
      const container = containerRef.current;
      if (!target || !container) {
        if (attempts < 8) {
          attempts += 1;
          frame = window.requestAnimationFrame(scrollDomTarget);
        }
        return;
      }

      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetTop = targetRect.top - containerRect.top + container.scrollTop;
      const nextTop =
        align === 'end'
          ? targetTop - container.clientHeight + targetRect.height + 24
          : targetTop - container.clientHeight / 2 + targetRect.height / 2;

      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior: 'smooth',
      });
      onScrollToMessageComplete?.(scrollToMessageId);
    };

    frame = window.requestAnimationFrame(scrollDomTarget);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    containerRef,
    flatRows.length,
    onScrollToMessageComplete,
    scrollTargetIndex,
    scrollToMessageId,
    scrollToMessageRequestKey,
    virtualizer,
  ]);

  const renderRow = (row: VirtualRow) => {
    if (row.type === 'album') {
      const firstMsg = row.album.messages[0];
      const albumSenderId = firstMsg?.senderId ?? '';
      const currentUserId = userId || '';
      const isOwn =
        albumSenderId.length > 0 && currentUserId.length > 0 && albumSenderId === currentUserId;
      const albumItems = toAlbumItems(row.album.messages);

      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-2`}>
          <MediaAlbum
            items={albumItems}
            onItemClick={(item) => window.open(item.fileUrl, '_blank')}
          />
        </div>
      );
    }

    if (row.type === 'date-header') {
      return (
        <motion.div
          className="my-6 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.gentle}
        >
          <GlassCard
            variant={uiPreferences.glassEffect}
            intensity="subtle"
            glow={uiPreferences.enableGlow}
            className="rounded-full px-4 py-2"
          >
            <span className="text-xs font-medium tracking-wide text-white">
              {formatDateHeader(row.date)}
            </span>
          </GlassCard>
        </motion.div>
      );
    }

    const { message, groupMessages, msgIndex } = row;
    const messageSenderId = getMessageSenderId(message) || '';
    const currentUserId = userId || '';

    const isOwn =
      messageSenderId.length > 0 && currentUserId.length > 0 && messageSenderId === currentUserId;

    const prevMessage = groupMessages[msgIndex - 1];
    const prevSenderId = prevMessage ? getMessageSenderId(prevMessage) || '' : '';
    const showAvatar = !isOwn && (msgIndex === 0 || prevSenderId !== messageSenderId);

    return (
      <AnimatedMessageWrapper
        isOwnMessage={isOwn}
        index={msgIndex}
        messageId={message.id}
        isEditing={editingMessageId === message.id}
        onSwipeReply={() => onReply(message)}
        enableGestures={true}
      >
        <MessageBubble
          message={message}
          isOwn={isOwn}
          showAvatar={showAvatar}
          onReply={() => onReply(message)}
          uiPreferences={uiPreferences}
          onAvatarClick={(avatarUserId) => navigate(`/user/${avatarUserId}`)}
          onEdit={() => onEdit(message)}
          onDelete={() => onDelete(message.id)}
          onPin={() => onPin(message.id)}
          onForward={() => onForward(message)}
          isMenuOpen={activeMessageMenu === message.id}
          onToggleMenu={() => onToggleMenu(message.id)}
          isEditing={editingMessageId === message.id}
          editContent={editContent}
          onEditContentChange={onEditContentChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(
              message.reactions.reduce<Record<string, { count: number; hasReacted: boolean }>>(
                (acc, r) => {
                  const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                  entry.count++;
                  if (userId && r.userId === userId) entry.hasReacted = true;
                  return acc;
                },
                {}
              )
            ).map(([emoji, { count, hasReacted }]) => (
              <AnimatedReactionBubble
                key={emoji}
                reaction={{ emoji, count, hasReacted }}
                isOwnMessage={isOwn}
                onPress={() => handleAddReaction(message.id, emoji)}
              />
            ))}
          </div>
        )}
      </AnimatedMessageWrapper>
    );
  };

  return (
    <>
      {/* Virtualized message rows */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = flatRows[virtualRow.index];
          if (!row) return null;
          const hasActiveMenu =
            activeMessageMenu &&
            ((row.type === 'message' && row.message.id === activeMessageMenu) ||
              (row.type === 'album' &&
                row.album.messages.some((message) => message.id === activeMessageMenu)));

          return (
            <div
              key={row.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                zIndex: hasActiveMenu ? 20 : 1,
              }}
            >
              {renderRow(row)}
            </div>
          );
        })}
      </div>

      {/* Enhanced Typing indicator */}
      <AnimatePresence>
        <TypingIndicator
          typing={typing}
          enableGlow={uiPreferences.enableGlow}
          glassEffect="crystal"
        />
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </>
  );
}
