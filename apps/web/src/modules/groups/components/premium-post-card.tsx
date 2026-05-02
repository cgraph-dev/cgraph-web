import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CurrencyDollarIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { purchasePremiumPost } from '@/modules/groups/services/premium-post-api';
import type { PremiumPost } from '@/modules/groups/types/premium-post';

const logger = createLogger('PremiumPostCard');

interface PremiumPostCardProps {
  readonly post: PremiumPost;
  readonly onPurchaseSuccess: (post: PremiumPost) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function truncateContent(content: string, length: number): string {
  if (content.length <= length) {
    return content;
  }
  return content.slice(0, length) + '...';
}

export function PremiumPostCard({
  post,
  onPurchaseSuccess,
}: PremiumPostCardProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnlocked = post.purchased || post.isAuthor;

  async function handleUnlock(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const unlocked = await purchasePremiumPost(post.id);
      onPurchaseSuccess(unlocked);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.toLowerCase().includes('insufficient')
          ? 'Insufficient Nodes. Earn or purchase more to unlock.'
          : err instanceof Error
            ? err.message
            : 'Failed to unlock post. Please try again.';
      setError(message);
      logger.error('Failed to purchase premium post:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800"
    >
      <div className="flex items-center justify-between gap-3 border-b border-dark-700 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName ?? post.author.username}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="h-8 w-8 shrink-0 text-gray-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {post.author.displayName ?? post.author.username}
            </p>
            <p className="text-xs text-gray-500">{formatDate(post.insertedAt)}</p>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">
          <CurrencyDollarIcon className="h-3.5 w-3.5" />
          {post.priceNodes} Nodes
        </span>
      </div>

      <div className="px-4 pt-3">
        <h3 className="text-base font-semibold text-white">{post.title}</h3>
      </div>

      <div className="relative px-4 pb-4 pt-2">
        {isUnlocked ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {post.content}
          </p>
        ) : (
          <div className="relative">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {truncateContent(post.content, post.previewLength)}
            </p>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                background:
                  'linear-gradient(transparent, rgb(var(--color-dark-800, 31 31 35) / 0.85), rgb(var(--color-dark-800, 31 31 35) / 1))',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-dark-700 px-4 py-3">
        <span className="text-xs text-gray-500">
          {post.purchaseCount} {post.purchaseCount === 1 ? 'unlock' : 'unlocks'}
        </span>

        {isUnlocked ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400">
            <LockOpenIcon className="h-3.5 w-3.5" />
            {post.isAuthor ? 'Your post' : 'Unlocked'}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void handleUnlock()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            <LockClosedIcon className="h-3.5 w-3.5" />
            {isLoading ? 'Unlocking...' : `Unlock for ${post.priceNodes} Nodes`}
          </button>
        )}
      </div>

      {error && (
        <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </motion.div>
  );
}
