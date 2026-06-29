/**
 * ConversationSidebar Component
 *
 * Sidebar with search, conversation list, and actions.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MagnifyingGlassPlusIcon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo, getAvatarBorderId } from '@/lib/utils';
import { useFriendStore, type FriendRequest } from '@/modules/social/store';
import { toast } from '@/shared/components/ui';
import { EmptyState } from './empty-state';
import { ConversationItem } from './routed-conversation-item';
import type { ConversationSidebarProps } from './sidebar-types';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 */
/**
 * Conversation Sidebar component.
 */
export function ConversationSidebar({
  conversations,
  activeConversationId,
  currentUserId,
  onlineStatus,
  searchQuery,
  isLoading,
  onSearchChange,
  onOpenSearch,
  onAddFriend,
  onNewConversation,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onPin,
  onMute,
  spaces,
  onToggleSpace,
  showArchived,
  onShowArchivedChange,
}: ConversationSidebarProps) {
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const pendingRequests = useFriendStore((state) => state.pendingRequests);
  const sentRequests = useFriendStore((state) => state.sentRequests);
  const isFriendLoading = useFriendStore((state) => state.isLoading);
  const friendError = useFriendStore((state) => state.error);
  const fetchPendingRequests = useFriendStore((state) => state.fetchPendingRequests);
  const fetchSentRequests = useFriendStore((state) => state.fetchSentRequests);
  const acceptRequest = useFriendStore((state) => state.acceptRequest);
  const declineRequest = useFriendStore((state) => state.declineRequest);
  const removeFriend = useFriendStore((state) => state.removeFriend);
  const clearFriendError = useFriendStore((state) => state.clearError);

  const friendRequestCount = pendingRequests.length + sentRequests.length;
  const incomingRequestCount = pendingRequests.length;

  useEffect(() => {
    void Promise.allSettled([fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchPendingRequests, fetchSentRequests]);

  useEffect(() => {
    if (!showFriendRequests) return;
    clearFriendError();
    void Promise.allSettled([fetchPendingRequests(), fetchSentRequests()]);
  }, [clearFriendError, fetchPendingRequests, fetchSentRequests, showFriendRequests]);

  async function handleAcceptRequest(requestId: string) {
    try {
      await acceptRequest(requestId);
      HapticFeedback.success();
      toast.success('Friend request accepted.');
    } catch (error) {
      HapticFeedback.error();
      toast.error(
        'Could not accept request.',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }

  async function handleDeclineRequest(requestId: string) {
    try {
      await declineRequest(requestId);
      HapticFeedback.light();
      toast.success('Friend request declined.');
    } catch (error) {
      HapticFeedback.error();
      toast.error(
        'Could not decline request.',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }

  async function handleCancelRequest(requestId: string) {
    try {
      await removeFriend(requestId);
      HapticFeedback.light();
      toast.success('Friend request cancelled.');
    } catch (error) {
      HapticFeedback.error();
      toast.error(
        'Could not cancel request.',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }

  function handleRefreshRequests() {
    clearFriendError();
    void Promise.allSettled([fetchPendingRequests(), fetchSentRequests()]);
  }

  return (
    <div className="bg-[var(--token-card-bg)]/40 relative flex h-full w-80 shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl transition-all duration-300">
      {/* Ambient glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

      {/* Header */}
      <div className="relative z-10 p-5 pb-3">
        <motion.div
          className="mb-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tweens.moderate}
        >
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-400" />
            Messages
          </h2>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => {
                onOpenSearch();
                HapticFeedback.light();
              }}
              className="group rounded-xl border border-transparent p-2 text-white/40 backdrop-blur-md transition-all hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4] hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
              title="Search messages"
              whileTap={{ scale: 0.88 }}
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </motion.button>
            <motion.button
              onClick={() => {
                onAddFriend();
                HapticFeedback.medium();
              }}
              className="group rounded-xl border border-transparent p-2 text-white/40 backdrop-blur-md transition-all hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4] hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
              title="Add friend"
              aria-label="Add friend"
              whileTap={{ scale: 0.88 }}
            >
              <UserPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </motion.button>
            <motion.button
              onClick={() => {
                setShowFriendRequests((open) => !open);
                HapticFeedback.light();
              }}
              className={`group relative rounded-xl border p-2 backdrop-blur-md transition-all hover:text-white ${
                showFriendRequests
                  ? 'border-primary-400/40 bg-primary-500/15 text-primary-100'
                  : 'border-transparent text-white/40 hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4]'
              }`}
              title="Friend requests"
              aria-label={`Friend requests${
                friendRequestCount ? `, ${friendRequestCount} requests` : ''
              }`}
              aria-expanded={showFriendRequests}
              whileTap={{ scale: 0.88 }}
            >
              <UsersIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              {friendRequestCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_12px_rgba(124,58,237,0.65)]">
                  {friendRequestCount > 9 ? '9+' : friendRequestCount}
                </span>
              ) : null}
            </motion.button>
            <motion.button
              onClick={() => {
                onNewConversation();
                HapticFeedback.medium();
              }}
              className="group rounded-xl border border-transparent p-2 text-white/40 backdrop-blur-md transition-all hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4] hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
              title="New conversation"
              whileTap={{ scale: 0.88 }}
            >
              <PlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </motion.button>
          </div>
        </motion.div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShowArchivedChange(false)}
            aria-pressed={!showArchived}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              !showArchived
                ? 'border-primary-500/30 bg-primary-500/15 text-white'
                : 'border-[var(--token-border-muted)] bg-transparent text-white/50 hover:text-white'
            }`}
          >
            <InboxIcon className="h-4 w-4" />
            Inbox
          </button>
          <button
            type="button"
            onClick={() => onShowArchivedChange(true)}
            aria-pressed={showArchived}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showArchived
                ? 'border-primary-500/30 bg-primary-500/15 text-white'
                : 'border-[var(--token-border-muted)] bg-transparent text-white/50 hover:text-white'
            }`}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Archived
          </button>
        </div>

        {/* Enhanced Search */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...tweens.moderate, delay: 0.1 }}
        >
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations"
            className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2.5 pl-10 pr-4 text-[13px] text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        </motion.div>

        {showFriendRequests ? (
          <FriendRequestsPanel
            incomingRequests={pendingRequests}
            outgoingRequests={sentRequests}
            incomingRequestCount={incomingRequestCount}
            isLoading={isFriendLoading}
            error={friendError}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onCancel={handleCancelRequest}
            onRefresh={handleRefreshRequests}
          />
        ) : null}
      </div>

      {/* Conversations List */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <ConversationListLoading />
        ) : conversations.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onNewChat={onNewConversation} />
        ) : (
          <motion.div {...FADE_IN} transition={tweens.standard}>
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...tweens.standard, delay: index * 0.05 }}
              >
                <ConversationItem
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  currentUserId={currentUserId}
                  onlineStatus={onlineStatus}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onPin={onPin}
                  onMute={onMute}
                  spaces={spaces}
                  onToggleSpace={onToggleSpace}
                  showArchived={showArchived}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface FriendRequestsPanelProps {
  incomingRequests: readonly FriendRequest[];
  outgoingRequests: readonly FriendRequest[];
  incomingRequestCount: number;
  isLoading: boolean;
  error: string | null;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
  onRefresh: () => void;
}

function FriendRequestsPanel({
  incomingRequests,
  outgoingRequests,
  incomingRequestCount,
  isLoading,
  error,
  onAccept,
  onDecline,
  onCancel,
  onRefresh,
}: FriendRequestsPanelProps) {
  const hasRequests = incomingRequests.length > 0 || outgoingRequests.length > 0;
  const title = useMemo(
    () => (incomingRequestCount > 0 ? `Requests (${incomingRequestCount})` : 'Friend Requests'),
    [incomingRequestCount]
  );

  return (
    <motion.section
      {...FADE_IN}
      transition={tweens.standard}
      className="mt-3 max-h-[min(60vh,28rem)] overflow-y-auto rounded-2xl border border-[var(--token-border-muted)] bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      aria-label="Friend requests"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/40">Incoming and sent requests</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-lg border border-[var(--token-border-muted)] p-1.5 text-white/45 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh friend requests"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      ) : null}

      {hasRequests ? (
        <div className="space-y-3">
          <FriendRequestSection
            title="Incoming"
            emptyText="No incoming requests"
            requests={incomingRequests}
            isLoading={isLoading}
            kind="incoming"
            onAccept={onAccept}
            onDecline={onDecline}
          />
          <FriendRequestSection
            title="Sent"
            emptyText="No sent requests"
            requests={outgoingRequests}
            isLoading={isLoading}
            kind="outgoing"
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-white/35">
          No friend requests yet.
        </div>
      )}
    </motion.section>
  );
}

interface FriendRequestSectionProps {
  title: string;
  emptyText: string;
  requests: readonly FriendRequest[];
  isLoading: boolean;
  kind: FriendRequest['type'];
  onAccept?: (requestId: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
}

function FriendRequestSection({
  title,
  emptyText,
  requests,
  isLoading,
  kind,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestSectionProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/35">
        <span>{title}</span>
        <span>{requests.length}</span>
      </div>
      {requests.length > 0 ? (
        <div className="space-y-2">
          {requests.map((request) => (
            <FriendRequestRow
              key={`${kind}:${request.id}`}
              request={request}
              isLoading={isLoading}
              kind={kind}
              onAccept={onAccept}
              onDecline={onDecline}
              onCancel={onCancel}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/28">
          {emptyText}
        </p>
      )}
    </div>
  );
}

interface FriendRequestRowProps {
  request: FriendRequest;
  isLoading: boolean;
  kind: FriendRequest['type'];
  onAccept?: (requestId: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
}

function FriendRequestRow({
  request,
  isLoading,
  kind,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestRowProps) {
  const displayName = request.user.displayName || request.user.username || 'Unknown User';
  const handle = request.user.username ? `@${request.user.username}` : 'Unknown handle';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-2.5">
        <ThemedAvatar
          src={request.user.avatarUrl}
          alt={displayName}
          size="small"
          avatarBorderId={getAvatarBorderId(request.user)}
          fallbackText={displayName}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/85">{displayName}</p>
          <p className="truncate text-xs text-white/35">
            {handle} · {formatTimeAgo(request.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {kind === 'incoming' ? (
          <>
            <button
              type="button"
              onClick={() => onAccept?.(request.id)}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={() => onDecline?.(request.id)}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Decline
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onCancel?.(request.id)}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Cancel request
          </button>
        )}
      </div>
    </div>
  );
}

function ConversationListLoading() {
  return (
    <motion.div className="flex items-center justify-center py-12" {...FADE_IN}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </motion.div>
  );
}
