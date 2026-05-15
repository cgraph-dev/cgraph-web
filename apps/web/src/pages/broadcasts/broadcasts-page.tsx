import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  MegaphoneIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useBroadcastStore, type Broadcast } from '@/modules/broadcast/store';

const numberFormat = new Intl.NumberFormat();

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function BroadcastRow({ broadcast }: { readonly broadcast: Broadcast }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/broadcasts/${broadcast.id}`)}
      className="hover:border-primary-400/40 hover:bg-primary-500/10 grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="bg-primary-500/15 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg text-primary-200">
        {broadcast.avatarUrl ? (
          <img
            src={broadcast.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <MegaphoneIcon className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{broadcast.name}</span>
          {broadcast.isVerified && <CheckBadgeIcon className="h-4 w-4 text-sky-300" />}
        </div>
        <p className="truncate text-xs text-white/50">@{broadcast.slug || broadcast.id}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-white/60">
        <UsersIcon className="h-4 w-4" />
        <span>{numberFormat.format(broadcast.subscriberCount)}</span>
      </div>
    </button>
  );
}

/** Renders the Broadcast directory and route-owned creation form. */
export default function BroadcastsPage() {
  const navigate = useNavigate();
  const {
    broadcasts,
    directoryIds,
    directoryCursor,
    directoryHasMore,
    isLoading,
    error,
    fetchDirectory,
    createBroadcast,
  } = useBroadcastStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void fetchDirectory(null);
  }, [fetchDirectory]);

  const directory = useMemo(
    () =>
      directoryIds.map((id) => broadcasts[id]).filter((item): item is Broadcast => Boolean(item)),
    [broadcasts, directoryIds]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextSlug = slugify(slug || name);
    if (!nextName || !nextSlug || isCreating) return;

    setIsCreating(true);
    try {
      const created = await createBroadcast({
        name: nextName,
        slug: nextSlug,
        description: description.trim() || null,
      });
      if (created) {
        navigate(`/broadcasts/${created.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(slugify(value));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-dark-950">
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="h-5 w-5 text-primary-300" />
            <h1 className="text-lg font-semibold text-white">Broadcasts</h1>
          </div>
          <p className="mt-1 text-sm text-white/50">One-way public channels</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchDirectory(null)}
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Refresh broadcasts"
          title="Refresh broadcasts"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-h-0 space-y-3" aria-label="Broadcast directory">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {isLoading && directory.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
              Loading broadcasts...
            </div>
          ) : directory.length > 0 ? (
            directory.map((broadcast) => <BroadcastRow key={broadcast.id} broadcast={broadcast} />)
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
              No broadcasts yet.
            </div>
          )}

          {directoryHasMore && (
            <button
              type="button"
              onClick={() => void fetchDirectory(directoryCursor)}
              disabled={isLoading}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Load more
            </button>
          )}
        </section>

        <form
          onSubmit={handleCreate}
          className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-4"
          aria-label="Create broadcast"
        >
          <div className="mb-4 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-primary-300" />
            <h2 className="text-sm font-semibold text-white">Create Broadcast</h2>
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-white/60">Name</span>
            <input
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-dark-900 px-3 py-2 text-sm text-white outline-none focus:border-primary-400"
              maxLength={80}
              required
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-white/60">Slug</span>
            <input
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-dark-900 px-3 py-2 text-sm text-white outline-none focus:border-primary-400"
              maxLength={64}
              required
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-white/60">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full resize-none rounded-lg border border-white/10 bg-dark-900 px-3 py-2 text-sm text-white outline-none focus:border-primary-400"
              maxLength={280}
            />
          </label>
          <button
            type="submit"
            disabled={isCreating || !name.trim() || !slug.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-dark-950 transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create broadcast'}
          </button>
        </form>
      </div>
    </div>
  );
}
