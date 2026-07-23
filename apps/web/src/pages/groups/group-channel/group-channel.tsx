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
import { uploadMessageAttachment } from '@/lib/uploads/message-attachment-upload';
import { buildMessageAttachmentSendPayload } from '@cgraph-dev/shared-types';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import { ScrollToBottomButton } from '@/modules/chat/components/scroll-to-bottom-button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { ChannelHeader } from './channel-header';
import { MessagesArea } from './messages-area';
import { MessageInput } from './message-input';
import { MembersSidebar } from './members-sidebar';
import { PinnedMessagesPanel } from './pinned-messages-panel';
import { ChannelThreadPanel } from './channel-thread-panel';
import { useChannelThreadStore } from '@/modules/groups/store/channelThreadStore';
import { findGroupChannel } from '@/modules/groups/routing';
import { formatDateHeader, groupMessagesByDate } from './utils';
import type { ChannelMessage, StickerSelection, VoiceRecordingData } from './types';

const logger = createLogger('GroupChannel');

type GroupChannelSurface = 'text' | 'announcement' | 'forum';
type NotificationLevel = 'all' | 'mentions' | 'none';

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

const EMPTY_MESSAGES: readonly ChannelMessage[] = [];
const ADMINISTRATOR_PERMISSION = 0x80000000;
const MANAGE_MESSAGES_PERMISSION = 1 << 7;
const SCROLL_BOTTOM_THRESHOLD_PX = 96;

interface GroupScrollSnapshot {
  channelId: string | null;
  lastMessageId: string | null;
  length: number;
}

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

function isNearScrollBottom(container: HTMLDivElement | null): boolean {
  if (!container) return true;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD_PX;
}

function isE2EChannelMessagePayload(
  value: unknown,
  channelId: string | undefined
): value is ChannelMessage {
  if (!channelId || !isRecord(value)) return false;

  return (
    value.channelId === channelId &&
    typeof value.id === 'string' &&
    typeof value.authorId === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    isRecord(value.author) &&
    Array.isArray(value.reactions)
  );
}

function getResponseStatus(error: unknown): number | null {
  if (!isRecord(error) || !isRecord(error.response)) return null;

  const status = error.response.status;
  return typeof status === 'number' ? status : null;
}

function getPinMessageError(error: unknown): string {
  if (getResponseStatus(error) === 403) {
    return 'You do not have permission to pin messages in this channel.';
  }

  return 'Failed to pin message.';
}

function notificationLevelFromPreference(
  preference: unknown,
  fallback: NotificationLevel
): NotificationLevel {
  if (!isRecord(preference) || typeof preference.id !== 'string') return fallback;

  const mode = preference.mode;
  if (mode === 'all' || mode === 'none') return mode;
  if (mode === 'mentions' || mode === 'mentions_only') return 'mentions';
  return fallback;
}

function notificationPreferenceMode(level: NotificationLevel): 'all' | 'mentions_only' | 'none' {
  if (level === 'mentions') return 'mentions_only';
  return level;
}

function dispatchE2EGroupChannelAction(
  topic: string,
  event: string,
  payload: Record<string, unknown>
): boolean {
  if (import.meta.env.VITE_E2E_AUTH_BYPASS !== 'true') return false;

  window.dispatchEvent(
    new CustomEvent('cgraph:e2e-group-channel-action', {
      detail: { topic, event, payload },
    })
  );
  return true;
}

interface UploadedChannelVoiceMessage {
  id: string | null;
  url: string;
  duration: number;
  waveform: number[];
  contentType: string;
  size: number;
  messageId: string | null;
}

function numberArrayValue(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;

  const numbers = value.filter((item): item is number => typeof item === 'number');
  return numbers.length === value.length ? numbers : null;
}

function voiceUploadMimeType(blob: Blob): string {
  if (blob.type.startsWith('audio/webm')) return 'audio/webm';
  return blob.type || 'audio/webm';
}

