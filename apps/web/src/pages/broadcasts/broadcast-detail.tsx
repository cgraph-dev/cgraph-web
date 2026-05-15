import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useBroadcastStore, type BroadcastPost } from '@/modules/broadcast/store';

const numberFormat = new Intl.NumberFormat();

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function BroadcastPostItem({ post }: { readonly post: BroadcastPost }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white">{post.content}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/45">
        <span>{formatDate(post.publishedAt || post.insertedAt)}</span>
        <span>{numberFormat.format(post.viewCount)} views</span>
      </div>
    </article>
  );
}

/** Renders the first-class Broadcast feed, subscription state, and owner publisher. */
export default function BroadcastDetail() {
  const { broadcastId } = useParams<{ broadcastId?: string }>();
  const { user } = useAuthStore();
  const {
    broadcasts,
    postsByBroadcast,
    isLoadingPosts,
    error,
    fetchBroadcast,
    fetchPosts,
    subscribe,
    unsubscribe,
    publishPost,
  } = useBroadcastStore();
  const [draft, setDraft] = useState('');
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!broadcastId) return;
    void fetchBroadcast(broadcastId);
    void fetchPosts(broadcastId);
  }, [broadcastId, fetchBroadcast, fetchPosts]);

  const broadcast = broadcastId ? broadcasts[broadcastId] : null;
  const posts = useMemo(
    () => (broadcastId ? (postsByBroadcast[broadcastId]?.posts ?? []) : []),
    [broadcastId, postsByBroadcast]
  );
  const postList = broadcastId ? postsByBroadcast[broadcastId] : null;
  const canPublish = Boolean(user?.id && broadcast?.ownerId === user.id);

  if (!broadcastId) {
    return <Navigate to="/broadcasts" replace />;
  }

  async function handleSubscriptionChange() {
    if (!broadcast || isChangingSubscription) return;
    setIsChangingSubscription(true);
    try {
      if (broadcast.isSubscribed) {
        await unsubscribe(broadcast.id);
      } else {
        await subscribe(broadcast.id);
      }
    } catch {
      // Store error state renders the failure message.
    } finally {
      setIsChangingSubscription(false);
    }
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!broadcast || !draft.trim() || isPublishing) return;
    setIsPublishing(true);
    try {
      const post = await publishPost(broadcast.id, draft.trim());
      if (post) {
        setDraft('');
      }
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-dark-950">
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="min-w-0">
          <Link
            to="/broadcasts"
            className="mb-2 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Broadcasts
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/15 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-primary-200">
              {broadcast?.avatarUrl ? (
                <img
                  src={broadcast.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <MegaphoneIcon className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-white">
                  {broadcast?.name ?? 'Broadcast'}
                </h1>
                {broadcast?.isVerified && <CheckBadgeIcon className="h-5 w-5 text-sky-300" />}
              </div>
              <p className="truncate text-sm text-white/50">
                {broadcast ? `@${broadcast.slug || broadcast.id}` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
        {broadcast && (
          <button
            type="button"
            onClick={handleSubscriptionChange}
            disabled={isChangingSubscription}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              broadcast.isSubscribed
                ? 'border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                : 'bg-primary-500 text-dark-950 hover:bg-primary-400'
            }`}
          >
            {broadcast.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-h-0 space-y-4" aria-label="Broadcast feed">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {broadcast?.description && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/70">
              {broadcast.description}
            </div>
          )}

          {canPublish && (
            <form
              onSubmit={handlePublish}
              className="border-primary-500/20 bg-primary-500/[0.06] rounded-lg border p-4"
              aria-label="Publish broadcast post"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary-200">
                  Publisher
                </span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-28 w-full resize-none rounded-lg border border-white/10 bg-dark-900 px-3 py-2 text-sm text-white outline-none focus:border-primary-400"
                  maxLength={4000}
                  placeholder="Write a broadcast post"
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isPublishing || !draft.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-dark-950 transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          )}

          {isLoadingPosts && posts.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
              Loading posts...
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => <BroadcastPostItem key={post.id} post={post} />)
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
              No posts yet.
            </div>
          )}

          {postList?.hasMore && (
            <button
              type="button"
              onClick={() => void fetchPosts(broadcastId, postList.cursor)}
              disabled={isLoadingPosts}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoadingPosts ? 'animate-spin' : ''}`} />
              Load older posts
            </button>
          )}
        </main>

        {broadcast && (
          <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <UsersIcon className="h-5 w-5 text-primary-300" />
              Audience
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Subscribers</dt>
                <dd className="font-semibold text-white">
                  {numberFormat.format(broadcast.subscriberCount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Status</dt>
                <dd className="font-semibold text-white">
                  {broadcast.isSubscribed ? 'Subscribed' : 'Not subscribed'}
                </dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}
