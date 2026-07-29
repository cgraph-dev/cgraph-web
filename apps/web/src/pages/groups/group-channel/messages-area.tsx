/**
 * MessagesArea Component
 *
 * Displays the list of messages grouped by date.
 */

import { HashtagIcon } from '@heroicons/react/24/outline';
import { NewMessagesBar } from '@/modules/chat/components/new-messages-bar';
import { ChannelMessageItem } from './channel-message-item';
import type { MessagesAreaProps } from './types';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';

/** Messages for the active channel, grouped by date. */
export function MessagesArea({
  groupedMessages,
  hasMoreMessages,
  isLoadingMessages,
  channelName,
  typing,
  messagesEndRef,
  messagesScrollRef,
  newMessagesBelow,
  onScroll,
  onJumpToLatest,
  onLoadMore,
  onReply,
  onOpenThread,
  onReport,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onCopyMessageLink,
  onReaction,
  onToggleReaction,
  currentUserId,
  canManageMessages,
  highlightedMessageId,
  threadReplyCounts,
  formatDateHeader,
}: MessagesAreaProps) {
  const hasMessages = groupedMessages.some((g) => g.messages.length > 0);

  return (
    <div
      ref={messagesScrollRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      aria-label={`Messages in #${channelName}`}
    >
      {newMessagesBelow > 0 && (
        <NewMessagesBar
          count={newMessagesBelow}
          onJump={onJumpToLatest}
          className="bg-[var(--token-bg-primary)]/80 rounded-full backdrop-blur-md"
        />
      )}

      {/* Welcome message */}
      {!hasMessages && !isLoadingMessages && (
        <EmptyState
          icon={<HashtagIcon className="h-7 w-7" />}
          title={`Welcome to #${channelName}`}
          message={`This is the start of the #${channelName} channel.`}
        />
      )}

      {/* Load more */}
      {hasMoreMessages && (
        <div className="text-center">
          <Button
            size="sm"
            variant="ghost"
            animated={false}
            onClick={onLoadMore}
            disabled={isLoadingMessages}
          >
            {isLoadingMessages ? 'Loading...' : 'Load more messages'}
          </Button>
        </div>
      )}

      {/* Grouped messages */}
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date header */}
          <div className="my-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--product-line)]" />
            <span className="text-xs font-medium text-[var(--token-text-muted)]">
              {formatDateHeader(group.date)}
            </span>
            <div className="h-px flex-1 bg-[var(--product-line)]" />
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {group.messages.map((message, msgIndex) => {
              const showHeader =
                msgIndex === 0 || group.messages[msgIndex - 1]?.authorId !== message.authorId;

              return (
                <ChannelMessageItem
                  key={message.id}
                  message={message}
                  showHeader={showHeader}
                  isHighlighted={message.id === highlightedMessageId}
                  onReply={() => onReply(message)}
                  onOpenThread={() => onOpenThread(message)}
                  onReport={onReport ? () => onReport(message) : undefined}
                  onEditMessage={
                    onEditMessage ? (content) => onEditMessage(message, content) : undefined
                  }
                  onDeleteMessage={onDeleteMessage ? () => onDeleteMessage(message) : undefined}
                  onPinMessage={onPinMessage ? () => onPinMessage(message) : undefined}
                  onCopyLink={onCopyMessageLink ? () => onCopyMessageLink(message) : undefined}
                  onReaction={(emoji) => onReaction(message.id, emoji)}
                  onToggleReaction={(emoji, hasReacted) =>
                    onToggleReaction(message.id, emoji, hasReacted)
                  }
                  currentUserId={currentUserId}
                  canManageMessages={canManageMessages}
                  threadReplyCount={threadReplyCounts[message.id]}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {typing.length > 0 && (
        <div className="flex items-center gap-2 px-4">
          <div className="flex space-x-1">
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[var(--token-text-muted)]"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[var(--token-text-muted)]"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[var(--token-text-muted)]"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-sm text-[var(--token-text-muted)]">
            {typing.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
