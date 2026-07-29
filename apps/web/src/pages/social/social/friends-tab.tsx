import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  Check,
  MessageCircle,
  RefreshCw,
  Search,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';

import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
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
    <div className="flex min-h-9 items-center justify-between border-b border-[var(--token-border-muted)] px-2">
      <h3 className="text-xs font-semibold uppercase text-[var(--token-text-secondary)]">{title}</h3>
      <span className="text-xs tabular-nums text-[var(--token-text-muted)]">{count}</span>
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
    <li className="cgraph-list-row flex min-h-16 items-center gap-3 rounded-none border-x-0 border-t-0 px-2 py-2 last:border-b-0">
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
        <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">{name}</p>
        <p className="truncate text-xs text-[var(--token-text-muted)]">@{request.user.username}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {request.type === 'incoming' ? (
          <>
            <IconButton
              icon={<Check />}
              variant="primary"
              onClick={() => void onAcceptRequest(request.id)}
              disabled={isLoading}
              className="h-11 w-11 shrink-0"
              label={`Accept friend request from ${name}`}
            />
            <IconButton
              icon={<X />}
              onClick={() => void onDeclineRequest(request.id)}
              disabled={isLoading}
              className="h-11 w-11 shrink-0"
              label={`Decline friend request from ${name}`}
            />
          </>
        ) : (
          <IconButton
            icon={<X />}
            onClick={() => void onCancelRequest(request.id)}
            disabled={isLoading}
            className="h-11 w-11 shrink-0"
            label={`Cancel friend request to ${name}`}
          />
        )}
        <IconButton
          icon={<Ban />}
          variant="danger"
          onClick={() => onBlock({ id: request.user.id, name })}
          disabled={isLoading}
          className="h-11 w-11 shrink-0"
          label={`Block ${name}`}
        />
      </div>
    </li>
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
    <li className="cgraph-list-row flex min-h-16 items-center gap-3 rounded-none border-x-0 border-t-0 px-2 py-2 last:border-b-0">
      <UserProfileCard userId={friend.id} trigger="both">
        <div className="relative shrink-0">
          <ThemedAvatar
            src={friend.avatarUrl}
            alt={name}
            size="small"
            className="h-10 w-10"
            avatarBorderId={getAvatarBorderId(friend)}
            fallbackText={name}
          />
          {friend.status === 'online' ? (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[var(--token-feedback-success)] ring-2 ring-[var(--token-bg-primary)]"
              title="Online"
            >
              <span className="sr-only">Online</span>
            </span>
          ) : null}
        </div>
      </UserProfileCard>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">{name}</p>
        <p className="truncate text-xs text-[var(--token-text-muted)]">@{friend.username}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          icon={<MessageCircle />}
          onClick={() => {
            navigate(`/messages?userId=${friend.id}`);
            HapticFeedback.medium();
          }}
          className="h-11 w-11 shrink-0"
          label={`Message ${name}`}
        />
        <IconButton
          icon={<UserMinus />}
          variant="danger"
          onClick={() => void onRemoveFriend(friend.friendshipId)}
          disabled={isLoading}
          className="h-11 w-11 shrink-0"
          label={`Remove ${name} from friends`}
        />
        <IconButton
          icon={<Ban />}
          variant="danger"
          onClick={() => onBlock({ id: friend.id, name })}
          disabled={isLoading}
          className="h-11 w-11 shrink-0"
          label={`Block ${name}`}
        />
      </div>
    </li>
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
  const [blockError, setBlockError] = useState<string | null>(null);

  function openBlockDialog(target: BlockTarget) {
    setBlockError(null);
    setBlockTarget(target);
  }

  function closeBlockDialog() {
    if (isBlocking) return;
    setBlockError(null);
    setBlockTarget(null);
  }

  async function confirmBlock() {
    if (!blockTarget || isBlocking) return;
    setIsBlocking(true);
    setBlockError(null);
    try {
      await onBlockUser(blockTarget.id);
      setBlockTarget(null);
      HapticFeedback.success();
    } catch {
      setBlockError(`Could not block ${blockTarget.name}. Try again.`);
      HapticFeedback.error();
    } finally {
      setIsBlocking(false);
    }
  }

  return (
    <section
      className="mx-auto flex h-full w-full max-w-4xl flex-col"
      aria-label="Friends and requests"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--token-border-muted)] pb-4">
        <p className="min-w-0 flex-1 text-sm text-[var(--token-text-secondary)]">
          {friends.length} friends, {pendingRequests.length} incoming, {sentRequests.length} sent
        </p>
        <Button
          onClick={() => setShowAddFriend(true)}
          leftIcon={<UserPlus />}
          animated={false}
        >
          Add friend
        </Button>
        <IconButton
          icon={<RefreshCw />}
          onClick={onRetry}
          disabled={isLoading || !onRetry}
          isLoading={isLoading}
          className="h-11 w-11 shrink-0"
          label="Refresh friends and requests"
        />
      </div>

      <div className="mt-4">
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search friends"
          aria-label="Search friends"
          leftIcon={<Search className="h-4 w-4" />}
          size="lg"
        />
      </div>

      {error ? (
        <div
          className="cgraph-section-surface mt-4 flex items-center justify-between gap-3 border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2"
          data-cgraph-material="recessed"
          role="alert"
        >
          <p className="min-w-0 flex-1 text-sm text-[var(--token-feedback-error)]">{error}</p>
          {onRetry ? (
            <Button variant="ghost" size="sm" onClick={onRetry} animated={false}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {pendingRequests.length > 0 ? (
          <div className="mb-5">
            <SectionHeader title="Incoming requests" count={pendingRequests.length} />
            <ul>
              {pendingRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  isLoading={isLoading}
                  onAcceptRequest={onAcceptRequest}
                  onDeclineRequest={onDeclineRequest}
                  onCancelRequest={onCancelRequest}
                  onBlock={openBlockDialog}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {sentRequests.length > 0 ? (
          <div className="mb-5">
            <SectionHeader title="Sent requests" count={sentRequests.length} />
            <ul>
              {sentRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  isLoading={isLoading}
                  onAcceptRequest={onAcceptRequest}
                  onDeclineRequest={onDeclineRequest}
                  onCancelRequest={onCancelRequest}
                  onBlock={openBlockDialog}
                />
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <SectionHeader title="All friends" count={friends.length} />
          {friends.length > 0 ? (
            <ul>
              {friends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  isLoading={isLoading}
                  onRemoveFriend={onRemoveFriend}
                  onBlock={openBlockDialog}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              className="py-10"
              title="No friends found"
              message={
                searchQuery
                  ? 'Try another name or handle.'
                  : 'Add a friend to start a private conversation.'
              }
              icon={<UsersRound className="h-7 w-7" />}
            />
          )}
        </div>
      </div>

      <FriendRequestDialog open={showAddFriend} onOpenChange={setShowAddFriend} />

      <Dialog open={blockTarget !== null} onOpenChange={(open) => !open && closeBlockDialog()}>
        <DialogContent>
          <div role="alertdialog" aria-modal="true" aria-labelledby="block-friend-title">
            <DialogHeader>
              <div id="block-friend-title">
                <DialogTitle>Block {blockTarget?.name}?</DialogTitle>
              </div>
              <DialogDescription>
                This removes the account from friends and pending requests. You can unblock them in
                settings.
              </DialogDescription>
            </DialogHeader>
            {blockError ? (
              <p
                className="cgraph-section-surface mt-4 border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
                data-cgraph-material="recessed"
                role="alert"
              >
                {blockError}
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="secondary" onClick={closeBlockDialog} animated={false}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => void confirmBlock()}
                isLoading={isBlocking}
                animated={false}
              >
                {isBlocking ? 'Blocking...' : 'Block'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
