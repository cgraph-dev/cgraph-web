import { useState } from 'react';
import { Search, SearchX, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { publicProfilePath } from '@/lib/profile-route';
import { useAuthStore } from '@/modules/auth/store';
import { useFriendStore } from '@/modules/social/store';
import { useUserSearch } from '@/modules/social/hooks/useUserSearch';
import {
  friendshipActionLabel,
  isRelationshipActionDisabled,
  resolveFriendshipStatus,
} from '@/modules/social/friendship-status';

export function PeopleTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { results: users, isLoading, error } = useUserSearch(query);
  const { friends, sentRequests, pendingRequests, sendRequest } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="cgraph-content max-w-2xl">
      <Input
        aria-label="Search people"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActionError(null);
        }}
        placeholder="Search people..."
        leftIcon={<Search className="h-5 w-5" />}
        className="mb-6 text-sm"
        autoFocus
        fullWidth
      />

      {actionError ? (
        <Alert variant="error" className="mb-4">
          <AlertTitle>Request not sent</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {query.length === 0 ? (
        <EmptyState
          icon={<UserRound className="h-7 w-7" />}
          title="Find people"
          message="Search by username or display name to connect."
        />
      ) : null}

      {query.length >= 2 && isLoading ? (
        <div className="space-y-2 py-4" role="status" aria-label="Searching people">
          <span className="sr-only">Searching people</span>
          <Skeleton shape="card" count={4} />
        </div>
      ) : null}

      {query.length >= 2 && !isLoading && error ? (
        <Alert variant="error">
          <AlertTitle>Search is unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {query.length >= 2 && !isLoading && !error && users.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7" />}
          title="No people found"
          message={`No profiles match "${query}".`}
        />
      ) : null}

      {users.length > 0 ? (
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
                className="cgraph-list-row flex min-h-16 items-center gap-3 p-3"
              >
                <Link
                  to={profilePath}
                  aria-label={`View ${displayName} profile`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--token-card-border)] bg-[var(--product-surface-selected)] text-sm font-bold text-[var(--token-interactive-primary)]">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--token-text-muted)]">
                      @{user.username}
                    </p>
                  </div>
                </Link>

                {!isSelf ? (
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

                      setActionError(null);
                      setSendingUserId(user.id);
                      try {
                        await sendRequest(user.id);
                        HapticFeedback.success();
                      } catch {
                        HapticFeedback.error();
                        setActionError(`Could not send a friend request to ${displayName}.`);
                      } finally {
                        setSendingUserId(null);
                      }
                    }}
                    disabled={isDisabled}
                    className="shrink-0"
                  >
                    {actionLabel}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
