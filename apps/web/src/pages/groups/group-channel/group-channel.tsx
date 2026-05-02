/**
 * GroupChannel Page Component
 *
 * Displays a group text channel with messages, members sidebar,
 * and input for sending new messages.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
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
import { formatDateHeader, groupMessagesByDate } from './utils';
import type { ChannelMessage } from './types';

const logger = createLogger('GroupChannel');

export default function GroupChannel() {
  const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const {
    groups,
    channelMessages,
    members,
    isLoadingMessages,
    typingUsers,
    hasMoreMessages,
    fetchChannelMessages,
    fetchMembers,
    sendChannelMessage,
    setActiveChannel,
    toggleChannelReaction,
  } = useGroupStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChannelMessage | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [showPinned, setShowPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Thread panel state
  const threadOpen = useChannelThreadStore((s) => s.activeThread !== null);
  const replyCounts = useChannelThreadStore((s) => s.replyCounts);
  const openThread = useChannelThreadStore((s) => s.openThread);
  const fetchReplyCounts = useChannelThreadStore((s) => s.fetchReplyCounts);

  const group = groups.find((g) => g.id === groupId);
  const channel = group?.channels?.find((c) => c.id === channelId);
  const messages = channelId ? channelMessages[channelId] || [] : [];
  const typing = channelId ? typingUsers[channelId] || [] : [];
  const groupMembers = groupId ? members[groupId] || [] : [];

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
    };
  }, [channelId, groupId, setActiveChannel, fetchChannelMessages, fetchMembers]);

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
    fetchReplyCounts(channelId, messageIds);
  }, [channelId, messages.length, fetchReplyCounts]);

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
      if (attachment) {
        // Upload file with message via multipart/form-data
        const formData = new FormData();
        formData.append('file', attachment);
        if (messageInput.trim()) {
          formData.append('content', messageInput.trim());
        }
        if (replyTo?.id) {
          formData.append('reply_to_id', replyTo.id);
        }
        await http.post(`/api/v1/channels/${channelId}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await sendChannelMessage(channelId, messageInput.trim(), replyTo?.id);
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
          showMembers={showMembers}
          onToggleMembers={() => setShowMembers(!showMembers)}
          showPinnedMessages={showPinned}
          onTogglePinnedMessages={() => setShowPinned(!showPinned)}
        />

        <MessagesArea
          groupedMessages={groupedMessages}
          hasMoreMessages={hasMoreMessages[channelId || ''] || false}
          isLoadingMessages={isLoadingMessages}
          channelName={channel.name}
          typing={typing}
          messagesEndRef={messagesEndRef}
          onLoadMore={handleLoadMore}
          onReply={setReplyTo}
          onOpenThread={(msg) => channelId && openThread(channelId, msg)}
          onReaction={handleReaction}
          onToggleReaction={handleToggleReaction}
          threadReplyCounts={replyCounts}
          formatDateHeader={formatDateHeader}
          currentUserId={currentUserId}
        />

        <MessageInput
          channelName={channel.name}
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
