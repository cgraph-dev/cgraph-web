/**
 * GroupChannel Page Component
 *
 * Displays a group text channel with messages, members sidebar,
 * and input for sending new messages.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { useAuthStore } from '@/modules/auth/store';
import { socketManager } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { http } from '@/lib/api-client';

import { ChannelHeader } from './channel-header';
import { MessagesArea } from './messages-area';
import { MessageInput } from './message-input';
import { MembersSidebar } from './members-sidebar';
import { PinnedMessagesPanel } from './pinned-messages-panel';
import { ChannelThreadPanel } from './channel-thread-panel';
import { useChannelThreadStore } from '@/modules/groups/store/channelThreadStore';
import { findGroupChannel } from '@/modules/groups/routing';
import { formatDateHeader, groupMessagesByDate } from './utils';
import type { ChannelMessage } from './types';

const logger = createLogger('GroupChannel');

type GroupChannelSurface = 'text' | 'announcement' | 'forum';

interface GroupChannelProps {
  surface?: GroupChannelSurface;
}

const surfaceCopy: Record<
  GroupChannelSurface,
  { headerType: GroupChannelSurface; label?: string; placeholderPrefix: string }
> = {
  text: {
    headerType: 'text',
    placeholderPrefix: 'Message',
  },
  announcement: {
    headerType: 'announcement',
    label: 'Announcements',
    placeholderPrefix: 'Post announcement in',
  },
  forum: {
    headerType: 'forum',
    label: 'Topics',
    placeholderPrefix: 'Post in topic channel',
  },
};

interface UploadedAttachment {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  thumbnailUrl: string | null;
}

const EMPTY_MESSAGES: readonly ChannelMessage[] = [];
const ADMINISTRATOR_PERMISSION = 1 << 0;
const MANAGE_MESSAGES_PERMISSION = 1 << 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function groupActionErrorMessage(value: unknown): string {
  if (isRecord(value)) {
    const reason = value.reason;
    if (typeof reason === 'string') return reason.replace(/_/g, ' ');
    const errors = value.errors;
    if (isRecord(errors)) return Object.values(errors).flat().join(', ');
  }
  return 'Channel action failed.';
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function messageTypeForFile(file: File): ChannelMessage['messageType'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', 'message');

  const response = await http.post('/api/v1/uploads', formData);
  const data = isRecord(response.data) && isRecord(response.data.data) ? response.data.data : null;
  const url = stringValue(data?.url);

  if (!data || !url) {
    throw new Error('Upload response did not include a file URL');
  }

  return {
    url,
    filename: stringValue(data.original_filename) ?? stringValue(data.filename) ?? file.name,
    contentType: stringValue(data.content_type) ?? file.type,
    size: numberValue(data.size) ?? file.size,
    thumbnailUrl: stringValue(data.thumbnail_url),
  };
}

/**
 * Group Channel component.
 */
