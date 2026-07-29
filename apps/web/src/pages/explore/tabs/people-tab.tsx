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
import {
  friendshipActionLabel,
  isRelationshipActionDisabled,
  resolveFriendshipStatus,
} from '@/modules/social/friendship-status';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { publicProfilePath } from '@/lib/profile-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';

/** People tab — search and discover users. */
export function PeopleTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);

  const { results: users, isLoading, error } = useUserSearch(query);
  const { friends, sentRequests, pendingRequests, sendRequest } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  function handleSearch(value: string) {
    setQuery(value);
  }

  return (
    <div className="cgraph-content max-w-2xl">
      <Input
        aria-label="Search people"
        type="search"
        value={query}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder="Search people..."
        leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        className="mb-6 text-sm"
        autoFocus
        fullWidth
      />

      {/* Empty state */}
      {query.length === 0 && (
        <EmptyState
          icon={<UserIcon className="h-7 w-7" />}
          title="Find people"
          message="Search by username or display name to connect."
        />
      )}

      {/* Loading */}
      {query.length >= 2 && isLoading && (
        <div className="space-y-2 py-4" role="status" aria-label="Searching people">
          <span className="sr-only">Searching people</span>
          <Skeleton shape="card" count={4} />
        </div>
      )}

      {query.length >= 2 && !isLoading && error && (
        <div className="py-10 text-center text-sm text-[var(--token-feedback-error)]">
          Could not search people right now.
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !isLoading && !error && users.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--token-text-muted)]">
          No people found for "{query}"
        </div>
      )}

      {/* Results */}
      {users.length > 0 && (
        <div className="space-y-2">
          <p className="mb-3 text-[11px] font-semibold uppercase text-[var(--token-text-muted)]">
            {users.length} {users.length === 1 ? 'person' : 'people'} found
          </p>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const friendshipStatus = resolveFriendshipStatus(user, {
              friends,
              pendingRequests,
              sentRequests,
            });
            const isSending = sendingUserId === user.id;
            const isDisabled = isRelationshipActionDisabled(friendshipStatus, isSending);
            const profilePath = publicProfilePath({ id: user.id, username: user.username });
            const displayName = user.display_name ?? user.username;
            const actionLabel = friendshipActionLabel(friendshipStatus, isSending);

            return (
              <div
                key={user.id}
                className="cgraph-list-row flex cursor-pointer items-center gap-3 p-3"
                onClick={() => navigate(profilePath)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(profilePath)}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--product-surface-selected)] text-sm font-bold text-[var(--token-interactive-primary)]">
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
                  <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--token-text-muted)]">
                    @{user.username}
                  </p>
                </div>

                {/* Action */}
                {!isSelf && (
                  <Button
                    size="sm"
                    animated={false}
                    variant="secondary"
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (friendshipStatus === 'pending_received') {
                        navigate('/social/friends');
                        return;
                      }
                      if (friendshipStatus !== 'none' || isSending) return;

                      setSendingUserId(user.id);
                      try {
                        await sendRequest(user.id);
                        HapticFeedback.success();
                      } catch {
                        HapticFeedback.error();
                      } finally {
                        setSendingUserId(null);
                      }
                    }}
                    disabled={isDisabled}
                    className="flex-shrink-0"
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
