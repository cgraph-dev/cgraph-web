/**
 * ChannelMessageItem Component
 *
 * Displays a single message in the channel with avatar,
 * content, reactions, and action menu.
 */

import React, { useState, lazy, Suspense, type ReactNode } from 'react';
import {
  FaceSmileIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { DisplayName } from '@/shared/components/ui';
import type { ChannelMessageItemProps } from './types';
import type { Role } from '@/modules/groups/store';
import { formatMessageTime, getAvatarInitial, getDisplayName } from './utils';

const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({ default: m.EmojiPicker }))
);

export function ChannelMessageItem({
  message,
  showHeader,
  onReply,
  onOpenThread,
  onReport,
  onReaction,
  onToggleReaction,
  currentUserId,
  threadReplyCount,
}: ChannelMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const displayName = getDisplayName(message.author.username, message.author.displayName);
  const initial = getAvatarInitial(message.author.username, message.author.displayName);

  function handleReactionSelect(emoji: string): void {
    onReaction(emoji);
    setShowReactionPicker(false);
  }

  return (
    <div
      className={`group relative flex gap-4 px-4 py-0.5 hover:bg-[var(--token-bg-secondary)/0.3] ${
        showHeader ? 'mt-4' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar or spacer */}
      <div className="w-10 flex-shrink-0">
        {showHeader && (
          <div className="h-10 w-10 overflow-hidden rounded-full bg-white/[0.08]">
            {message.author.avatarUrl ? (
              <img
                src={message.author.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
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
                '#ffffff'
              }
              secondaryColor={message.author.displayNameSecondaryColor ?? undefined}
              className="cursor-pointer hover:underline"
            />
            <RoleBadge role={getTopRole(message.author.member?.roles)} />
            <span className="text-xs text-gray-500">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            <ReplyIcon />
            <span className="text-primary-400">
              {getDisplayName(message.replyTo.author.username, message.replyTo.author.displayName)}
            </span>
            <span className="max-w-xs truncate">{message.replyTo.content}</span>
          </div>
        )}

        <ChannelMarkdown content={message.content} />

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onToggleReaction(reaction.emoji, reaction.hasReacted)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors ${
                  reaction.hasReacted
                    ? 'border-primary-500/50 bg-primary-600/30 border'
                    : 'bg-[var(--token-card-bg)/0.6] hover:bg-[var(--token-card-bg)/0.8]'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className={reaction.hasReacted ? 'text-primary-300' : 'text-gray-400'}>
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Thread reply count badge */}
        {threadReplyCount != null && threadReplyCount > 0 && (
          <button
            onClick={onOpenThread}
            className="hover:bg-primary-500/10 mt-1 flex items-center gap-1.5 rounded px-2 py-1 text-xs text-primary-400 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
            <span>
              {threadReplyCount} {threadReplyCount === 1 ? 'reply' : 'replies'}
            </span>
          </button>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute -top-4 right-4 flex items-center gap-0.5 rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.6] shadow-lg">
          <button
            onClick={() => setShowReactionPicker((prev) => !prev)}
            className={`p-1.5 hover:bg-[var(--token-card-bg)/0.8] ${
              showReactionPicker ? 'text-primary-400' : 'text-gray-400 hover:text-white'
            }`}
            title="React"
          >
            <FaceSmileIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onReply}
            className="p-1.5 text-gray-400 hover:bg-[var(--token-card-bg)/0.8] hover:text-white"
            title="Reply"
          >
            <ReplyIcon />
          </button>
          <button
            onClick={onOpenThread}
            className="p-1.5 text-gray-400 hover:bg-[var(--token-card-bg)/0.8] hover:text-white"
            title="Reply in Thread"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          {onReport && currentUserId && message.authorId !== currentUserId && (
            <button
              onClick={onReport}
              className="p-1.5 text-gray-400 hover:bg-[var(--token-card-bg)/0.8] hover:text-red-400"
              title="Report"
            >
              <FlagIcon className="h-4 w-4" />
            </button>
          )}
          <button
            className="p-1.5 text-gray-400 hover:bg-[var(--token-card-bg)/0.8] hover:text-white"
            title="More"
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
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
    </div>
  );
}

/**
 * Returns the highest non-default role from the roles array, or null if none.
 */
function getTopRole(roles: Role[] | null | undefined): Role | null {
  if (!roles || roles.length === 0) return null;
  const nonDefault = roles.filter((r) => !r.isDefault);
  if (nonDefault.length === 0) return null;
  // Roles are sorted highest-position-first by the backend
  return nonDefault[0] ?? null;
}

/**
 * Small colored role badge pill shown next to the username.
 * Returns null when role is null (no non-default role).
 */
function RoleBadge({ role }: { readonly role: Role | null }): React.ReactElement | null {
  if (!role) return null;
  return (
    <span
      style={{
        background: `${role.color}20`,
        color: role.color,
        borderRadius: '4px',
        padding: '1px 6px',
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
    >
      {role.name}
    </span>
  );
}

function ReplyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Lightweight markdown renderer for channel messages.
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

/**
 * ChannelMarkdown renders a message string with chat formatting.
 */
function ChannelMarkdown({ content }: { readonly content: string }): ReactNode {
  const blocks = splitCodeBlocks(content);

  return (
    <div className="whitespace-pre-wrap break-words text-gray-100">
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          return (
            <pre
              key={blockIdx}
              className="my-1 overflow-x-auto rounded-lg bg-[var(--token-card-bg)] p-3 font-mono text-sm text-emerald-300"
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
                className="my-0.5 border-l-2 border-indigo-400/60 pl-2.5 italic text-gray-300"
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
