/**
 * ConversationSidebar Component
 *
 * Sidebar with search, conversation list, and actions.
 */

import { useEffect } from 'react';
import {
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MagnifyingGlassPlusIcon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { IconButton } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { useFriendStore } from '@/modules/social/store';
import { EmptyState } from './empty-state';
import { ConversationItem } from './routed-conversation-item';
import type { ConversationSidebarProps } from './sidebar-types';

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
  const pendingRequests = useFriendStore((state) => state.pendingRequests);
  const sentRequests = useFriendStore((state) => state.sentRequests);
  const fetchPendingRequests = useFriendStore((state) => state.fetchPendingRequests);
  const fetchSentRequests = useFriendStore((state) => state.fetchSentRequests);

  const friendRequestCount = pendingRequests.length + sentRequests.length;

  useEffect(() => {
    void Promise.allSettled([fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchPendingRequests, fetchSentRequests]);

  return (
    <div
      data-testid="conversation-sidebar"
      className={`cgraph-pane relative h-full shrink-0 flex-col lg:flex lg:w-80 ${
        activeConversationId ? 'hidden' : 'flex w-full'
      }`}
    >
      <div className="cgraph-pane-header relative z-10 flex flex-col justify-center px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-2 text-xl font-semibold text-[var(--token-text-primary)]">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
            Messages
          </h2>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<MagnifyingGlassPlusIcon />}
              label="Search messages"
              size="sm"
              onClick={() => {
                onOpenSearch();
                HapticFeedback.light();
              }}
            />
            <IconButton
              icon={<UserPlusIcon />}
              label="Add friend"
              size="sm"
              onClick={() => {
                onAddFriend();
                HapticFeedback.medium();
              }}
            />
            <IconButton
              icon={
                <span className="relative block h-full w-full">
                  <UsersIcon />
                  {friendRequestCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--token-feedback-error)] px-1 text-[10px] font-bold leading-none text-white">
                      {friendRequestCount > 9 ? '9+' : friendRequestCount}
                    </span>
                  ) : null}
                </span>
              }
              label={`Friend requests${
                friendRequestCount ? `, ${friendRequestCount} requests` : ''
              }`}
              size="sm"
              onClick={() => {
                onAddFriend();
                HapticFeedback.light();
              }}
            />
            <IconButton
              icon={<PlusIcon />}
              label="New conversation"
              size="sm"
              variant="primary"
              onClick={() => {
                onNewConversation();
                HapticFeedback.medium();
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 p-3">
        <div className="cgraph-segmented mb-3 grid grid-cols-2">
          <button
            type="button"
            onClick={() => onShowArchivedChange(false)}
            aria-pressed={!showArchived}
            data-active={!showArchived || undefined}
            className="flex items-center justify-center gap-2 px-3 text-xs font-medium"
          >
            <InboxIcon className="h-4 w-4" />
            Inbox
          </button>
          <button
            type="button"
            onClick={() => onShowArchivedChange(true)}
            aria-pressed={showArchived}
            data-active={showArchived || undefined}
            className="flex items-center justify-center gap-2 px-3 text-xs font-medium"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Archived
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations"
            className="cgraph-field peer w-full pl-10 pr-3 text-[13px]"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        </div>
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <ConversationListLoading />
        ) : conversations.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onNewChat={onNewConversation} />
        ) : (
          <div>
            {conversations.map((conv) => (
              <div key={conv.id}>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationListLoading() {
  return (
    <div className="space-y-2 p-3" role="status" aria-label="Loading conversations">
      <span className="sr-only">Loading conversations</span>
      <Skeleton shape="card" count={5} />
    </div>
  );
}
