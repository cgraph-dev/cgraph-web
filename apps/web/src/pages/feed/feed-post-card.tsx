/**
 * Feed Post Card — Individual post card for the discovery feed
 *
 * Displays thread title, preview, author, community badge, metrics,
 * and content gating indicator.
 *
 */

import { Link } from 'react-router-dom';
import { ChatBubbleLeftIcon, EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PulseReactions } from '@/modules/pulse/components/pulse-reactions';
import type { FeedThread } from '@/modules/discovery/hooks/useFeed';

interface FeedPostCardProps {
  thread: FeedThread;
  className?: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Description. */
/** Feed Post Card component. */
export function FeedPostCard({ thread, className }: FeedPostCardProps) {
  return (
    <Link
      to={`/forums/threads/${thread.id}`}
      className={cn(
        'group relative block rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] p-5 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_8px_32px_rgba(0,0,0,0.4),rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all hover:border-[var(--token-card-border)] hover:bg-[var(--token-bg-primary)] hover:-translate-y-0.5',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Header: author + community + time */}
      <div className="relative z-10 mb-3 flex items-center gap-2 text-xs text-white/40">
        {thread.author && (
          <span className="font-semibold text-white/60">{thread.author.username}</span>
        )}
        {thread.board && (
          <>
            <span>in</span>
            <span className="rounded bg-[var(--token-card-bg)] px-1.5 py-0.5 font-semibold text-white/50 border border-[var(--token-border-muted)]">
              {thread.board.name}
            </span>
          </>
        )}
        <span className="ml-auto font-medium">{formatRelativeTime(thread.created_at)}</span>
      </div>

      {/* Title */}
      <div className="relative z-10 mb-2 flex items-start gap-3">
        <h3 className="line-clamp-2 flex-1 text-[15px] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
          {thread.title}
        </h3>
        {thread.is_content_gated && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-sm">
            <LockClosedIcon className="h-3 w-3" />
            {thread.gate_price_nodes != null ? `${thread.gate_price_nodes} Nodes` : 'Gated'}
          </span>
        )}
      </div>

      {/* Preview text */}
      {thread.content_preview && (
        <p className="relative z-10 mb-4 line-clamp-2 text-[13px] leading-relaxed text-white/50">
          {thread.content_preview}
        </p>
      )}

      {/* Bottom bar: metrics + reactions */}
      <div className="relative z-10 flex items-center gap-4 text-xs font-medium text-white/30">
        <span className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
          <ChatBubbleLeftIcon className="h-4 w-4" />
          {formatCount(thread.reply_count)}
        </span>
        <span className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
          <EyeIcon className="h-4 w-4" />
          {formatCount(thread.view_count)}
        </span>
        {thread.score > 0 && (
          <span className="flex items-center gap-1 rounded border border-primary-500/20 bg-primary-500/10 px-1.5 py-0.5 font-semibold text-primary-300 backdrop-blur-sm">
            ↑ {formatCount(thread.score)}
          </span>
        )}
        {thread.author && thread.board && (
          <div
            className="ml-auto"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
            }}
            role="group"
          >
            <PulseReactions
              contentId={thread.id}
              contentType="thread"
              authorId={thread.author.id}
              forumId={thread.board.forum_id}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default FeedPostCard;
