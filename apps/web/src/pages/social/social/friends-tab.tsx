import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { ThemedAvatar } from '@/components/theme/themed-avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { FriendRequestDialog } from './friend-request-dialog';
import type { FriendsTabProps } from './types';

interface BlockTarget {
  id: string;
  name: string;
}

function displayName(user: { username: string; displayName: string | null }) {
  return user.displayName || user.username;
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex h-9 items-center justify-between border-b border-[var(--token-border-muted)] px-1">
      <h3 className="text-xs font-semibold uppercase text-white/50">{title}</h3>
      <span className="text-xs tabular-nums text-white/35">{count}</span>
    </div>
  );
}

interface RequestRowProps {
  request: FriendRequest;
  isLoading: boolean;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onBlock: (target: BlockTarget) => void;
}

function RequestRow({
  request,
  isLoading,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onBlock,
}: RequestRowProps) {
  const name = displayName(request.user);

  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-[var(--token-border-muted)] px-1 py-2 last:border-b-0">
      <UserProfileCard userId={request.user.id} trigger="both">
        <ThemedAvatar
          src={request.user.avatarUrl}
          alt={name}
          size="small"
          className="h-10 w-10"
          avatarBorderId={getAvatarBorderId(request.user)}
          fallbackText={name}
        />
      </UserProfileCard>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="truncate text-xs text-white/45">@{request.user.username}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {request.type === 'incoming' ? (
          <>
            <button
              type="button"
              onClick={() => void onAcceptRequest(request.id)}
              disabled={isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-emerald-300 hover:bg-emerald-500/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-40"
              aria-label={`Accept friend request from ${name}`}
              title="Accept"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void onDeclineRequest(request.id)}
              disabled={isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white/55 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-40"
              aria-label={`Decline friend request from ${name}`}
              title="Decline"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void onCancelRequest(request.id)}
            disabled={isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white/55 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-40"
            aria-label={`Cancel friend request to ${name}`}
            title="Cancel request"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onBlock({ id: request.user.id, name })}
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/45 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
          aria-label={`Block ${name}`}
          title="Block"
        >
          <NoSymbolIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface FriendRowProps {
  friend: Friend;
  isLoading: boolean;
  onRemoveFriend: (friendshipId: string) => Promise<void>;
  onBlock: (target: BlockTarget) => void;
}

function FriendRow({ friend, isLoading, onRemoveFriend, onBlock }: FriendRowProps) {
  const navigate = useNavigate();
  const name = displayName(friend);

  return (
    <div className="group flex min-h-14 items-center gap-3 border-b border-[var(--token-border-muted)] px-1 py-2 last:border-b-0">
      <UserProfileCard userId={friend.id} trigger="both">
        <div className="relative flex-shrink-0">
          <ThemedAvatar
            src={friend.avatarUrl}
            alt={name}
            size="small"
            className="h-10 w-10"
            avatarBorderId={getAvatarBorderId(friend)}
            fallbackText={name}
          />
          {friend.status === 'online' ? (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[var(--token-bg-primary)]" />
          ) : null}
        </div>
      </UserProfileCard>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="truncate text-xs text-white/45">@{friend.username}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => {
            navigate(`/messages?userId=${friend.id}`);
            HapticFeedback.medium();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/55 hover:bg-primary-500/10 hover:text-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label={`Message ${name}`}
          title="Message"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => void onRemoveFriend(friend.friendshipId)}
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/45 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
          aria-label={`Remove ${name} from friends`}
          title="Remove friend"
        >
          <UserMinusIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onBlock({ id: friend.id, name })}
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/45 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
          aria-label={`Block ${name}`}
          title="Block"
        >
          <NoSymbolIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function FriendsTab({
  friends,
  pendingRequests,
  sentRequests,
  searchQuery,
  onSearchChange,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  onBlockUser,
  isLoading = false,
  error,
  onRetry,
}: FriendsTabProps) {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  async function confirmBlock() {
    if (!blockTarget || isBlocking) return;
    setIsBlocking(true);
    try {
      await onBlockUser(blockTarget.id);
      setBlockTarget(null);
      HapticFeedback.success();
    } catch {
      HapticFeedback.error();
    } finally {
      setIsBlocking(false);
    }
  }

  return (
    <section className="mx-auto flex h-full w-full max-w-4xl flex-col" aria-label="Friends and requests">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--token-border-muted)] pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white">Friends</h2>
          <p className="mt-1 text-sm text-white/45">
            {friends.length} friends, {pendingRequests.length} incoming, {sentRequests.length} sent
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddFriend(true)}
          className="flex h-11 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          <UserPlusIcon className="h-5 w-5" />
          Add friend
        </button>
        <button
          type="button"
          onClick={onRetry}
          disabled={isLoading || !onRetry}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/55 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-40"
          aria-label="Refresh friends and requests"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative mt-4">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search friends"
          aria-label="Search friends"
          className="h-11 w-full rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/25"
        />
      </div>

      {error ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2" role="alert">
          <p className="min-w-0 text-sm text-red-100">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="h-9 flex-shrink-0 rounded-lg px-3 text-sm font-semibold text-red-100 hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {pendingRequests.length > 0 ? (
          <div className="mb-5">
            <SectionHeader title="Incoming requests" count={pendingRequests.length} />
            {pendingRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                isLoading={isLoading}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
                onCancelRequest={onCancelRequest}
                onBlock={setBlockTarget}
              />
            ))}
          </div>
        ) : null}

        {sentRequests.length > 0 ? (
          <div className="mb-5">
            <SectionHeader title="Sent requests" count={sentRequests.length} />
            {sentRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                isLoading={isLoading}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
                onCancelRequest={onCancelRequest}
                onBlock={setBlockTarget}
              />
            ))}
          </div>
        ) : null}

        <div>
          <SectionHeader title="All friends" count={friends.length} />
          {friends.length > 0 ? (
            friends.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                isLoading={isLoading}
                onRemoveFriend={onRemoveFriend}
                onBlock={setBlockTarget}
              />
            ))
          ) : (
            <p className="py-10 text-center text-sm text-white/40">No friends found.</p>
          )}
        </div>
      </div>

      <FriendRequestDialog open={showAddFriend} onOpenChange={setShowAddFriend} />

      <Dialog open={blockTarget !== null} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent>
          <div role="alertdialog" aria-modal="true" aria-labelledby="block-friend-title">
            <DialogHeader>
              <div id="block-friend-title">
                <DialogTitle>Block {blockTarget?.name}?</DialogTitle>
              </div>
              <DialogDescription>
                This removes the account from friends and pending requests. You can unblock them in settings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setBlockTarget(null)}
                className="h-11 rounded-lg border border-[var(--token-border-muted)] px-4 text-sm font-semibold text-white/70 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmBlock()}
                disabled={isBlocking}
                className="h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
              >
                {isBlocking ? 'Blocking...' : 'Block'}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
