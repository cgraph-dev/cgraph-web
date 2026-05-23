import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowPathIcon,
  GiftIcon,
  NoSymbolIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useCreatorStore, type SubscriberEntry } from '../store/creatorStore';

function formatDate(value?: string | null): string {
  if (!value) return 'Open ended';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Open ended';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function statusClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-300';
    case 'canceled':
    case 'expired':
      return 'bg-gray-500/10 text-gray-300';
    case 'past_due':
      return 'bg-amber-500/10 text-amber-300';
    default:
      return 'bg-blue-500/10 text-blue-300';
  }
}

/** Subscriber management route for creators. */
function SubscriberManager() {
  const subscribers = useCreatorStore((state) => state.subscribers);
  const tiers = useCreatorStore((state) => state.tiers);
  const isLoadingSubscribers = useCreatorStore((state) => state.isLoadingSubscribers);
  const fetchSubscribers = useCreatorStore((state) => state.fetchSubscribers);
  const fetchTiers = useCreatorStore((state) => state.fetchTiers);
  const giftSubscription = useCreatorStore((state) => state.giftSubscription);
  const revokeSubscription = useCreatorStore((state) => state.revokeSubscription);

  const [statusFilter, setStatusFilter] = useState('active');
  const [tierFilter, setTierFilter] = useState('');
  const [giftUserId, setGiftUserId] = useState('');
  const [giftTierId, setGiftTierId] = useState('');
  const [giftDurationDays, setGiftDurationDays] = useState(30);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchTiers();
  }, [fetchTiers]);

  useEffect(() => {
    void fetchSubscribers({
      status: statusFilter || undefined,
      tier_id: tierFilter || undefined,
    });
  }, [fetchSubscribers, statusFilter, tierFilter]);

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.status === 'active').length,
    [subscribers]
  );

  async function handleGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!giftUserId.trim() || !giftTierId) return;

    const gifted = await giftSubscription({
      user_id: giftUserId.trim(),
      tier_id: giftTierId,
      duration_days: Math.max(1, giftDurationDays),
    });

    if (!gifted) {
      setMessage('Gift subscription could not be created.');
      return;
    }

    setGiftUserId('');
    setGiftDurationDays(30);
    setMessage('Gift subscription created.');
    await fetchSubscribers({ status: statusFilter || undefined, tier_id: tierFilter || undefined });
  }

  async function handleRevoke(subscriber: SubscriberEntry) {
    setMessage(null);
    const revoked = await revokeSubscription(subscriber.id);
    if (!revoked) {
      setMessage('Subscription could not be revoked.');
      return;
    }
    setMessage(`Revoked subscription for ${subscriber.user.username}.`);
    await fetchSubscribers({ status: statusFilter || undefined, tier_id: tierFilter || undefined });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscribers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review active subscriptions, gift access, and revoke access when needed.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            void fetchSubscribers({
              status: statusFilter || undefined,
              tier_id: tierFilter || undefined,
            })
          }
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[var(--token-card-border)] dark:text-gray-200 dark:hover:bg-white/5"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoadingSubscribers ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {message && (
        <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {message}
        </div>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active subscribers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
        </div>
        <label className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
          <span className="mb-2 block text-sm text-gray-500 dark:text-gray-400">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
          <span className="mb-2 block text-sm text-gray-500 dark:text-gray-400">Tier</span>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
          >
            <option value="">All tiers</option>
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
        <div className="mb-4 flex items-center gap-2">
          <GiftIcon className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Gift subscription
          </h2>
        </div>
        <form onSubmit={handleGift} className="grid gap-3 md:grid-cols-[1fr_1fr_9rem_auto]">
          <input
            value={giftUserId}
            onChange={(event) => setGiftUserId(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
            placeholder="User ID"
            required
          />
          <select
            value={giftTierId}
            onChange={(event) => setGiftTierId(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
            required
          >
            <option value="">Choose tier</option>
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={giftDurationDays}
            onChange={(event) => setGiftDurationDays(Number(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)] dark:text-white"
            aria-label="Gift duration days"
          />
          <button
            type="submit"
            disabled={!giftUserId.trim() || !giftTierId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gift
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-[var(--token-card-border)]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Subscriber list
          </h2>
        </div>

        {isLoadingSubscribers && subscribers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading subscribers...
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No subscribers match this filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[var(--token-card-border)]">
            {subscribers.map((subscriber) => (
              <article
                key={subscriber.id}
                className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_10rem_12rem_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {subscriber.user.avatar_url ? (
                    <img
                      src={subscriber.user.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {subscriber.user.username}
                    </p>
                    <p className="truncate text-xs text-gray-500">{subscriber.user.id}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tier</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {subscriber.tier.name ?? 'Default'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Renews</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(subscriber.current_period_end)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      subscriber.status
                    )}`}
                  >
                    {subscriber.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRevoke(subscriber)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    <NoSymbolIcon className="h-4 w-4" />
                    Revoke
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default SubscriberManager;
