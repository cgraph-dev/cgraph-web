/**
 * PostCard component for displaying individual forum posts
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import ThreadPrefix from '@/modules/forums/components/thread-prefix';
import ThreadRating from '@/modules/forums/components/thread-rating';
import { getVoteScoreClass } from './constants';
import type { PostCardProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

export function PostCard({ post, onVote }: PostCardProps) {
  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={springs.bouncy}
    >
      <div className="group relative overflow-hidden rounded-xl bg-[var(--token-bg-primary)] border border-[var(--token-border-muted)] backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_8px_32px_rgba(0,0,0,0.4),rgba(255,255,255,0.02)_0px_1px_1px_inset]">
        {/* Hover gradient glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-violet-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />

        <div className="relative z-10 flex">
          {/* Vote sidebar - Enhanced */}
          <div className="flex flex-col items-center gap-1 rounded-l-lg bg-[var(--token-bg-primary)] border-r border-[var(--token-border-muted)] p-3 backdrop-blur-md">
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(1);
              }}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-lg p-1.5 transition-colors ${
                post.myVote === 1 ? 'text-primary-300 bg-[var(--token-bg-secondary)] border border-[var(--token-card-border)]' : 'text-white/40 hover:text-primary-300 hover:bg-[var(--token-bg-primary)]'
              }`}
            >
              {post.myVote === 1 ? (
                <ArrowUpIconSolid className="h-5 w-5" />
              ) : (
                <ArrowUpIcon className="h-5 w-5" />
              )}
            </motion.button>
            <motion.span
              key={post.score}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-bold ${getVoteScoreClass(post.myVote)}`}
            >
              {post.score}
            </motion.span>
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(-1);
              }}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-lg p-1.5 transition-colors ${
                post.myVote === -1 ? 'text-red-400 bg-[var(--token-bg-secondary)] border border-[var(--token-card-border)]' : 'text-white/40 hover:text-red-400 hover:bg-[var(--token-bg-primary)]'
              }`}
            >
              {post.myVote === -1 ? (
                <ArrowDownIconSolid className="h-5 w-5" />
              ) : (
                <ArrowDownIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            {/* Meta */}
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              {post.forum ? (
                <Link
                  to={`/forums/${post.forum.slug}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <div className="h-5 w-5 overflow-hidden rounded-full bg-[var(--token-card-bg)]">
                    {post.forum.iconUrl ? (
                      <img src={post.forum.iconUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px]">{post.forum.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-300">c/{post.forum.slug}</span>
                </Link>
              ) : (
                <span className="font-medium text-gray-500">Unknown forum</span>
              )}
              <span>•</span>
              <span>
                Posted by{' '}
                <Link
                  to={post.author.username ? `/u/${post.author.username}` : '#'}
                  className="hover:underline"
                >
                  u/{post.author.username || post.author.displayName || 'unknown'}
                </Link>
              </span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>

            {/* Title */}
            <Link to={post.forum ? `/forums/${post.forum.slug}/post/${post.id}` : '#'}>
              <div className="mb-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {post.isPinned && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-primary-600/80 px-1.5 py-0.5 text-xs">
                      📌 Pinned
                    </span>
                  )}
                  {post.isLocked && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-yellow-600 px-1.5 py-0.5 text-xs">
                      <LockClosedIcon className="h-3 w-3" /> Locked
                    </span>
                  )}
                  {post.isNsfw && (
                    <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-xs">
                      NSFW
                    </span>
                  )}
                  {post.category && (
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-xs"
                      style={{ backgroundColor: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  {post.prefix && <ThreadPrefix prefix={post.prefix} size="sm" />}
                </div>
                <h2 className="text-lg font-medium text-white transition-colors hover:text-primary-300">
                  {post.title}
                </h2>
              </div>
            </Link>

            {/* Preview content */}
            {post.postType === 'text' && post.content && (
              <p className="mb-3 line-clamp-3 text-[13px] leading-relaxed text-white/60">{post.content}</p>
            )}

            {post.postType === 'link' && post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block truncate text-sm text-primary-300 hover:underline"
              >
                {post.linkUrl}
              </a>
            )}

            {post.postType === 'image' && post.mediaUrls?.[0] && (
              <div className="mb-3 max-h-96 overflow-hidden rounded-lg">
                <img src={post.mediaUrls[0]} alt="" className="h-auto max-w-full object-contain" />
              </div>
            )}

            {/* Thread Rating */}
            {(post.rating !== undefined || post.ratingCount !== undefined) && (
              <div className="mb-3">
                <ThreadRating
                  threadId={post.id}
                  rating={post.rating}
                  ratingCount={post.ratingCount}
                  myRating={post.myRating}
                  size="sm"
                  interactive={false}
                />
              </div>
            )}

            {/* Actions - Enhanced */}
            <div className="flex items-center gap-3 text-white/40">
              <motion.div whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={post.forum ? `/forums/${post.forum.slug}/post/${post.id}` : '#'}
                  onClick={() => HapticFeedback.light()}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-transparent hover:bg-[var(--token-bg-secondary)] text-white/40 hover:text-white/80 border border-transparent hover:border-[var(--token-card-border)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all backdrop-blur-sm"
                >
                  <ChatBubbleLeftIcon className="h-[14px] w-[14px]" />
                  <span>{post.commentCount} Comments</span>
                </Link>
              </motion.div>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-transparent hover:bg-[var(--token-bg-secondary)] text-white/40 hover:text-white/80 border border-transparent hover:border-[var(--token-card-border)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all backdrop-blur-sm"
              >
                <ShareIcon className="h-[14px] w-[14px]" />
                <span>Share</span>
              </motion.button>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-transparent hover:bg-[var(--token-bg-secondary)] text-white/40 hover:text-white/80 border border-transparent hover:border-[var(--token-card-border)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all backdrop-blur-sm"
              >
                <BookmarkIcon className="h-[14px] w-[14px]" />
                <span>Save</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