export default function GroupChannel({ surface = 'text' }: GroupChannelProps) {
  const { groupId, channelId } = useParams<{
    groupId: string;
    channelId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollToMessageId = searchParams.get('scrollTo');
  const currentUserId = useAuthStore((s) => s.user?.id);
  const copy = surfaceCopy[surface];

  const {
    groups,
    channelMessages,
    members,
    isLoadingMessages,
    typingUsers,
    hasMoreMessages,
    fetchChannelMessages,
    fetchGroup,
    fetchMembers,
    sendChannelMessage,
    setActiveChannel,
    updateChannelMessage,
    removeChannelMessage,
    toggleChannelReaction,
  } = useGroupStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChannelMessage | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Thread panel state
  const threadOpen = useChannelThreadStore((s) => s.activeThread !== null);
  const replyCounts = useChannelThreadStore((s) => s.replyCounts);
  const openThread = useChannelThreadStore((s) => s.openThread);
  const fetchReplyCounts = useChannelThreadStore((s) => s.fetchReplyCounts);

  const group = groups.find((g) => g.id === groupId);
  const channel = group ? findGroupChannel(group, channelId) : null;
  const messages = channelId ? (channelMessages[channelId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES;
  const typing = channelId ? typingUsers[channelId] || [] : [];
  const groupMembers = groupId ? members[groupId] || [] : [];
  const notificationLevel = group?.myMember?.notifications ?? 'mentions';
  const canManageMessages = Boolean(
    group &&
      currentUserId &&
      (group.ownerId === currentUserId ||
        group.myMember?.roles?.some(
          (role) =>
            (role.permissions & ADMINISTRATOR_PERMISSION) !== 0 ||
            (role.permissions & MANAGE_MESSAGES_PERMISSION) !== 0
        ))
  );

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return messages.filter((message) => message.content.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const scrollToMessage = useCallback((messageId: string) => {
    const target = document.getElementById(`group-message-${messageId}`);
    if (!target) return false;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
    }, 3000);

    return true;
  }, []);

  // Join channel and fetch data
  useEffect(() => {
    if (!channelId || !groupId) return;

    setActiveChannel(channelId);
    socketManager.joinGroupChannel(channelId);
    fetchChannelMessages(channelId);
    fetchMembers(groupId);
    // Reply counts fetched reactively after messages load

    return () => {
      setActiveChannel(null);
      socketManager.leaveGroupChannel(channelId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [channelId, groupId, setActiveChannel, fetchChannelMessages, fetchMembers]);

  useEffect(() => {
    setSearchQuery('');
    setActiveSearchIndex(0);
    setHighlightedMessageId(null);
  }, [channelId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Fetch thread reply counts when messages load
  useEffect(() => {
    if (!channelId || messages.length === 0) return;
    const messageIds = messages.map((m) => m.id);
    if (groupId) {
      fetchReplyCounts(groupId, channelId, messageIds);
    }
  }, [channelId, groupId, messages, fetchReplyCounts]);

  useEffect(() => {
    if (!scrollToMessageId || messages.length === 0) return;
    const exists = messages.some((message) => message.id === scrollToMessageId);
    if (!exists || !scrollToMessage(scrollToMessageId)) return;

    const next = new URLSearchParams(searchParams);
    next.delete('scrollTo');
    setSearchParams(next, { replace: true });
  }, [messages, scrollToMessage, scrollToMessageId, searchParams, setSearchParams]);

  useEffect(() => {
    if (searchMatches.length === 0) {
      setActiveSearchIndex(0);
      return;
    }
    setActiveSearchIndex((current) => Math.min(current, searchMatches.length - 1));
  }, [searchMatches.length]);

  useEffect(() => {
    const activeMatch = searchMatches[activeSearchIndex];
    if (activeMatch) {
      scrollToMessage(activeMatch.id);
    }
  }, [activeSearchIndex, scrollToMessage, searchMatches]);

  // Handle typing indicator
  function handleTyping() {
    if (!channelId) return;

    const topic = `group:${channelId}`;
    socketManager.sendTyping(topic, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(topic, false);
    }, 5000);
  }

  // Send message (with optional file attachment)
  async function handleSend(): Promise<void> {
    if (!channelId || (!messageInput.trim() && !attachment) || isSending) return;

    setIsSending(true);
    try {
      const trimmedContent = messageInput.trim();

      if (attachment) {
        const uploaded = await uploadAttachment(attachment);
        await sendChannelMessage(channelId, trimmedContent || uploaded.filename, replyTo?.id, {
          contentType: messageTypeForFile(attachment),
          fileUrl: uploaded.url,
          fileName: uploaded.filename,
          fileSize: uploaded.size,
          fileMimeType: uploaded.contentType,
          thumbnailUrl: uploaded.thumbnailUrl,
        });
      } else {
        await sendChannelMessage(channelId, trimmedContent, replyTo?.id);
      }

      setMessageInput('');
      setReplyTo(null);
      setAttachment(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`group:${channelId}`, false);
    } catch (error) {
      logger.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }

  // Handle key press
  function handleKeyPress(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Load more messages
  function handleLoadMore(): void {
    if (!channelId || !hasMoreMessages[channelId]) return;
    const oldestMessage = messages[0];
    if (oldestMessage) {
      fetchChannelMessages(channelId, oldestMessage.id);
    }
  }

  // Handle input change with typing indicator
  function handleInputChange(value: string): void {
    setMessageInput(value);
    handleTyping();
  }

  // Handle emoji select from message input picker
  function handleEmojiSelect(_emoji: string): void {
    // Emoji is inserted into input by MessageInput component directly.
    // This callback is reserved for analytics or haptic feedback.
  }

  // Handle reaction on a message
  function handleReaction(messageId: string, emoji: string): void {
    if (!channelId) return;
    toggleChannelReaction(channelId, messageId, emoji);
  }

  // Handle toggling an existing reaction
  function handleToggleReaction(messageId: string, emoji: string, _hasReacted: boolean): void {
    if (!channelId) return;
    toggleChannelReaction(channelId, messageId, emoji);
  }

  function pushGroupChannelEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    if (!channelId) {
      return Promise.reject(new Error('No active channel.'));
    }

    const socketChannel = socketManager.getChannel(`group:${channelId}`);
    if (!socketChannel || socketChannel.state !== 'joined') {
      return Promise.reject(new Error('Channel socket is not ready.'));
    }

    return new Promise((resolve, reject) => {
      socketChannel
        .push(event, payload)
        .receive('ok', () => resolve())
        .receive('error', (response: unknown) =>
          reject(new Error(groupActionErrorMessage(response)))
        )
        .receive('timeout', () => reject(new Error('Channel action timed out.')));
    });
  }

  async function handleEditMessage(message: ChannelMessage, content: string): Promise<void> {
    if (!channelId) return;
    const previous = message;
    const nextMessage = { ...message, content, isEdited: true };
    updateChannelMessage(nextMessage);

    try {
      await pushGroupChannelEvent('edit_message', {
        message_id: message.id,
        content,
      });
      toast.success('Message edited.');
    } catch (error) {
      updateChannelMessage(previous);
      logger.error('Failed to edit group message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to edit message.');
      throw error;
    }
  }

  async function handleDeleteMessage(message: ChannelMessage): Promise<void> {
    if (!channelId) return;
    try {
      await pushGroupChannelEvent('delete_message', { message_id: message.id });
      removeChannelMessage(message.id, channelId);
      toast.success('Message deleted.');
    } catch (error) {
      logger.error('Failed to delete group message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message.');
      throw error;
    }
  }

  async function handlePinMessage(message: ChannelMessage): Promise<void> {
    if (!groupId || !channelId || message.isPinned) return;
    try {
      await http.post(`/api/v1/groups/${groupId}/channels/${channelId}/pins`, {
        message_id: message.id,
      });
      updateChannelMessage({ ...message, isPinned: true });
      setShowPinned(true);
      toast.success('Message pinned.');
    } catch (error) {
      logger.error('Failed to pin group message:', error);
      toast.error('Failed to pin message.');
      throw error;
    }
  }

  async function handleReportMessage(message: ChannelMessage): Promise<void> {
    if (message.authorId === currentUserId) return;
    const description = window.prompt('Why are you reporting this message?');
    if (!description?.trim()) return;

    try {
      await http.post('/api/v1/reports', {
        report: {
          target_type: 'message',
          target_id: message.id,
          category: 'other',
          description: description.trim(),
        },
      });
      toast.success('Report submitted.');
    } catch (error) {
      logger.error('Failed to report group message:', error);
      toast.error('Failed to submit report.');
      throw error;
    }
  }

  async function handleCopyMessageLink(message: ChannelMessage): Promise<void> {
    const next = new URLSearchParams(window.location.search);
    next.set('scrollTo', message.id);
    const url = `${window.location.origin}${window.location.pathname}?${next.toString()}`;
    await navigator.clipboard.writeText(url);
    toast.success('Message link copied.');
  }

  function moveSearch(delta: number): void {
    if (searchMatches.length === 0) return;
    setActiveSearchIndex((current) => {
      const next = current + delta;
      if (next < 0) return searchMatches.length - 1;
      if (next >= searchMatches.length) return 0;
      return next;
    });
  }

  async function handleToggleNotifications(): Promise<void> {
    if (!groupId || isSavingNotifications) return;

    const nextLevel = notificationLevel === 'none' ? 'mentions' : 'none';
    setIsSavingNotifications(true);
    try {
      await http.patch(`/api/v1/groups/${groupId}/members/me/notifications`, {
        notifications: nextLevel,
        suppress_everyone: group?.myMember?.suppressEveryone ?? false,
      });
      await fetchGroup(groupId);
      toast.success(nextLevel === 'none' ? 'Group muted.' : 'Group notifications restored.');
    } catch (error) {
      logger.error('Failed to update group notifications:', error);
      toast.error('Failed to update group notifications.');
    } finally {
      setIsSavingNotifications(false);
    }
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // Group members by status
  const onlineMembers = groupMembers.filter((m) => m.user.status === 'online');
  const offlineMembers = groupMembers.filter((m) => m.user.status !== 'online');

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <ChannelHeader
          channelName={channel.name}
          channelTopic={channel.topic ?? undefined}
          channelType={copy.headerType}
          channelLabel={copy.label}
          isSearchOpen={showSearch}
          onToggleSearch={() => setShowSearch((current) => !current)}
          notificationLevel={notificationLevel}
          isSavingNotifications={isSavingNotifications}
          onToggleNotifications={handleToggleNotifications}
          showMembers={showMembers}
          onToggleMembers={() => setShowMembers(!showMembers)}
          showPinnedMessages={showPinned}
          onTogglePinnedMessages={() => setShowPinned(!showPinned)}
        />

        {showSearch && (
          <div className="bg-[var(--token-bg-secondary)]/70 flex h-12 items-center gap-2 border-b border-[var(--token-border-muted)] px-4">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search #${channel.name}`}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <span className="min-w-[92px] text-right text-xs text-gray-400">
              {searchQuery.trim().length < 2
                ? 'Type 2+ chars'
                : searchMatches.length > 0
                  ? `${activeSearchIndex + 1}/${searchMatches.length}`
                  : 'No results'}
            </span>
            <button
              onClick={() => moveSearch(-1)}
              disabled={searchMatches.length === 0}
              className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              title="Previous result"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => moveSearch(1)}
              disabled={searchMatches.length === 0}
              className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              title="Next result"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setHighlightedMessageId(null);
              }}
              className="rounded p-1 text-gray-400 hover:bg-white/[0.08] hover:text-white"
              title="Close search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <MessagesArea
          groupedMessages={groupedMessages}
          hasMoreMessages={hasMoreMessages[channelId || ''] || false}
          isLoadingMessages={isLoadingMessages}
          channelName={channel.name}
          typing={typing}
          messagesEndRef={messagesEndRef}
          onLoadMore={handleLoadMore}
          onReply={setReplyTo}
          onOpenThread={(msg) => groupId && channelId && openThread(groupId, channelId, msg)}
          onReport={handleReportMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onPinMessage={handlePinMessage}
          onCopyMessageLink={handleCopyMessageLink}
          onReaction={handleReaction}
          onToggleReaction={handleToggleReaction}
          threadReplyCounts={replyCounts}
          formatDateHeader={formatDateHeader}
          currentUserId={currentUserId}
          canManageMessages={canManageMessages}
          highlightedMessageId={highlightedMessageId}
        />

        <MessageInput
          channelName={channel.name}
          placeholder={`${copy.placeholderPrefix} #${channel.name}`}
          messageInput={messageInput}
          isSending={isSending}
          replyTo={replyTo}
          attachment={attachment}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onSend={handleSend}
          onCancelReply={() => setReplyTo(null)}
          onEmojiSelect={handleEmojiSelect}
          onFileSelect={setAttachment}
          onClearAttachment={() => setAttachment(null)}
        />
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <MembersSidebar onlineMembers={onlineMembers} offlineMembers={offlineMembers} />
      )}

      {/* Thread panel */}
      <AnimatePresence>{threadOpen && channelId && <ChannelThreadPanel />}</AnimatePresence>

      {/* Pinned messages panel */}
      <AnimatePresence>
        {showPinned && groupId && channelId && (
          <PinnedMessagesPanel
            groupId={groupId}
            channelId={channelId}
            channelMessages={messages}
            onClose={() => setShowPinned(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
