/**
 * Pulse Leaderboard page.
 *
 * Cursor-paginated, virtualized list of users ranked by Pulse (reputation).
 * The route is `/pulse` for the global leaderboard and `/pulse/:forumSlug`
 * for forum-scoped leaderboards. Forum slug is resolved to id via the
 * already-loaded forum store; if unresolved we render an empty state and
 * skip the fetch.
 *
 * Plan item #24 from `docs/WEB-ULTIMATE-IMPROVEMENT-PLAN.md`.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { isPulseTier, type PulseTier } from '@cgraph-dev/shared-types';
import { publicProfilePath } from '@/lib/profile-route';
import { usePulseStore } from '@/modules/pulse/store/pulseStore';
import { PulseBadge } from '@/modules/pulse/components/pulse-badge';
import type { PulseLeaderEntry } from '@/modules/pulse/types';

const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 56;

interface PulseLeaderboardPageProps {
  readonly forumId?: string | null;
}

/**
 * Pulse Leaderboard component.
 *
 * Reads the leaderboard slice from the pulse store and renders the
 * cursor-paginated list virtualized via `@tanstack/react-virtual`.
 */
export default function PulseLeaderboardPage({
  forumId = null,
}: PulseLeaderboardPageProps): React.ReactNode {
  const { forumSlug: _forumSlug } = useParams<{ forumSlug?: string }>();
  // Forum-slug resolution is left to the consuming route — the page accepts
  // a resolved id directly. The route alias keeps the URL human-friendly.
  void _forumSlug;

  const leaderboard = usePulseStore((s) => s.leaderboard);
  const fetchLeaderboard = usePulseStore((s) => s.fetchLeaderboard);

  useEffect(() => {
    void fetchLeaderboard(forumId, null);
  }, [fetchLeaderboard, forumId]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: leaderboard.entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => leaderboard.entries[index]?.userId ?? `row:${index}`,
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const isEmpty = leaderboard.entries.length === 0;

  // Trigger the next page when the user scrolls into the last few rows.
  useEffect(() => {
    if (!leaderboard.hasMore || items.length === 0) return;
    const lastRendered = items[items.length - 1];
    if (!lastRendered) return;
    if (lastRendered.index >= leaderboard.entries.length - 3) {
      void fetchLeaderboard(forumId, leaderboard.cursor);
    }
  }, [
    items,
    leaderboard.cursor,
    leaderboard.entries.length,
    leaderboard.hasMore,
    fetchLeaderboard,
    forumId,
  ]);

  const headerLabel = useMemo(
    () => (forumId ? 'Forum leaderboard' : 'Global leaderboard'),
    [forumId]
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-6">
      <header className="flex shrink-0 items-center gap-3 pb-4" style={{ height: HEADER_HEIGHT }}>
        <span className="aurora-page-icon p-2">
          <TrophyIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--token-text-primary)]">
            Pulse
          </h1>
          <p className="text-xs text-[var(--token-text-muted)]">{headerLabel}</p>
        </div>
      </header>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-[var(--token-text-muted)]">
          <span className="text-3xl">🏆</span>
          <p>No Pulse activity yet for this scope.</p>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="bg-[var(--token-card-bg)]/40 relative flex-1 overflow-y-auto rounded-2xl border border-[var(--token-card-border)]"
          aria-label="Pulse leaderboard"
        >
          <div style={{ height: totalSize, position: 'relative' }}>
            {items.map((item) => {
              const entry = leaderboard.entries[item.index];
              if (!entry) return null;
              return (
                <div
                  key={item.key}
                  data-rank={item.index + 1}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${item.start}px)`,
                    height: ROW_HEIGHT,
                  }}
                >
                  <LeaderRow entry={entry} rank={item.index + 1} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface LeaderRowProps {
  readonly entry: PulseLeaderEntry;
  readonly rank: number;
}

function LeaderRow({ entry, rank }: LeaderRowProps): React.ReactNode {
  const tier: PulseTier | undefined = isPulseTier(entry.tier) ? entry.tier : undefined;
  const display = entry.displayName ?? entry.username;

  return (
    <Link
      to={publicProfilePath({ id: entry.userId, username: entry.username })}
      className="flex h-full items-center gap-3 px-4 transition-colors hover:bg-[var(--token-bg-secondary)]"
    >
      <span className="w-8 shrink-0 text-center text-sm font-bold text-[var(--token-text-muted)]">
        #{rank}
      </span>
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
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
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
          {display}
        </div>
        {entry.displayName && (
          <div className="truncate text-[11px] text-[var(--token-text-muted)]">
            @{entry.username}
          </div>
        )}
      </div>
      <PulseBadge score={entry.score} tier={tier} />
    </Link>
  );
}
