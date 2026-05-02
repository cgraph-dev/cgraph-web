/**
 * Bounty list page — shows all bounties for a forum with status filter tabs.
 *
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bountyService } from '@/modules/forums/services/bounty-service';
import type { Bounty } from '@/modules/forums/services/bounty-service';

const STATUS_TABS = ['all', 'open', 'voting', 'completed'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

interface BountyListPageProps {
  readonly className?: string;
}

/** Bounty List Page. */
export default function BountyListPage({ className }: BountyListPageProps) {
  const { forumSlug: forumId } = useParams<{ forumSlug: string }>();
  const navigate = useNavigate();

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBounties(reset = false) {
    if (!forumId) return;
    setLoading(true);
    setError(null);

    const status = activeTab === 'all' ? undefined : activeTab;
    const cursorParam = reset ? undefined : (cursor ?? undefined);

    try {
      const result = await bountyService.listBounties(forumId, { status, cursor: cursorParam });
      setBounties((prev) => (reset ? result.bounties : [...prev, ...result.bounties]));
      setCursor(result.meta.cursor);
      setHasMore(result.meta.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bounties');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setBounties([]);
    setCursor(null);

    async function loadInitial() {
      if (!forumId) return;
      setLoading(true);
      setError(null);

      const status = activeTab === 'all' ? undefined : activeTab;
      try {
        const result = await bountyService.listBounties(forumId, { status });
        setBounties(result.bounties);
        setCursor(result.meta.cursor);
        setHasMore(result.meta.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bounties');
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [forumId, activeTab]);

  function handleTabChange(tab: StatusTab) {
    setActiveTab(tab);
  }

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bounties</h1>
        <button
          type="button"
          onClick={() => navigate(`/forums/${forumId}/bounties/create`)}
          className="hover:bg-primary/90 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create Bounty
        </button>
      </div>

      {/* Status Tabs */}
      <div className="border-border flex gap-2 border-b pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bounty Cards */}
      <div className="space-y-4">
        {bounties.map((bounty) => (
          <BountyCard
            key={bounty.id}
            bounty={bounty}
            onClick={() => navigate(`/forums/${forumId}/bounties/${bounty.id}`)}
          />
        ))}
      </div>

      {loading && <p className="text-muted-foreground text-center">Loading...</p>}

      {error && !loading && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
          <button
            type="button"
            onClick={() => fetchBounties(true)}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bounties.length === 0 && (
        <p className="text-muted-foreground text-center">No bounties found.</p>
      )}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => fetchBounties()}
          className="border-border hover:bg-muted mx-auto block rounded-lg border px-6 py-2 text-sm"
        >
          Load More
        </button>
      )}
    </div>
  );
}
interface BountyCardProps {
  readonly bounty: Bounty;
  readonly onClick: () => void;
}

function BountyCard({ bounty, onClick }: BountyCardProps) {
  const statusColor: Record<string, string> = {
    open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    voting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:bg-muted w-full rounded-lg border p-4 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{bounty.title}</h3>
          {bounty.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{bounty.description}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[bounty.status] ?? ''}`}
        >
          {bounty.status}
        </span>
      </div>
      <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
        <span>Prize: {bounty.prizeNodes} Nodes</span>
        {bounty.entryFeeNodes > 0 && <span>Entry fee: {bounty.entryFeeNodes} Nodes</span>}
        <span>Deadline: {new Date(bounty.votingEndsAt).toLocaleDateString()}</span>
        {bounty.entryCount !== null && <span>{bounty.entryCount} entries</span>}
      </div>
    </button>
  );
}
