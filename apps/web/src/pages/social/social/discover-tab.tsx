import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MessageSquareText, Search, UserRound, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useAuthStore } from '@/modules/auth/store';
import {
  friendshipActionLabel,
  isRelationshipActionDisabled,
  resolveFriendshipStatus,
} from '@/modules/social/friendship-status';
import { useFriendStore, type Friend, type FriendRequest } from '@/modules/social/store';
import { getDiscoverResultRoute } from './discover-routing';
import type { DiscoverTabProps, SearchResult, SearchResultType } from './types';

const RESULT_ICONS: Readonly<Record<SearchResultType, LucideIcon>> = {
  user: UserRound,
  group: UsersRound,
  forum: MessageSquareText,
};

export function DiscoverTab({
  searchQuery,
  searchResults,
  hasMore,
  hasSearched,
  isLoading,
  isLoadingMore,
  error,
  onSearchChange,
  onRetry,
  onLoadMore,
  onJoinGroup,
  joiningGroupId,
}: DiscoverTabProps) {
  const navigate = useNavigate();
  const { sendRequest, friends, sentRequests, pendingRequests } = useFriendStore();
  const { user: currentUser } = useAuthStore();
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const normalizedQuery = searchQuery.trim();

  async function handleSendRequest(result: SearchResult) {
    setActionError(null);
    setSendingUserId(result.id);
    try {
      await sendRequest(result.id);
      HapticFeedback.success();
    } catch {
      HapticFeedback.error();
      setActionError(`Could not send a friend request to ${result.name}.`);
    } finally {
      setSendingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={searchQuery}
        onChange={(event) => {
          setActionError(null);
          onSearchChange(event.target.value);
        }}
        placeholder="Search people and communities"
        aria-label="Search people and communities"
        autoComplete="off"
        leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
      />

      {error ? (
        <div
          role="alert"
          className="cgraph-section-surface flex flex-wrap items-center justify-between gap-3 p-3"
          data-cgraph-material="recessed"
        >
          <p className="min-w-0 flex-1 text-sm text-[var(--token-feedback-error)]">{error}</p>
          <Button variant="secondary" size="sm" animated={false} onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
        >
          {actionError}
        </p>
      ) : null}

      {error && searchResults.length === 0 ? null : normalizedQuery.length === 0 ? (
        <EmptyState
          title="Find people and communities"
          message="Search by username, group, or forum name."
          icon={<Search className="h-7 w-7" aria-hidden="true" />}
        />
      ) : normalizedQuery.length < 2 ? (
        <EmptyState
          title="Keep typing"
          message="Enter at least two characters to search."
          icon={<Search className="h-7 w-7" aria-hidden="true" />}
        />
      ) : isLoading || (!hasSearched && searchResults.length === 0) ? (
        <DiscoverResultsSkeleton />
      ) : searchResults.length === 0 ? (
        <EmptyState
          title="No results found"
          message={`No people or communities matched "${normalizedQuery}".`}
          icon={<Search className="h-7 w-7" aria-hidden="true" />}
        />
      ) : (
        <section aria-labelledby="discover-results-heading">
          <h3
            id="discover-results-heading"
            className="mb-2 text-xs font-semibold text-[var(--token-text-muted)]"
          >
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
          </h3>

          <ul className="space-y-2">
            {searchResults.map((result) => (
              <DiscoverResult
                key={`${result.type}:${result.id}`}
                result={result}
                currentUserId={currentUser?.id}
                friends={friends}
                pendingRequests={pendingRequests}
                sentRequests={sentRequests}
                isSending={sendingUserId === result.id}
                isJoining={joiningGroupId === result.id}
                onReviewRequests={() => navigate('/social/friends')}
                onSendRequest={() => handleSendRequest(result)}
                onJoin={() => void onJoinGroup(result)}
              />
            ))}
          </ul>

          {hasMore ? (
            <Button
              variant="secondary"
              fullWidth
              animated={false}
              isLoading={isLoadingMore}
              onClick={onLoadMore}
              className="mt-4"
            >
              Load more
            </Button>
          ) : null}
        </section>
      )}
    </div>
  );
}

interface DiscoverResultProps {
  readonly result: SearchResult;
  readonly currentUserId?: string;
  readonly friends: Friend[];
  readonly pendingRequests: FriendRequest[];
  readonly sentRequests: FriendRequest[];
  readonly isSending: boolean;
  readonly isJoining: boolean;
  readonly onReviewRequests: () => void;
  readonly onSendRequest: () => Promise<void>;
  readonly onJoin: () => void;
}

function DiscoverResult({
  result,
  currentUserId,
  friends,
  pendingRequests,
  sentRequests,
  isSending,
  isJoining,
  onReviewRequests,
  onSendRequest,
  onJoin,
}: DiscoverResultProps) {
  const ResultIcon = RESULT_ICONS[result.type];
  const friendshipStatus = resolveFriendshipStatus(result, {
    friends,
    pendingRequests,
    sentRequests,
  });
  const relationshipDisabled = isRelationshipActionDisabled(friendshipStatus, isSending);
  const relationshipLabel = friendshipActionLabel(friendshipStatus, isSending);
  const metadata =
    result.memberCount !== undefined
      ? `${result.memberCount.toLocaleString()} ${result.memberCount === 1 ? 'member' : 'members'}`
      : result.type;

  return (
    <li className="cgraph-list-row flex min-h-16 items-center gap-3 p-3">
      <Link
        to={getDiscoverResultRoute(result)}
        aria-label={`Open ${result.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--token-card-border)] bg-[var(--product-surface-selected)] text-[var(--token-interactive-primary)]">
          {result.avatarUrl ? (
            <img
              src={result.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ResultIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--token-text-primary)]">
            {result.name}
          </span>
          <span className="block truncate text-xs text-[var(--token-text-muted)]">
            {result.description || metadata}
          </span>
        </span>

        <span className="hidden shrink-0 text-xs capitalize text-[var(--token-text-muted)] sm:block">
          {metadata}
        </span>
      </Link>

      {result.type === 'user' && result.id !== currentUserId ? (
        <Button
          variant="secondary"
          size="sm"
          animated={false}
          disabled={relationshipDisabled}
          isLoading={isSending}
          onClick={() => {
            if (friendshipStatus === 'pending_received') {
              onReviewRequests();
              return;
            }
            if (friendshipStatus === 'none') void onSendRequest();
          }}
          className="shrink-0"
        >
          {relationshipLabel}
        </Button>
      ) : result.type === 'group' && !result.isJoined ? (
        <Button
          variant="secondary"
          size="sm"
          animated={false}
          isLoading={isJoining}
          onClick={onJoin}
          aria-label={`Join ${result.name}`}
          className="shrink-0"
        >
          Join
        </Button>
      ) : null}
    </li>
  );
}

function DiscoverResultsSkeleton() {
  return (
    <div role="status" aria-label="Searching" className="space-y-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="cgraph-list-row flex min-h-16 items-center gap-3 p-3"
          data-cgraph-material="recessed"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton variant="text" width="38%" />
            <Skeleton variant="text" width="62%" />
          </div>
          <Skeleton variant="rectangular" width={72} height={32} />
        </div>
      ))}
    </div>
  );
}
