/**
 * People Tab
 *
 * User search and discovery within the Explore page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { useFriendStore } from '@/modules/social/store';
import { useAuthStore } from '@/modules/auth/store';
import { useUserSearch } from '@/modules/social/hooks/useUserSearch';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { publicProfilePath } from '@/lib/profile-route';
import type { Friend, FriendRequest } from '@/modules/social/store';

/** People tab — search and discover users. */
export function PeopleTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { results: users, isLoading, error } = useUserSearch(query);
  const { friends, sentRequests, pendingRequests, sendRequest } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  function handleSearch(value: string) {
    setQuery(value);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Search input */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search people..."
          autoFocus
          className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-3 pl-11 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
      </div>

      {/* Empty state */}
      {query.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <UserIcon className="h-8 w-8 text-white/30" />
          </div>
          <p className="text-sm text-white/40">Search for people to connect with</p>
        </div>
      )}

      {/* Loading */}
      {query.length >= 2 && isLoading && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}

      {query.length >= 2 && !isLoading && error && (
        <div className="py-10 text-center text-sm text-red-300/80">
          Could not search people right now.
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !isLoading && !error && users.length === 0 && (
        <div className="py-10 text-center text-sm text-white/40">No people found for "{query}"</div>
      )}

      {/* Results */}
      {users.length > 0 && (
        <div className="space-y-2">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/20">
            {users.length} {users.length === 1 ? 'person' : 'people'} found
          </p>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isFriend = friends.some((f: Friend) => f.id === user.id);
            const isPending =
              sentRequests.some((r: FriendRequest) => r.user.id === user.id) ||
              pendingRequests.some((r: FriendRequest) => r.user.id === user.id);
            const profilePath = publicProfilePath({ id: user.id, username: user.username });
            const displayName = user.display_name ?? user.username;

            return (
              <div
                key={user.id}
                className="hover:border-primary-500/20 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-3 transition-colors hover:bg-[var(--token-bg-primary)]"
                onClick={() => navigate(profilePath)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(profilePath)}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-600 to-purple-600 text-sm font-bold text-white ring-2 ring-white/10">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="truncate text-xs text-white/40">@{user.username}</p>
                </div>

                {/* Action */}
                {!isSelf && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!isFriend && !isPending) {
                        try {
                          await sendRequest(user.id);
                          HapticFeedback.success();
                        } catch {
                          HapticFeedback.error();
                        }
                      }
                    }}
                    disabled={isFriend || isPending}
                    className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                      isFriend || isPending
                        ? 'cursor-default bg-[var(--token-card-bg)] text-white/20'
                        : 'bg-primary-500/10 hover:bg-primary-500/20 text-primary-400'
                    }`}
                  >
                    {isFriend ? 'Connected' : isPending ? 'Pending' : 'Add'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
