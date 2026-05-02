/**
 * Following page — `/me/following`.
 *
 * Lists the users the current user follows, paginated via cursor. Each
 * row has an Unfollow button for quick management. Modelled on the Pulse
 * leaderboard virtualizer pattern (Signal-style fixed row height).
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { UserMinusIcon } from '@heroicons/react/24/outline';
import { useFollowStore, type FollowUser } from '@/modules/social/store/followStore';
import { useAuthStore } from '@/modules/auth/store';
import Button from '@/components/ui/button';
import { logger } from '@/lib/logger';

const ROW_HEIGHT = 72;

/**
 * Following page — virtualized cursor-paginated list of users the current
 * user follows, with an inline unfollow control on each row.
 */
export default function FollowingPage(): React.ReactNode {
  const userId = useAuthStore((s) => s.user?.id);
  const list = useFollowStore((s) => (userId ? s.followingByUser[userId] : undefined));
  const fetchFollowing = useFollowStore((s) => s.fetchFollowing);
  const unfollow = useFollowStore((s) => s.unfollow);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void fetchFollowing(userId, null).catch((err: unknown) => {
      logger.error('Failed to load following', err);
    });
  }, [userId, fetchFollowing]);

  const parentRef = useRef<HTMLDivElement>(null);
  const users = list?.users ?? [];
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => users[index]?.id ?? `row:${index}`,
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Auto-paginate when scrolling within 3 rows of the tail.
  useEffect(() => {
    if (!userId || !list || !list.hasMore || items.length === 0) return;
    const last = items[items.length - 1];
    if (!last) return;
    if (last.index >= users.length - 3) {
      void fetchFollowing(userId, list.cursor).catch((err: unknown) => {
        logger.error('Failed to load next following page', err);
      });
    }
  }, [items, list, users.length, userId, fetchFollowing]);

  async function handleUnfollow(targetId: string): Promise<void> {
    if (busyId) return;
    setBusyId(targetId);
    try {
      await unfollow(targetId);
    } catch (err) {
      logger.error('Unfollow failed', err);
    } finally {
      setBusyId(null);
    }
  }

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--token-text-muted)]">
        Sign in to see who you follow.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-6">
      <header className="flex shrink-0 items-center gap-3 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--token-text-primary)]">
            Following
          </h1>
          <p className="text-xs text-[var(--token-text-muted)]">People you follow</p>
        </div>
      </header>

      {users.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-[var(--token-text-muted)]">
          <span className="text-3xl">👋</span>
          <p>You aren&apos;t following anyone yet.</p>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="bg-[var(--token-card-bg)]/40 relative flex-1 overflow-y-auto rounded-2xl border border-[var(--token-card-border)]"
          aria-label="Following list"
        >
          <div style={{ height: totalSize, position: 'relative' }}>
            {items.map((item) => {
              const user = users[item.index];
              if (!user) return null;
              return (
                <div
                  key={item.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${item.start}px)`,
                    height: ROW_HEIGHT,
                  }}
                >
                  <FollowingRow
                    user={user}
                    busy={busyId === user.id}
                    onUnfollow={() => {
                      void handleUnfollow(user.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FollowingRowProps {
  readonly user: FollowUser;
  readonly busy: boolean;
  readonly onUnfollow: () => void;
}

function FollowingRow({ user, busy, onUnfollow }: FollowingRowProps): React.ReactNode {
  const display = user.displayName ?? user.username;
  return (
    <div className="flex h-full items-center gap-3 px-4 hover:bg-[var(--token-bg-secondary)]">
      <Link to={`/user/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--token-bg-tertiary)] text-sm font-bold text-[var(--token-text-muted)]"
          >
            {display.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
            {display}
          </div>
          <div className="truncate text-[11px] text-[var(--token-text-muted)]">
            @{user.username}
          </div>
        </div>
      </Link>
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        leftIcon={<UserMinusIcon className="h-4 w-4" />}
        onClick={onUnfollow}
        aria-label={`Unfollow ${display}`}
      >
        Unfollow
      </Button>
    </div>
  );
}
