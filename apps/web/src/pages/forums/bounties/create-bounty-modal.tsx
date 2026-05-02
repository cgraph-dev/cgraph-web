/**
 * Create bounty modal — form for title, description, prize, entry fee, deadline.
 *
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bountyService } from '@/modules/forums/services/bounty-service';

const MIN_PRIZE = 10;
const MAX_ENTRIES_DEFAULT = 50;

/** Create Bounty Modal. */
export default function CreateBountyModal() {
  const { forumSlug: forumId } = useParams<{ forumSlug: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeNodes, setPrizeNodes] = useState(MIN_PRIZE);
  const [entryFeeNodes, setEntryFeeNodes] = useState(0);
  const [maxEntries, setMaxEntries] = useState(MAX_ENTRIES_DEFAULT);
  const [votingEndsAt, setVotingEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forumId || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await bountyService.createBounty(forumId, {
        title: title.trim(),
        description: description.trim() || undefined,
        prize_nodes: prizeNodes,
        entry_fee_nodes: entryFeeNodes > 0 ? entryFeeNodes : undefined,
        voting_ends_at: new Date(votingEndsAt).toISOString(),
        max_entries: maxEntries,
      });
      navigate(`/forums/${forumId}/bounties`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create bounty';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = title.trim().length > 0 && prizeNodes >= MIN_PRIZE && votingEndsAt;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Create Bounty</h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bounty-title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="bounty-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="What are you looking for?"
            className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="bounty-desc" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="bounty-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Describe the bounty requirements..."
            className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bounty-prize" className="block text-sm font-medium">
              Prize (Nodes)
            </label>
            <input
              id="bounty-prize"
              type="number"
              min={MIN_PRIZE}
              value={prizeNodes}
              onChange={(e) => setPrizeNodes(Number(e.target.value))}
              className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Min {MIN_PRIZE}. Escrowed on creation.
            </p>
          </div>

          <div>
            <label htmlFor="bounty-fee" className="block text-sm font-medium">
              Entry Fee (Nodes)
            </label>
            <input
              id="bounty-fee"
              type="number"
              min={0}
              value={entryFeeNodes}
              onChange={(e) => setEntryFeeNodes(Number(e.target.value))}
              className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-muted-foreground mt-1 text-xs">Optional. 0 = free to enter.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bounty-deadline" className="block text-sm font-medium">
              Voting Deadline
            </label>
            <input
              id="bounty-deadline"
              type="datetime-local"
              value={votingEndsAt}
              onChange={(e) => setVotingEndsAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="bounty-max" className="block text-sm font-medium">
              Max Entries
            </label>
            <input
              id="bounty-max"
              type="number"
              min={1}
              max={500}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Number(e.target.value))}
              className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Bounty'}
          </button>
        </div>
      </form>
    </div>
  );
}
