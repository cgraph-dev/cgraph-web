/**
 * ChannelMessageItem Component
 *
 * Displays a single message in the channel with avatar,
 * content, reactions, and action menu.
 */

import React, { useState, lazy, Suspense, type ReactNode } from 'react';
import {
  ArrowUturnLeftIcon,
  BookmarkIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  LinkIcon,
  PaperClipIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { VoiceMessagePlayer } from '@/components/media/voice-message-player';
import { DisplayName } from '@/shared/components/ui';
import { getNameplateBubbleStyle } from '@/lib/cosmetics/nameplate-bubble';
import { cn } from '@/lib/utils';
import type { ChannelMessageItemProps } from './types';
import type { Role } from '@/modules/groups/store';
import { formatMessageTime, getAvatarInitial, getDisplayName, getTopRole } from './utils';
import { Button, IconButton } from '@/components/ui/button';

const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({ default: m.EmojiPicker }))
);

/** A channel message with its available actions and rich content. */
export function ChannelMessageItem({
  message,
  showHeader,
  isHighlighted = false,
  onReply,
  onOpenThread,
  onReport,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onCopyLink,
  onReaction,
  onToggleReaction,
  currentUserId,
  canManageMessages = false,
  threadReplyCount,
}: ChannelMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [isActionPending, setIsActionPending] = useState(false);

  const displayName = getDisplayName(message.author.username, message.author.displayName);
  const initial = getAvatarInitial(message.author.username, message.author.displayName);
  const isOwnMessage = currentUserId === message.authorId;
  const canEdit = Boolean(onEditMessage && isOwnMessage && message.messageType === 'text');
  const canDelete = Boolean(onDeleteMessage && (isOwnMessage || canManageMessages));
  const canPin = Boolean(onPinMessage && canManageMessages && !message.isPinned);
  const hasMoreActions = canEdit || canDelete || canPin || Boolean(onCopyLink || onReport);
  const nameplateBubble = getNameplateBubbleStyle(message.author.equippedNameplateId, {
    isOwn: isOwnMessage,
    surface: 'group',
  });

  function handleReactionSelect(emoji: string): void {
    onReaction(emoji);
    setShowReactionPicker(false);
  }

  async function runMessageAction(action: () => Promise<void> | void): Promise<void> {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      await action();
      setShowMoreMenu(false);
    } finally {
      setIsActionPending(false);
    }
  }

  async function handleSaveEdit(): Promise<void> {
    const nextContent = editDraft.trim();
    if (!nextContent || nextContent === message.content) {
      setIsEditing(false);
      setEditDraft(message.content);
      return;
    }
    await runMessageAction(async () => {
      await onEditMessage?.(nextContent);
      setIsEditing(false);
    });
  }

  function handleCancelEdit(): void {
    setIsEditing(false);
    setEditDraft(message.content);
  }

  return (
    <article
      id={`group-message-${message.id}`}
      aria-label={`Message from ${displayName}`}
      tabIndex={0}
      className="cgraph-message-row group relative flex scroll-mt-24 gap-4 px-4 py-0.5"
      data-header={showHeader || undefined}
      data-highlighted={isHighlighted || undefined}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
        setShowMoreMenu(false);
      }}
      onFocusCapture={() => setShowActions(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setShowActions(false);
          setShowReactionPicker(false);
          setShowMoreMenu(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setShowReactionPicker(false);
          setShowMoreMenu(false);
        }
      }}
    >
      {/* Avatar or spacer */}
      <div className="w-10 flex-shrink-0">
        {showHeader && (
          <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--product-surface-recessed)]">
            {message.author.avatarUrl ? (
              <img
                src={message.author.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--token-text-muted)]">
                {initial}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <DisplayName
              name={displayName}
              font={message.author.displayNameFont ?? 'default'}
              effect={message.author.displayNameEffect ?? 'solid'}
              color={
                message.author.displayNameColor ??
                message.author.member?.roles?.[0]?.color ??
                'var(--token-text-primary)'
              }
              secondaryColor={message.author.displayNameSecondaryColor ?? undefined}
              className="cursor-pointer hover:underline"
            />
            <RoleBadge role={getTopRole(message.author.member?.roles)} />
            <span className="text-xs text-[var(--token-text-muted)]">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 flex items-center gap-1 text-xs text-[var(--token-text-muted)]">
            <ArrowUturnLeftIcon className="h-4 w-4" />
            <span className="text-[var(--token-interactive-primary)]">
              {getDisplayName(message.replyTo.author.username, message.replyTo.author.displayName)}
            </span>
            <span className="max-w-xs truncate">{message.replyTo.content}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  handleCancelEdit();
                }
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void handleSaveEdit();
                }
              }}
              className="cgraph-field min-h-20 w-full resize-y px-3 py-2 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                animated={false}
                leftIcon={<CheckIcon />}
                onClick={() => void handleSaveEdit()}
                disabled={isActionPending || !editDraft.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                animated={false}
                leftIcon={<XMarkIcon />}
                onClick={handleCancelEdit}
                disabled={isActionPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              nameplateBubble &&
                'mt-0.5 w-fit max-w-full rounded-[var(--product-radius-lg)] px-3 py-2 text-sm leading-relaxed',
              nameplateBubble?.className
            )}
            style={nameplateBubble?.style}
            data-nameplate-bubble-id={nameplateBubble?.entry.id}
          >
            <ChannelMessageContent message={message} />
            {message.isEdited && (
              <span className="ml-1 text-[11px] text-[var(--token-text-muted)]">(edited)</span>
            )}
            {message.isPinned && (
              <span className="ml-2 text-[11px] text-[var(--token-interactive-primary)]">
                Pinned
              </span>
            )}
            {message.messageType !== 'voice' && message.messageType !== 'audio' && (
              <MessageAttachment message={message} />
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <Button
                key={reaction.emoji}
                variant="ghost"
                size="sm"
                animated={false}
                aria-pressed={reaction.hasReacted}
                aria-label={`${reaction.hasReacted ? 'Remove' : 'Add'} ${reaction.emoji} reaction (${reaction.count})`}
                onClick={() => onToggleReaction(reaction.emoji, reaction.hasReacted)}
                className="cgraph-reaction min-h-8 gap-1 px-2 py-0.5 text-xs"
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Thread reply count badge */}
        {threadReplyCount != null && threadReplyCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            animated={false}
            leftIcon={<ChatBubbleLeftRightIcon />}
            onClick={onOpenThread}
            className="mt-1 min-h-8 px-2 py-1 text-xs text-[var(--token-interactive-primary)]"
          >
            <span>
              {threadReplyCount} {threadReplyCount === 1 ? 'reply' : 'replies'}
            </span>
          </Button>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className="cgraph-message-toolbar absolute -top-5 right-4 z-10 flex items-center gap-0.5 p-0.5"
          role="toolbar"
          aria-label="Message shortcuts"
        >
          <IconButton
            icon={<FaceSmileIcon />}
            label="React"
            size="sm"
            variant={showReactionPicker ? 'secondary' : 'ghost'}
            onClick={() => setShowReactionPicker((prev) => !prev)}
            aria-pressed={showReactionPicker}
          />
          <IconButton
            icon={<ArrowUturnLeftIcon />}
            label="Reply"
            size="sm"
            onClick={onReply}
          />
          <IconButton
            icon={<ChatBubbleLeftRightIcon />}
            label="Reply in thread"
            size="sm"
            onClick={onOpenThread}
          />
          {hasMoreActions && (
            <div className="relative">
              <IconButton
                icon={<EllipsisVerticalIcon />}
                label="More message actions"
                size="sm"
                variant={showMoreMenu ? 'secondary' : 'ghost'}
                onClick={() => {
                  setShowMoreMenu((prev) => !prev);
                  setShowReactionPicker(false);
                }}
                disabled={isActionPending}
                aria-haspopup="menu"
                aria-expanded={showMoreMenu}
              />

              {showMoreMenu && (
                <div
                  role="menu"
                  aria-label="Message actions"
                  className="cgraph-dialog-content absolute right-0 top-full z-50 mt-1 w-40 p-1"
                >
                  {canEdit && (
                    <MessageMenuItem
                      icon={<PencilSquareIcon />}
                      label="Edit"
                      onClick={() => {
                        setEditDraft(message.content);
                        setIsEditing(true);
                        setShowMoreMenu(false);
                      }}
                    />
                  )}
                  {canPin && (
                    <MessageMenuItem
                      icon={<BookmarkIcon />}
                      label="Pin"
                      onClick={() => void runMessageAction(() => onPinMessage?.())}
                    />
                  )}
                  {onCopyLink && (
                    <MessageMenuItem
                      icon={<LinkIcon />}
                      label="Copy link"
                      onClick={() => void runMessageAction(() => onCopyLink())}
                    />
                  )}
                  {onReport && currentUserId && message.authorId !== currentUserId && (
                    <MessageMenuItem
                      icon={<FlagIcon />}
                      label="Report"
                      onClick={() => void runMessageAction(() => onReport())}
                    />
                  )}
                  {canDelete && (
                    <MessageMenuItem
                      icon={<TrashIcon />}
                      label="Delete"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm('Delete this message?')) {
                          void runMessageAction(() => onDeleteMessage?.());
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reaction emoji picker */}
      <Suspense fallback={null}>
        {showReactionPicker && (
          <EmojiPicker
            isOpen={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onSelect={handleReactionSelect}
          />
        )}
      </Suspense>
    </article>
  );
}

function MessageMenuItem({
  icon,
  label,
  onClick,
  variant = 'ghost',
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: 'ghost' | 'danger';
}) {
  return (
    <Button
      role="menuitem"
      variant={variant}
      size="sm"
      animated={false}
      fullWidth
      leftIcon={icon}
      onClick={onClick}
      className="min-h-9 justify-start border-transparent px-2 shadow-none"
    >
      {label}
    </Button>
  );
}

/**
 * Small colored role badge pill shown next to the username.
 * Returns null when role is null (no non-default role).
 */
function RoleBadge({ role }: { readonly role: Role | null }): React.ReactElement | null {
  if (!role) return null;
  return (
    <span
      className="cgraph-role-badge"
      style={{ backgroundColor: `${role.color}20`, borderColor: `${role.color}52`, color: role.color }}
    >
      {role.name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lightweight Discord-style markdown renderer for channel messages.
// Handles: **bold**, *italic*, ~~strikethrough~~, `inline code`,
//          ```code blocks```, and > blockquotes.
// Intentionally does NOT use react-markdown / remark-gfm — too heavy for
// inline chat bubbles.
// ---------------------------------------------------------------------------

/** Split text on fenced code-block delimiters (``` … ```). */
function splitCodeBlocks(text: string): Array<{ type: 'text' | 'code'; content: string }> {
  const result: Array<{ type: 'text' | 'code'; content: string }> = [];
  const parts = text.split(/```(?:\w*\n?)?/);
  parts.forEach((part, idx) => {
    if (part === '') return;
    result.push({ type: idx % 2 === 1 ? 'code' : 'text', content: part });
  });
  return result.length > 0 ? result : [{ type: 'text', content: text }];
}

/** Regex for inline tokens: **bold**, *italic*, ~~strike~~, `code`. */
const INLINE_MD = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`([^`]+?)`)/g;

/** Render one line of text with inline formatting applied. */
function renderInline(text: string, baseKey: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  INLINE_MD.lastIndex = 0;
  while ((match = INLINE_MD.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${baseKey}-${k++}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${baseKey}-${k++}`}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      nodes.push(
        <del key={`${baseKey}-${k++}`} className="opacity-60">
          {match[4]}
        </del>
      );
    } else if (match[5] !== undefined) {
      nodes.push(
        <code
          key={`${baseKey}-${k++}`}
          className="rounded bg-[var(--token-card-bg)] px-1 py-0.5 font-mono text-sm text-pink-300"
        >
          {match[5]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function metadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function metadataNumberArray(metadata: Record<string, unknown>, key: string): number[] | null {
  const value = metadata[key];
  if (!Array.isArray(value)) return null;
  const numbers = value.filter((item): item is number => typeof item === 'number');
  return numbers.length === value.length ? numbers : null;
}

function ChannelMessageContent({
  message,
}: {
  readonly message: ChannelMessageItemProps['message'];
}) {
  if (message.messageType === 'gif') {
    const gifUrl = metadataString(message.metadata, 'gifUrl') ?? message.content;
    const gifPreviewUrl = metadataString(message.metadata, 'gifPreviewUrl') ?? gifUrl;
    const gifTitle = metadataString(message.metadata, 'gifTitle') ?? 'GIF';
    const gifWidth = metadataNumber(message.metadata, 'gifWidth');
    const gifHeight = metadataNumber(message.metadata, 'gifHeight');
    const aspectRatio = gifWidth && gifHeight ? gifWidth / gifHeight : 4 / 3;

    return (
      <a href={gifUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit">
        <img
          src={gifPreviewUrl}
          alt={gifTitle}
          className="max-h-72 max-w-full rounded-lg object-cover"
          style={{ aspectRatio }}
        />
      </a>
    );
  }

  if (message.messageType === 'sticker') {
    const label = metadataString(message.metadata, 'stickerLabel') ?? message.content;
    const emoji = metadataString(message.metadata, 'stickerEmoji') ?? message.content;

    return (
      <div className="mt-1 inline-flex flex-col items-center gap-1" aria-label={`Sticker ${label}`}>
        <span className="text-5xl leading-none">{emoji}</span>
        {label && <span className="text-xs text-[var(--token-text-muted)]">{label}</span>}
      </div>
    );
  }

  if (message.messageType === 'voice' || message.messageType === 'audio') {
    const audioUrl = message.fileUrl ?? metadataString(message.metadata, 'url');
    if (!audioUrl) {
      return <ChannelMarkdown content={message.content} />;
    }

    return (
      <div className="mt-2 max-w-sm">
        <VoiceMessagePlayer
          messageId={metadataString(message.metadata, 'voiceMessageId') ?? message.id}
          audioUrl={audioUrl}
          duration={metadataNumber(message.metadata, 'duration') ?? 0}
          waveformData={metadataNumberArray(message.metadata, 'waveform') ?? undefined}
          className="cgraph-message-attachment p-2"
        />
      </div>
    );
  }

  return <ChannelMarkdown content={message.content} />;
}

function MessageAttachment({ message }: { readonly message: ChannelMessageItemProps['message'] }) {
  const url = message.fileUrl ?? metadataString(message.metadata, 'url');
  if (!url) return null;

  const fileName =
    message.fileName ?? metadataString(message.metadata, 'filename') ?? 'Attached file';
  const mimeType = message.fileMimeType ?? metadataString(message.metadata, 'mimeType');
  const size = message.fileSize ?? metadataNumber(message.metadata, 'size');
  const displaySize = formatFileSize(size);

  if (message.messageType === 'image' || mimeType?.startsWith('image/')) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="cgraph-message-attachment mt-2 block max-w-sm overflow-hidden"
      >
        <img src={url} alt={fileName} className="max-h-80 w-full object-cover" loading="lazy" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="cgraph-message-attachment mt-2 flex max-w-sm items-center gap-3 px-3 py-2 text-sm text-[var(--token-text-primary)]"
    >
      <PaperClipIcon className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]" />
      <span className="min-w-0 flex-1 truncate">{fileName}</span>
      {displaySize && (
        <span className="shrink-0 text-xs text-[var(--token-text-muted)]">{displaySize}</span>
      )}
    </a>
  );
}

/**
 * ChannelMarkdown renders a message string with Discord-style formatting.
 */
function ChannelMarkdown({ content }: { readonly content: string }): ReactNode {
  const blocks = splitCodeBlocks(content);

  return (
    <div className="whitespace-pre-wrap break-words text-[var(--token-text-primary)]">
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          return (
            <pre
              key={blockIdx}
              className="my-1 overflow-x-auto rounded-[var(--product-radius-md)] bg-[var(--product-surface-recessed)] p-3 font-mono text-sm text-[var(--token-feedback-success)]"
            >
              {block.content.trim()}
            </pre>
          );
        }

        const lines = block.content.split('\n');
        return lines.map((line, lineIdx) => {
          const isQuote = line.startsWith('> ');
          const lineText = isQuote ? line.slice(2) : line;
          const rendered = renderInline(lineText, `${blockIdx}-${lineIdx}`);

          if (isQuote) {
            return (
              <div
                key={`${blockIdx}-${lineIdx}`}
                className="my-0.5 border-l-2 border-[var(--token-interactive-primary)] pl-2.5 italic text-[var(--token-text-secondary)]"
              >
                {rendered}
              </div>
            );
          }

          return (
            <span key={`${blockIdx}-${lineIdx}`}>
              {rendered}
              {lineIdx < lines.length - 1 ? '\n' : ''}
            </span>
          );
        });
      })}
    </div>
  );
}
