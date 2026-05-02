/**
 * FollowButton — non-reciprocal follow toggle.
 *
 * Distinct from `FriendshipActions`: follow is one-way, no approval. We
 * surface follower / following counts inline so the user sees the impact
 * of their click, matching how Twitter/Bluesky/Telegram-channels label
 * the relation.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/button';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useFollowStore } from '@/modules/social/store/followStore';
import { logger } from '@/lib/logger';

interface FollowButtonProps {
  readonly userId: string;
  readonly className?: string;
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * One-tap follow / unfollow toggle bound to the follow store. Renders the
 * follower / following counts inline so the user sees the impact of the
 * click without leaving the profile.
 */
export function FollowButton({ userId, className }: FollowButtonProps): React.ReactNode {
  const isFollowing = useFollowStore((s) => s.following[userId] ?? false);
  const counts = useFollowStore((s) => s.counts[userId]);
  const follow = useFollowStore((s) => s.follow);
  const unfollow = useFollowStore((s) => s.unfollow);
  const fetchCounts = useFollowStore((s) => s.fetchCounts);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchCounts(userId).catch((err: unknown) => {
      logger.error('Failed to fetch follow counts', err);
    });
  }, [userId, fetchCounts]);

  async function handleClick(): Promise<void> {
    if (busy) return;
    setBusy(true);
    HapticFeedback.medium();
    try {
      if (isFollowing) {
        await unfollow(userId);
      } else {
        await follow(userId);
      }
    } catch (err) {
      logger.error('Follow toggle failed', err);
    } finally {
      setBusy(false);
    }
  }

  const followingCount = counts?.following ?? 0;
  const followersCount = counts?.followers ?? 0;
  const label = isFollowing ? 'Following' : 'Follow';

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <motion.div whileTap={{ scale: 0.94 }}>
        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          disabled={busy}
          leftIcon={
            isFollowing ? (
              <UserMinusIcon className="h-4 w-4" />
            ) : (
              <UserPlusIcon className="h-4 w-4" />
            )
          }
          onClick={() => {
            void handleClick();
          }}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
        >
          {label}
        </Button>
      </motion.div>
      <p className="text-[11px] text-[var(--token-text-muted)]" aria-live="polite">
        {numberFormatter.format(followingCount)} following ·{' '}
        {numberFormatter.format(followersCount)} followers
      </p>
    </div>
  );
}

export default FollowButton;
