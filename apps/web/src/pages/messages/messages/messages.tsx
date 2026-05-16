/**
 * Messages Page Component
 *
 * Main messages page with conversation sidebar and content area.
 */

import { useCallback, useEffect, useState } from 'react';
import { Outlet, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { NewChatModal } from '@/modules/chat/components/conversation-list';
import { socketManager } from '@/lib/socket';
import { http } from '@/lib/api-client';
import { ensureArray } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';
import { MessageSearch } from '@/modules/chat/components/message-search';

import { ConversationSidebar } from './conversation-sidebar';
import { NoConversationSelected } from './empty-states';
import {
  applySpaceConversationPatch,
  readConversationSpace,
  spaceConversationPatch,
  type ConversationSpace,
} from './conversation-spaces';
import { filterConversations } from './utils';
import type { OnlineStatusMap } from './types';

const logger = createLogger('Messages');

/**
 * Messages component.
 */
export default function Messages() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    archivedConversations,
    isLoadingConversations,
    isLoadingArchivedConversations,
    fetchConversations,
    fetchArchivedConversations,
    createConversation,
    markAsRead,
    markAsUnread,
    archiveConversation,
    unarchiveConversation,
    pinConversation,
    muteConversation,
  } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [spaces, setSpaces] = useState<readonly ConversationSpace[]>([]);

  // Handle search result click - navigate to conversation and scroll to message
  function handleSearchResultClick(convId: string, messageId: string) {
    setIsSearchOpen(false);
    navigate(`/messages/${convId}?scrollTo=${messageId}`);
  }

  // Track online status changes for all conversations
  useEffect(() => {
    return socketManager.onStatusChange((convId, userId, isOnline) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [`${convId}-${userId}`]: isOnline,
      }));
    });
  }, []);

  // Initialize presence checking for loaded conversations
  useEffect(() => {
    if (conversations.length > 0) {
      // Get initial presence state from socket manager
      const allStatuses = socketManager.getAllOnlineStatuses();
      const statusMap: OnlineStatusMap = {};

      conversations.forEach((conv) => {
        const onlineUsers = allStatuses.get(conv.id);
        if (onlineUsers) {
          const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
          if (otherParticipant) {
            statusMap[`${conv.id}-${otherParticipant.userId}`] = onlineUsers.has(
              otherParticipant.userId
            );
          }
        }
      });

      setOnlineStatus(statusMap);

      // Peek at all conversations to get presence updates
      const conversationIds = conversations.map((c) => c.id);
      socketManager.peekConversationsPresence(conversationIds);
    }
  }, [conversations, user?.id]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadSpaces = useCallback(async () => {
    try {
      const response = await http.get('/api/v1/spaces');
      const parsed = ensureArray<unknown>(response.data)
        .map(readConversationSpace)
        .filter((space): space is ConversationSpace => Boolean(space))
        .sort((a, b) => a.position - b.position);
      setSpaces(parsed);
    } catch (error) {
      logger.warn('Failed to load Spaces for conversation actions:', error);
    }
  }, []);

  useEffect(() => {
    void loadSpaces();
  }, [loadSpaces]);

  useEffect(() => {
    if (showArchived) {
      fetchArchivedConversations();
    }
  }, [fetchArchivedConversations, showArchived]);

  const handleStartConversationWithUser = useCallback(
    async (userId: string) => {
      // Check if conversation already exists with this user
      const existingConv = conversations.find((conv) => {
        if (conv.type !== 'direct') return false;
        return conv.participants.some((p) => p.userId === userId);
      });

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`, { replace: true });
        return;
      }

      // Create new conversation
      setIsCreatingConversation(true);
      try {
        const newConv = await createConversation([userId], { type: 'cloud' });
        navigate(`/messages/${newConv.id}`, { replace: true });
      } catch (error) {
        logger.error('Failed to create conversation:', error);
        toast.error('Failed to start conversation. Please try again.');
        navigate('/messages', { replace: true });
      } finally {
        setIsCreatingConversation(false);
      }
    },
    [conversations, createConversation, navigate]
  );

  async function handleMarkConversationRead(convId: string) {
    try {
      await markAsRead(convId);
    } catch (error) {
      logger.error('Failed to mark conversation read:', error);
      toast.error('Failed to mark conversation read.');
    }
  }

  async function handleMarkConversationUnread(convId: string) {
    try {
      await markAsUnread(convId);
    } catch (error) {
      logger.error('Failed to mark conversation unread:', error);
      toast.error('Failed to mark conversation unread.');
    }
  }

  async function handleArchiveConversation(convId: string) {
    try {
      await archiveConversation(convId);
      if (conversationId === convId) {
        navigate('/messages', { replace: true });
      }
      toast.success('Conversation archived.');
    } catch (error) {
      logger.error('Failed to archive conversation:', error);
      toast.error('Failed to archive conversation.');
    }
  }

  async function handleUnarchiveConversation(convId: string) {
    try {
      await unarchiveConversation(convId);
      toast.success('Conversation restored.');
    } catch (error) {
      logger.error('Failed to unarchive conversation:', error);
      toast.error('Failed to restore conversation.');
    }
  }

  async function handlePinConversation(convId: string, pinned: boolean) {
    try {
      await pinConversation(convId, pinned);
      toast.success(pinned ? 'Conversation pinned.' : 'Conversation unpinned.');
    } catch (error) {
      logger.error('Failed to update conversation pin:', error);
      toast.error('Failed to update conversation pin.');
    }
  }

  async function handleMuteConversation(convId: string, muted: boolean) {
    try {
      await muteConversation(convId, muted);
      toast.success(muted ? 'Conversation muted.' : 'Conversation unmuted.');
    } catch (error) {
      logger.error('Failed to update conversation mute:', error);
      toast.error('Failed to update conversation mute.');
    }
  }

  async function handleToggleConversationSpace(
    convId: string,
    spaceId: string,
    shouldInclude: boolean
  ) {
    const previousSpace = spaces.find((space) => space.id === spaceId);
    if (!previousSpace) return;

    const patch = spaceConversationPatch(previousSpace, convId, shouldInclude);

    setSpaces((current) =>
      current.map((space) =>
        space.id === spaceId ? applySpaceConversationPatch(space, convId, shouldInclude) : space
      )
    );

    try {
      const response = await http.patch(`/api/v1/spaces/${spaceId}`, patch);
      const updated = readConversationSpace(response.data);
      if (updated) {
        setSpaces((current) =>
          current
            .map((space) => (space.id === updated.id ? updated : space))
            .sort((a, b) => a.position - b.position)
        );
      }
      toast.success(shouldInclude ? 'Conversation added to Space.' : 'Conversation removed.');
    } catch (error) {
      logger.error('Failed to update conversation Space:', error);
      setSpaces((current) =>
        current.map((space) => (space.id === previousSpace.id ? previousSpace : space))
      );
      toast.error('Failed to update Space.');
    }
  }

  // Handle userId query param (from friends page)
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && !isCreatingConversation) {
      handleStartConversationWithUser(userId);
    }
  }, [searchParams, isCreatingConversation, handleStartConversationWithUser]);

  // Filter conversations by search query
  const visibleConversations = showArchived ? archivedConversations : conversations;
  const filteredConversations = [
    ...filterConversations(visibleConversations, searchQuery, user?.id || ''),
  ].sort((a, b) => Number(b.isPinned === true) - Number(a.isPinned === true));

  return (
    <div className="aurora-hub-shell max-h-screen flex-1">
      {/* Conversations Sidebar */}
      <ConversationSidebar
        conversations={filteredConversations}
        activeConversationId={conversationId}
        currentUserId={user?.id || ''}
        onlineStatus={onlineStatus}
        searchQuery={searchQuery}
        isLoading={showArchived ? isLoadingArchivedConversations : isLoadingConversations}
        onSearchChange={setSearchQuery}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNewConversation={() => setShowNewChatModal(true)}
        onMarkAsRead={handleMarkConversationRead}
        onMarkAsUnread={handleMarkConversationUnread}
        onArchive={handleArchiveConversation}
        onUnarchive={handleUnarchiveConversation}
        onPin={handlePinConversation}
        onMute={handleMuteConversation}
        spaces={spaces}
        onToggleSpace={handleToggleConversationSpace}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      {/* Conversation Content */}
      <div
        className="aurora-hub-main flex h-full min-w-0 flex-col bg-transparent"
        aria-label="Conversation content"
        tabIndex={0}
      >
        {conversationId ? <Outlet /> : <NoConversationSelected />}
      </div>

      {/* Message Search Modal */}
      <MessageSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onResultClick={handleSearchResultClick}
      />

      {/* New Chat Modal */}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
    </div>
  );
}
