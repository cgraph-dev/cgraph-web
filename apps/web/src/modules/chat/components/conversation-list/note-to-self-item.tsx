/**
 * NoteToSelfItem — pinned conversation list entry for Note to Self.
 *
 * Always appears at the top of the conversation list (Signal pattern).
 * Uses a bookmark icon instead of an avatar.
 */

import { motion } from 'motion/react';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import { tweens } from '@/lib/animation-presets';
import type { Conversation } from '@/modules/chat/store/chatStore.impl';

interface NoteToSelfItemProps {
  /** The Note to Self conversation object. */
  conversation: Conversation;
  /** Handler when the item is clicked. */
  onClick: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: tweens.fast },
};

/**
 * Renders the Note to Self entry at the top of the conversation list.
 * Displays bookmark icon, "Note to Self" title, and last message preview.
 */
export function NoteToSelfItem({ conversation, onClick }: NoteToSelfItemProps): React.ReactNode {
  const lastMessagePreview = conversation.lastMessage?.content ?? 'Write yourself a note...';
  const hasMessages = conversation.lastMessage !== null;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
        hasMessages ? 'opacity-100' : 'opacity-60'
      }`}
      aria-label="Note to Self"
    >
      {/* Bookmark icon as avatar */}
      <div className="bg-primary-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
        <BookmarkIcon className="h-5 w-5 text-primary-400" />
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Note to Self</span>
          {conversation.lastMessage?.createdAt && (
            <span className="text-xs text-gray-500">
              {formatRelativeTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-400">{lastMessagePreview}</p>
      </div>
    </motion.button>
  );
}

/** Format a timestamp to relative time (e.g., "2m ago", "1h ago"). */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(timestamp).toLocaleDateString();
}
