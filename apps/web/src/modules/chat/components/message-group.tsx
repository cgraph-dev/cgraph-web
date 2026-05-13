/**
 * MessageGroup — Discord cozy-mode grouping of consecutive messages by same author.
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useChatIdentity } from '../hooks/useChatIdentity';

interface MessageGroupProps {
  /** Author info */
  author: {
    id: string;
    name: string;
    avatar?: string | null;
    roleColor?: string;
  };
  /** Timestamp of first message in group */
  timestamp: Date;
  children: ReactNode;
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFullTimestamp(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return `Today at ${formatTime(date)}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${formatTime(date)}`;
  return `${date.toLocaleDateString()} ${formatTime(date)}`;
}

/**
 * MessageGroup — wraps consecutive messages from the same author.
 * First message shows avatar + name + timestamp; subsequent show only content.
 */
export function MessageGroup({ author, timestamp, children, className }: MessageGroupProps) {
  const { title, badges } = useChatIdentity(author.id);
  const visibleBadges = badges.slice(0, 3);

  return (
    <div
      className={cn(
        'group relative flex gap-4 px-4 py-0.5 transition-colors',
        'hover:bg-[var(--token-bg-primary)/0.3]',
        className
      )}
    >
      {/* Avatar column — fixed 40px */}
      <div className="flex w-10 shrink-0 items-start pt-0.5">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/70">
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Header: name + title + badges + timestamp */}
        <div className="flex items-baseline gap-2">
          <span
            className="cursor-pointer text-sm font-semibold leading-snug hover:underline"
            style={{ color: author.roleColor ?? '#ffffff' }}
          >
            {author.name}
          </span>
          {title && (
            <span className="text-xs opacity-70" style={{ color: title.color ?? undefined }}>
              {title.text}
            </span>
          )}
          {visibleBadges.length > 0 && (
            <span className="flex items-center gap-0.5">
              {visibleBadges.map((badge) => (
                <img
                  key={badge.id}
                  src={badge.icon_url}
                  alt={badge.name}
                  title={badge.name}
                  className="inline-block h-4 w-4"
                />
              ))}
            </span>
          )}
          <span className="text-[11px] leading-snug text-white/30">
            {formatFullTimestamp(timestamp)}
          </span>
        </div>

        {/* Messages */}
        {children}
      </div>
    </div>
  );
}

/**
 * Compact continuation message within a group — no avatar, just content.
 */
interface GroupedMessageProps {
  timestamp: Date;
  children: ReactNode;
  className?: string;
}

/** Compact continuation message within a group — no avatar, just content. */
export function GroupedMessage({ timestamp, children, className }: GroupedMessageProps) {
  return (
    <div
      className={cn(
        'group/msg relative flex gap-4 px-4 py-px transition-colors',
        'hover:bg-[var(--token-bg-primary)/0.3]',
        className
      )}
    >
      {/* Timestamp revealed on hover (in avatar column space) */}
      <div className="flex w-10 shrink-0 items-center justify-end">
        <span className="text-[10px] text-white/0 transition-colors group-hover/msg:text-white/30">
          {formatTime(timestamp)}
        </span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default MessageGroup;