function voiceUploadFilename(mimeType: string): string {
  if (mimeType === 'audio/ogg') return 'voice-message.ogg';
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
    return 'voice-message.m4a';
  }
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'voice-message.mp3';
  if (mimeType === 'audio/wav') return 'voice-message.wav';
  return 'voice-message.webm';
}

async function uploadChannelVoiceMessage(
  channelId: string,
  recording: VoiceRecordingData
): Promise<UploadedChannelVoiceMessage> {
  const mimeType = voiceUploadMimeType(recording.blob);
  const audioFile = new File([recording.blob], voiceUploadFilename(mimeType), { type: mimeType });
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('channel_id', channelId);
  formData.append('duration', String(recording.duration));
  formData.append('waveform', JSON.stringify(recording.waveform));

  const response = await http.post('/api/v1/voice-messages', formData);
  const data = isRecord(response.data) && isRecord(response.data.data) ? response.data.data : null;
  const url = stringValue(data?.url);

  if (!data || !url) {
    throw new Error('Voice message response did not include a playback URL');
  }

  return {
    id: stringValue(data.id),
    url,
    duration: numberValue(data.duration) ?? recording.duration,
    waveform: numberArrayValue(data.waveform) ?? recording.waveform,
    contentType: stringValue(data.content_type) ?? mimeType,
    size: numberValue(data.size) ?? recording.blob.size,
    messageId: stringValue(data.message_id),
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
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id;
  const copy = surfaceCopy[surface];
  const isWideLayout = useMediaQuery('(min-width: 1280px)');

  const {
    groups,
    channelMessages,
    members,
    isLoadingMessages,
    typingUsers,
    hasMoreMessages,
    fetchChannelMessages,
    searchChannelMessages,
    fetchGroup,
    fetchMembers,
    sendChannelMessage,
    setActiveChannel,
    addChannelMessage,
    updateChannelMessage,
    removeChannelMessage,
    toggleChannelReaction,
  } = useGroupStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChannelMessage | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showMembers, setShowMembers] = useState(isWideLayout);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteSearchMatches, setRemoteSearchMatches] = useState<readonly ChannelMessage[]>([]);
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = useRef<GroupScrollSnapshot>({
    channelId: null,
    lastMessageId: null,
    length: 0,
  });
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);

  // Thread panel state
  const threadOpen = useChannelThreadStore((s) => s.activeThread !== null);
  const replyCounts = useChannelThreadStore((s) => s.replyCounts);
  const openThread = useChannelThreadStore((s) => s.openThread);
  const fetchReplyCounts = useChannelThreadStore((s) => s.fetchReplyCounts);

  useEffect(() => {
    setShowMembers(isWideLayout);
  }, [isWideLayout]);

  const group = groups.find((g) => g.id === groupId);
  const channel = group ? findGroupChannel(group, channelId) : null;
  const messages = channelId ? (channelMessages[channelId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES;
  const lastMessageId = messages.at(-1)?.id ?? null;
  const typing = channelId ? typingUsers[channelId] || [] : [];
  const groupMembers = groupId ? members[groupId] || [] : [];
  const groupNotificationLevel = group?.myMember?.notifications ?? 'mentions';
  const [channelNotificationLevel, setChannelNotificationLevel] =
    useState<NotificationLevel>(groupNotificationLevel);
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

  const localSearchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return messages.filter((message) => message.content.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const searchMatches = useMemo(() => {
    if (remoteSearchMatches.length === 0) return localSearchMatches;

    const seen = new Set(localSearchMatches.map((message) => message.id));
    return [
      ...localSearchMatches,
      ...remoteSearchMatches.filter((message) => !seen.has(message.id)),
    ];
  }, [localSearchMatches, remoteSearchMatches]);

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

  const scrollToLatestMessages = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setNewMessagesBelow(0);
    setShowScrollToLatest(false);
  }, []);

  const handleMessagesScroll = useCallback(() => {
    if (isNearScrollBottom(messagesScrollRef.current)) {
      setNewMessagesBelow(0);
      setShowScrollToLatest(false);
      return;
    }

    setShowScrollToLatest(true);
  }, []);

  // Join channel and fetch data
  useEffect(() => {
    if (!channelId || !groupId) return;
    let cancelled = false;

    setActiveChannel(channelId);
    socketManager.joinGroupChannel(channelId);

    void (async () => {
      try {
        await fetchGroup(groupId);
        if (cancelled) return;
        await Promise.all([fetchChannelMessages(channelId), fetchMembers(groupId)]);
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load group channel:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      setActiveChannel(null);
      socketManager.leaveGroupChannel(channelId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [channelId, groupId, setActiveChannel, fetchGroup, fetchChannelMessages, fetchMembers]);

  useEffect(() => {
    setSearchQuery('');
    setRemoteSearchMatches([]);
    setSearchError(null);
    setActiveSearchIndex(0);
    setHighlightedMessageId(null);
  }, [channelId]);

  useEffect(() => {
    const query = searchQuery.trim();
    setRemoteSearchMatches([]);
    setSearchError(null);

    if (!channelId || query.length < 2) {
      setIsSearchingChannel(false);
      return;
    }

    let cancelled = false;
    setIsSearchingChannel(true);

    const timeoutId = window.setTimeout(() => {
      void searchChannelMessages(channelId, query)
        .then((results) => {
          if (!cancelled) {
            setRemoteSearchMatches(results);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            logger.error('Failed to search channel messages:', error);
            setSearchError('Search unavailable');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearchingChannel(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [channelId, searchChannelMessages, searchQuery]);

  // Guarded autoscroll keeps older-message anchors stable while still following live/latest chat.
  useEffect(() => {
    if (!channelId) {
      scrollSnapshotRef.current = { channelId: null, lastMessageId: null, length: 0 };
      setNewMessagesBelow(0);
      setShowScrollToLatest(false);
      return undefined;
    }

    const previous = scrollSnapshotRef.current;
    const currentLength = messages.length;
    const channelChanged = previous.channelId !== channelId;
    const firstLoadedBatch = previous.length === 0 && currentLength > 0;
    const addedMessages = Math.max(currentLength - previous.length, 0);
    const latestMessage = messages.at(-1);
    const latestMessageIsOwn = Boolean(
      latestMessage?.authorId && currentUserId && latestMessage.authorId === currentUserId
    );

    scrollSnapshotRef.current = {
      channelId,
      lastMessageId,
      length: currentLength,
    };

    if (currentLength === 0) {
      setNewMessagesBelow(0);
      setShowScrollToLatest(false);
      return undefined;
    }

    if (scrollToMessageId) {
      return undefined;
    }

    if (channelChanged || firstLoadedBatch) {
      const frame = window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        setNewMessagesBelow(0);
        setShowScrollToLatest(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (addedMessages === 0 || previous.lastMessageId === lastMessageId) {
      return undefined;
    }

    if (isNearScrollBottom(messagesScrollRef.current) || latestMessageIsOwn) {
      const frame = window.requestAnimationFrame(() => scrollToLatestMessages());
      return () => window.cancelAnimationFrame(frame);
    }

    setNewMessagesBelow((count) => Math.min(999, count + addedMessages));
    setShowScrollToLatest(true);
    return undefined;
  }, [
    channelId,
    currentUserId,
    lastMessageId,
    messages,
    scrollToLatestMessages,
    scrollToMessageId,
  ]);

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

    setNewMessagesBelow(0);
    setShowScrollToLatest(scrollToMessageId !== lastMessageId);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('scrollTo');
    setSearchParams(nextSearchParams, { replace: true });
  }, [lastMessageId, messages, scrollToMessage, scrollToMessageId, searchParams, setSearchParams]);

  useEffect(() => {
    if (import.meta.env.VITE_E2E_AUTH_BYPASS !== 'true') return undefined;

    const handleE2EAddGroupMessage = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      if (!isE2EChannelMessagePayload(event.detail, channelId)) return;
      addChannelMessage(event.detail);
    };

    window.addEventListener('cgraph:e2e-add-group-message', handleE2EAddGroupMessage);
    return () =>
      window.removeEventListener('cgraph:e2e-add-group-message', handleE2EAddGroupMessage);
  }, [addChannelMessage, channelId]);

  useEffect(() => {
    if (!channelId) {
      setChannelNotificationLevel(groupNotificationLevel);
      return;
    }

    let cancelled = false;
    setChannelNotificationLevel(groupNotificationLevel);

    void (async () => {
      try {
        const response = await http.get(`/api/v1/notification-preferences/channel/${channelId}`);
        const data = isRecord(response.data) ? response.data.data : null;
        const preference = isRecord(data) ? data.preference : null;
        if (!cancelled) {
          setChannelNotificationLevel(
            notificationLevelFromPreference(preference, groupNotificationLevel)
          );
        }
      } catch (error) {
        logger.error('Failed to load channel notification preference:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId, groupNotificationLevel]);

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
      const didScroll = scrollToMessage(activeMatch.id);
      if (!didScroll) {
        addChannelMessage(activeMatch);
        window.setTimeout(() => scrollToMessage(activeMatch.id), 0);
      }
    }
  }, [activeSearchIndex, addChannelMessage, scrollToMessage, searchMatches]);

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
        const uploaded = await uploadMessageAttachment(attachment, { context: 'message' });
        await sendChannelMessage(
          channelId,
          trimmedContent || uploaded.filename,
          replyTo?.id,
          buildMessageAttachmentSendPayload(uploaded)
        );
      } else {
        await sendChannelMessage(channelId, trimmedContent, replyTo?.id);
      }

      setMessageInput('');
      setReplyTo(null);
      setAttachment(null);
      setIsVoiceMode(false);

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

  async function sendRichChannelMessage(
    content: string,
    contentType: ChannelMessage['messageType'],
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!channelId || isSending) return;

    setIsSending(true);
    try {
      await sendChannelMessage(channelId, content, replyTo?.id, {
        contentType,
        metadata,
      });
      setMessageInput('');
      setReplyTo(null);
      setAttachment(null);
      setIsVoiceMode(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`group:${channelId}`, false);
    } catch (error) {
      logger.error('Failed to send rich group message:', error);
    } finally {
      setIsSending(false);
    }
  }

  function handleGifSelect(gif: GifResult): void {
    void sendRichChannelMessage(gif.url, 'gif', {
      gifId: gif.id,
      gifTitle: gif.title,
      gifUrl: gif.url,
      gifPreviewUrl: gif.previewUrl,
      gifWidth: gif.width,
      gifHeight: gif.height,
      gifSource: gif.source,
    });
  }

  function handleStickerSelect(sticker: StickerSelection): void {
    void sendRichChannelMessage(sticker.emoji, 'sticker', {
      stickerId: sticker.id,
      stickerPackId: sticker.packId,
      stickerLabel: sticker.label,
      stickerEmoji: sticker.emoji,
    });
  }

  async function handleVoiceComplete(recording: VoiceRecordingData): Promise<void> {
    if (!channelId || isSending) return;

    setIsSending(true);
    try {
      const uploaded = await uploadChannelVoiceMessage(channelId, recording);
      addChannelMessage({
        id: uploaded.messageId ?? `group-voice-${Date.now()}`,
        channelId,
        authorId: currentUserId ?? '',
        author: {
          id: currentUserId ?? '',
          username: currentUser?.username ?? 'You',
          displayName: currentUser?.displayName ?? currentUser?.username ?? 'You',
          avatarUrl: currentUser?.avatarUrl ?? null,
          member: null,
          avatarBorderId: currentUser?.avatarBorderId ?? null,
          equippedTitleId: currentUser?.equippedTitleId ?? null,
          equippedBadgeIds: currentUser?.equippedBadgeIds ?? [],
          equippedNameplateId: currentUser?.equippedNameplateId ?? null,
          profileTheme: currentUser?.profileTheme ?? null,
          chatTheme: currentUser?.chatTheme ?? null,
          displayNameFont: currentUser?.displayNameFont ?? null,
          displayNameEffect: currentUser?.displayNameEffect ?? null,
          displayNameColor: currentUser?.displayNameColor ?? null,
          displayNameSecondaryColor: currentUser?.displayNameSecondaryColor ?? null,
        },
        content: '[Voice Message]',
        messageType: 'voice',
        replyToId: replyTo?.id ?? null,
        replyTo,
        isPinned: false,
        isEdited: false,
        deletedAt: null,
        metadata: {
          url: uploaded.url,
          filename: 'voice-message.webm',
          size: uploaded.size,
          mimeType: uploaded.contentType,
          duration: uploaded.duration,
          waveform: uploaded.waveform,
          voiceMessageId: uploaded.id,
        },
        fileUrl: uploaded.url,
        fileName: 'voice-message.webm',
        fileSize: uploaded.size,
        fileMimeType: uploaded.contentType,
        thumbnailUrl: null,
        reactions: [],
        createdAt: new Date().toISOString(),
      });
      setReplyTo(null);
      setIsVoiceMode(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`group:${channelId}`, false);
    } catch (error) {
      logger.error('Failed to send group voice message:', error);
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
      if (dispatchE2EGroupChannelAction(`group:${channelId}`, event, payload)) {
        return Promise.resolve();
      }
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
      toast.error(getPinMessageError(error));
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
    if (!channelId || isSavingNotifications) return;

    const previousLevel = channelNotificationLevel;
    const nextLevel = channelNotificationLevel === 'none' ? 'mentions' : 'none';
    setIsSavingNotifications(true);
    setChannelNotificationLevel(nextLevel);
    try {
      await http.put(`/api/v1/notification-preferences/channel/${channelId}`, {
        mode: notificationPreferenceMode(nextLevel),
        muted_until: null,
      });
      toast.success(nextLevel === 'none' ? 'Channel muted.' : 'Channel notifications restored.');
    } catch (error) {
      setChannelNotificationLevel(previousLevel);
      logger.error('Failed to update channel notifications:', error);
      toast.error('Failed to update channel notifications.');
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
    <div className="relative flex min-w-0 flex-1 overflow-hidden">
      {/* Main content */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <ChannelHeader
          channelName={channel.name}
          channelTopic={channel.topic ?? undefined}
          channelType={copy.headerType}
          channelLabel={copy.label}
          isSearchOpen={showSearch}
          onToggleSearch={() => setShowSearch((current) => !current)}
          notificationLevel={channelNotificationLevel}
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
                : isSearchingChannel
                  ? 'Searching...'
                  : searchError
                    ? searchError
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
          messagesScrollRef={messagesScrollRef}
          newMessagesBelow={newMessagesBelow}
          onScroll={handleMessagesScroll}
          onJumpToLatest={scrollToLatestMessages}
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

        <ScrollToBottomButton
          visible={showScrollToLatest}
          newCount={newMessagesBelow}
          onClick={scrollToLatestMessages}
        />

        <MessageInput
          channelName={channel.name}
          placeholder={`${copy.placeholderPrefix} #${channel.name}`}
          messageInput={messageInput}
          isSending={isSending}
          replyTo={replyTo}
          attachment={attachment}
          isVoiceMode={isVoiceMode}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onSend={handleSend}
          onVoiceModeChange={setIsVoiceMode}
          onCancelReply={() => setReplyTo(null)}
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
          onStickerSelect={handleStickerSelect}
          onVoiceComplete={(recording) => void handleVoiceComplete(recording)}
          onFileSelect={setAttachment}
          onClearAttachment={() => setAttachment(null)}
        />
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <MembersSidebar
          onlineMembers={onlineMembers}
          offlineMembers={offlineMembers}
          onClose={() => setShowMembers(false)}
        />
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
            onUnpin={(pin) => {
              const message = messages.find((candidate) => candidate.id === pin.message_id);
              if (message) {
                updateChannelMessage({ ...message, isPinned: false });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
