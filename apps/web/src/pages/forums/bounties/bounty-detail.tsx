import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bountyService } from '@/modules/forums/services/bounty-service';
import type { Bounty, BountyEntry } from '@/modules/forums/services/bounty-service';
import { useAuthStore } from '@/stores';

function toError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Bounty Detail Page. */
export default function BountyDetailPage() {
  const { forumSlug: forumId, bountyId } = useParams<{
    forumSlug: string;
    bountyId: string;
  }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [entries, setEntries] = useState<BountyEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  useEffect(() => {
    if (!forumId || !bountyId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const b = await bountyService.getBounty(forumId!, bountyId!);
        setBounty(b);

        const res = await bountyService.listEntries(forumId!, bountyId!);
        setEntries(res.entries);
        setCursor(res.meta.cursor);
        setHasMore(res.meta.hasMore);
      } catch (err) {
        setError(toError(err, 'Failed to load bounty'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [forumId, bountyId]);

  async function loadMore() {
    if (!forumId || !bountyId || !cursor) return;
    try {
      const res = await bountyService.listEntries(forumId, bountyId, { cursor });
      setEntries((prev) => [...prev, ...res.entries]);
      setCursor(res.meta.cursor);
      setHasMore(res.meta.hasMore);
    } catch (err) {
      setError(toError(err, 'Failed to load more entries'));
    }
  }

  async function withAction<T>(fn: () => Promise<T>, fallback: string): Promise<T | undefined> {
    if (!forumId || !bountyId || isActing) return;
    setIsActing(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(toError(err, fallback));
      return undefined;
    } finally {
      setIsActing(false);
    }
  }

  async function handleVote(entryId: string) {
    await withAction(async () => {
      const updated = await bountyService.voteEntry(forumId!, bountyId!, entryId);
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }, 'Failed to vote');
  }

  async function handleClose() {
    await withAction(async () => {
      const updated = await bountyService.closeBounty(forumId!, bountyId!);
      setBounty(updated);
    }, 'Failed to close bounty');
  }

  async function handleCancel() {
    await withAction(async () => {
      const updated = await bountyService.cancelBounty(forumId!, bountyId!);
      setBounty(updated);
    }, 'Failed to cancel bounty');
  }

  async function handleSubmitEntry(content: string) {
    await withAction(async () => {
      const entry = await bountyService.submitEntry(forumId!, bountyId!, { content });
      setEntries((prev) => [entry, ...prev]);
      setShowEntryModal(false);
    }, 'Failed to submit entry');
  }

  if (loading) return <p className="text-muted-foreground text-center">Loading...</p>;
  if (!bounty && error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={() => navigate(`/forums/${forumId}/bounties`)}
          className="text-muted-foreground mt-2 text-sm hover:underline"
        >
          &larr; Back to bounties
        </button>
      </div>
    );
  }
  if (!bounty) return <p className="text-muted-foreground text-center">Bounty not found.</p>;

  const isCreator = currentUser?.id === bounty.creatorId;
  const canEnter = bounty.status === 'open' && !isCreator;
  const canClose = isCreator && bounty.status in { open: true, voting: true };
  const canCancel = isCreator && bounty.status in { open: true, voting: true };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(`/forums/${forumId}/bounties`)}
        className="text-muted-foreground text-sm hover:underline"
      >
        &larr; Back to bounties
      </button>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="border-border rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{bounty.title}</h1>
            <p className="text-muted-foreground mt-2">{bounty.description}</p>
          </div>
          <StatusBadge status={bounty.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Prize: </span>
            <span className="font-semibold">{bounty.prizeNodes} Nodes</span>
          </div>
          {bounty.entryFeeNodes > 0 && (
            <div>
              <span className="text-muted-foreground">Entry fee: </span>
              <span className="font-semibold">{bounty.entryFeeNodes} Nodes</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Deadline: </span>
            <span>{new Date(bounty.votingEndsAt).toLocaleString()}</span>
          </div>
        </div>

        {isCreator && (
          <div className="mt-4 flex gap-3">
            {canClose && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isActing}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isActing ? 'Closing...' : 'Close Voting'}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isActing}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isActing ? 'Cancelling...' : 'Cancel Bounty'}
              </button>
            )}
          </div>
        )}
      </div>

      {bounty.status === 'completed' && bounty.winnerId && (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Winner selected! Prize of {bounty.prizeNodes} Nodes distributed.
          </p>
        </div>
      )}

      {canEnter && (
        <button
          type="button"
          onClick={() => setShowEntryModal(true)}
          disabled={isActing}
          className="hover:bg-primary/90 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Submit Entry
          {bounty.entryFeeNodes > 0 && ` (${bounty.entryFeeNodes} Nodes)`}
        </button>
      )}

      {showEntryModal && (
        <SubmitEntryModal onSubmit={handleSubmitEntry} onClose={() => setShowEntryModal(false)} />
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Entries {entries.length > 0 && `(${entries.length})`}
        </h2>
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            isWinner={entry.userId === bounty.winnerId}
            canVote={
              bounty.status in { open: true, voting: true } && entry.userId !== currentUser?.id
            }
            onVote={() => handleVote(entry.id)}
          />
        ))}
        {entries.length === 0 && !loading && (
          <p className="text-muted-foreground">No entries yet. Be the first!</p>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            className="border-border hover:bg-muted mx-auto block rounded-lg border px-6 py-2 text-sm"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
interface StatusBadgeProps {
  readonly status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    voting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${colors[status] ?? ''}`}
    >
      {status}
    </span>
  );
}

interface EntryCardProps {
  readonly entry: BountyEntry;
  readonly isWinner: boolean;
  readonly canVote: boolean;
  readonly onVote: () => void;
}

function EntryCard({ entry, isWinner, canVote, onVote }: EntryCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isWinner ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-border'
      }`}
    >
      {isWinner && <p className="mb-2 text-xs font-bold uppercase text-yellow-600">Winner</p>}
      <p className="whitespace-pre-wrap text-sm">{entry.content}</p>
      <div className="mt-3 flex items-center gap-4">
        <span className="text-sm font-medium">{entry.score} votes</span>
        {canVote && (
          <button
            type="button"
            onClick={onVote}
            className="bg-primary/10 hover:bg-primary/20 rounded-md px-3 py-1 text-xs font-medium text-primary"
          >
            Vote
          </button>
        )}
        <span className="text-muted-foreground text-xs">
          {new Date(entry.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

interface SubmitEntryModalProps {
  readonly onSubmit: (content: string) => void;
  readonly onClose: () => void;
}

function SubmitEntryModal({ onSubmit, onClose }: SubmitEntryModalProps) {
  const [content, setContent] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-lg rounded-lg p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Submit Entry</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your submission..."
            rows={6}
            maxLength={10000}
            className="border-border bg-background w-full rounded-md border p-3 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
