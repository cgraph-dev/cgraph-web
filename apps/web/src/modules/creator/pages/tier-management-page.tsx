import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useCreatorStore, type CreatorTier } from '../store/creatorStore';

function formatPrice(tier: CreatorTier): string {
  const cents = tier.priceCents ?? tier.price_cents;
  if (typeof cents === 'number') return `$${(cents / 100).toFixed(2)}/mo`;

  const nodes = tier.priceMonthlyNodes ?? tier.price_monthly_nodes;
  if (typeof nodes === 'number') return `${nodes.toLocaleString()} Nodes/mo`;

  return 'No price set';
}

function tierSubscriberCount(tier: CreatorTier): number {
  return tier.subscriber_count ?? 0;
}

function tierLimit(tier: CreatorTier): number | null {
  return tier.maxSubscribers ?? tier.max_subscribers ?? null;
}

function tierPerks(tier: CreatorTier): readonly string[] {
  if (Array.isArray(tier.perks)) return tier.perks;
  if (tier.benefits && typeof tier.benefits === 'object') {
    return Object.entries(tier.benefits)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }
  return [];
}

/** Creator subscription tier management route. */
function TierManagementPage() {
  const tiers = useCreatorStore((state) => state.tiers);
  const fetchTiers = useCreatorStore((state) => state.fetchTiers);
  const createTier = useCreatorStore((state) => state.createTier);
  const updateTier = useCreatorStore((state) => state.updateTier);
  const deleteTier = useCreatorStore((state) => state.deleteTier);

  const [forumId, setForumId] = useState('');
  const [name, setName] = useState('');
  const [priceNodes, setPriceNodes] = useState(100);
  const [maxSubscribers, setMaxSubscribers] = useState('');
  const [perkText, setPerkText] = useState('');
  const [editingNameById, setEditingNameById] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchTiers();
  }, [fetchTiers]);

  const sortedTiers = useMemo(
    () =>
      [...tiers].sort((a, b) => {
        const orderA = a.sort_order ?? 0;
        const orderB = b.sort_order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      }),
    [tiers]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!forumId.trim() || !name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const benefits = Object.fromEntries(
        perkText
          .split(',')
          .map((perk) => perk.trim())
          .filter(Boolean)
          .map((perk) => [perk, true])
      );

      const created = await createTier({
        forumId: forumId.trim(),
        name: name.trim(),
        priceMonthlyNodes: Math.max(1, priceNodes),
        benefits,
        maxSubscribers: maxSubscribers ? Number(maxSubscribers) : undefined,
      });

      if (!created) throw new Error('Tier was not created');
      setName('');
      setPriceNodes(100);
      setMaxSubscribers('');
      setPerkText('');
      await fetchTiers();
    } catch {
      setError('Tier could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRename(tier: CreatorTier) {
    const nextName = editingNameById[tier.id]?.trim();
    if (!nextName || nextName === tier.name) return;

    setError(null);
    const updated = await updateTier(tier.id, { name: nextName });
    if (!updated) {
      setError('Tier name could not be updated.');
      return;
    }
    await fetchTiers();
  }

  async function handleDelete(tierId: string) {
    setError(null);
    const deleted = await deleteTier(tierId);
    if (!deleted) {
      setError('Tier could not be deleted.');
      return;
    }
    await fetchTiers();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creator Tiers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage paid access tiers and subscriber limits from the live creator contract.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchTiers()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[var(--token-card-border)] dark:text-gray-200 dark:hover:bg-white/5"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
        <div className="mb-4 flex items-center gap-2">
          <PlusIcon className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create tier</h2>
        </div>
        <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1fr_10rem_10rem_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Forum ID</span>
            <input
              value={forumId}
              onChange={(event) => setForumId(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
              placeholder="Forum UUID"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
              placeholder="Supporter"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Nodes / month</span>
            <input
              type="number"
              min={1}
              value={priceNodes}
              onChange={(event) => setPriceNodes(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Max subs</span>
            <input
              type="number"
              min={1}
              value={maxSubscribers}
              onChange={(event) => setMaxSubscribers(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
              placeholder="Optional"
            />
          </label>
          <button
            type="submit"
            disabled={isSaving || !forumId.trim() || !name.trim()}
            className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Create'}
          </button>
          <label className="lg:col-span-5">
            <span className="mb-1 block text-xs font-medium text-gray-500">Perks</span>
            <input
              value={perkText}
              onChange={(event) => setPerkText(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
              placeholder="Comma-separated perks"
            />
          </label>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Creator tier list">
        {sortedTiers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-[var(--token-card-border)] dark:text-gray-400 md:col-span-2 xl:col-span-3">
            No creator tiers are configured yet.
          </div>
        ) : (
          sortedTiers.map((tier) => (
            <article
              key={tier.id}
              className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <input
                    value={editingNameById[tier.id] ?? tier.name}
                    onChange={(event) =>
                      setEditingNameById((current) => ({
                        ...current,
                        [tier.id]: event.target.value,
                      }))
                    }
                    onBlur={() => void handleRename(tier)}
                    className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-lg font-semibold text-gray-900 outline-none focus:border-blue-500 focus:px-2 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(tier)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(tier.id)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label={`Delete ${tier.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UsersIcon className="h-4 w-4" />
                <span>
                  {tierSubscriberCount(tier).toLocaleString()} subscribers
                  {(() => {
                    const limit = tierLimit(tier);
                    return limit ? ` / ${limit.toLocaleString()}` : '';
                  })()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {tierPerks(tier).length > 0 ? (
                  tierPerks(tier).map((perk) => (
                    <span
                      key={perk}
                      className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300"
                    >
                      {perk}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No perks listed.</span>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default TierManagementPage;
