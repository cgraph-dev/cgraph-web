/**
 * User Search Component
 *
 * Search input with debounced user lookup via Meilisearch,
 * displaying results with avatar, name, and "Add Friend" action.
 *
 */
import { useState } from 'react';
import { useUserSearch, type UserSearchResult } from '../hooks/useUserSearch';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UserSearch');

// Result Row

function UserResultRow({
  user,
  onAddFriend,
  isPending,
}: {
  user: UserSearchResult;
  onAddFriend: (userId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5">
      {/* Avatar */}
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.display_name ?? user.username}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/60">
          {(user.display_name ?? user.username).charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name + username */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user.display_name ?? user.username}
        </p>
        <p className="truncate text-xs text-white/50">@{user.username}</p>
      </div>

      {/* Add Friend button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAddFriend(user.id)}
        className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Add Friend'}
      </button>
    </div>
  );
}

// Loading Skeleton

function SearchSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
          <div className="h-7 w-20 rounded-md bg-white/10" />
        </div>
      ))}
    </div>
  );
}

// Main Component

/**
 * User search panel with debounced input, results list, and friend actions.
 */
export function UserSearch() {
  const [query, setQuery] = useState('');
  const { results, isLoading, error } = useUserSearch(query);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleAddFriend = async (userId: string) => {
    setPendingIds((prev) => new Set(prev).add(userId));
    try {
      // Backend `FriendController.create/2` expects `user_id` as the
      // request body (axios sends the second arg as the body directly,
      // not nested under `body`).
      await http.post('/api/v1/friends', { user_id: userId });
    } catch (err) {
      logger.error('Failed to send friend request:', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-2 pl-9 pr-8 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results area */}
      <div className="mt-2">
        {error && <p className="px-3 py-2 text-xs text-red-400">{error}</p>}

        {isLoading && <SearchSkeleton />}

        {!isLoading && !error && query.length >= 2 && results.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-white/40">No users found</p>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-0.5">
            {results.map((user) => (
              <UserResultRow
                key={user.id}
                user={user}
                onAddFriend={handleAddFriend}
                isPending={pendingIds.has(user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
