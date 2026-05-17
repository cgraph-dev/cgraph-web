/**
 * useEnhancedConversation hook - state and handlers for the conversation
 */

import { useCallback, useEffect, useRef, useState, useOptimistic } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { useMessageActions } from '@/modules/chat/hooks/useMessageActions';
import { useMessageRequestStore } from '@/modules/chat/store/message-request-store';
import { socketManager } from '@/lib/socket';
import { apiClient, http } from '@/lib/api-client';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  buildMessageAttachmentMetadata,
  messageContentTypeForMime,
  type UploadedMessageAttachment,
} from '@cgraph/shared-types';
import { getDirectCallRoute, type DirectCallType } from './call-routing';
import {
  uploadVoiceMessage,
  type UploadedVoiceMessage,
  type VoiceRecordingData,
} from './voice-message-upload';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import type { StickerSelection } from './types';
const logger = createLogger('EnhancedConversation');

interface PendingMessageRequest {
  requesterName: string;
  requesterAvatar: string | null;
  sharedGroupCount: number;
}

interface MessageScrollSnapshot {
  conversationId: string | null;
  lastMessageId: string | null;
  length: number;
}

const SCROLL_BOTTOM_THRESHOLD_PX = 96;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function pendingRequestInfo(value: unknown): PendingMessageRequest | null {
  if (!isRecord(value) || value.status !== 'pending' || !isRecord(value.requester)) {
    return null;
  }

  const requester = value.requester;
  const displayName = stringValue(requester.display_name);
  const username = stringValue(requester.username);

  return {
    requesterName: displayName ?? username ?? 'Unknown user',
    requesterAvatar: stringValue(requester.avatar_url),
    sharedGroupCount: numberValue(value.shared_group_count) ?? 0,
  };
}

function isNearScrollBottom(container: HTMLDivElement | null): boolean {
  if (!container) return true;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD_PX;
}

function sendConversationTyping(topic: string, isTyping: boolean): void {
  socketManager.sendTyping(topic, isTyping);

  if (import.meta.env.VITE_E2E_AUTH_BYPASS !== 'true') return;

  window.dispatchEvent(
    new CustomEvent('cgraph:e2e-typing', {
      detail: { topic, isTyping },
    })
  );
}

async function uploadAttachment(file: File): Promise<UploadedMessageAttachment> {
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
 * Hook for managing enhanced conversation.
 */
export function useEnhancedConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    typingUsers,
    sendMessage,
    fetchMessages,
    markAsRead,
    getRecipientId,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [messageRequest, setMessageRequest] = useState<PendingMessageRequest | null>(null);
  const messageActions = useMessageActions();
  const setRequestState = useMessageRequestStore((state) => state.setRequestState);
  const removeRequestState = useMessageRequestStore((state) => state.removeRequestState);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = useRef<MessageScrollSnapshot>({
    conversationId: null,
    lastMessageId: null,
    length: 0,
  });
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);

  const conversation = conversations.find((c) => c.id === conversationId);
  const scrollToMessageId = searchParams.get('scrollTo');
  const callRecipientId =
    conversationId && user?.id ? getRecipientId(conversationId, user.id) : null;
  const rawMessages = conversationId ? messages[conversationId] || [] : [];

  // React 19 useOptimistic: show sent messages immediately before the API responds.
  // When the store updates with the real server message, the optimistic overlay is discarded.
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    rawMessages,
    (state: readonly Message[], newMessage: Message) => [...state, newMessage]
  );
  const conversationMessages = optimisticMessages;
  const lastMessageId = conversationMessages.at(-1)?.id ?? null;
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  const scrollToLatestMessages = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
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

  useEffect(() => {
    if (!conversationId) {
      setMessageRequest(null);
      return;
    }

    let isActive = true;

    void apiClient.messageRequests
      .get(conversationId)
      .then((result) => {
        if (!isActive) return;

        if (!result.ok) {
          removeRequestState(conversationId);
          setMessageRequest(null);
          return;
        }

        const pending = pendingRequestInfo(result.data);
        if (pending) {
          setRequestState(conversationId, 'pending');
          setMessageRequest(pending);
          return;
        }

        removeRequestState(conversationId);
        setMessageRequest(null);
      })
      .catch((error: unknown) => {
        logger.warn('Failed to load message request state:', error);
      });

    return () => {
      isActive = false;
    };
  }, [conversationId, removeRequestState, setRequestState]);

  useEffect(() => {
    if (!conversationId) return;

    let isActive = true;

    void fetchMessages(conversationId)
      .then(() => markAsRead(conversationId))
      .catch((error: unknown) => {
        logger.warn('Failed to fetch conversation history:', error);
      });

    const join = () => {
      if (isActive) {
        socketManager.joinConversation(conversationId);
      }
    };

    if (socketManager.isConnected()) {
      join();
    } else {
      void socketManager
        .connect()
        .then(join)
        .catch((error: unknown) => {
          logger.warn('Failed to connect conversation socket:', error);
        });
    }

    return () => {
      isActive = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
      socketManager.leaveConversation(conversationId);
    };
  }, [conversationId, fetchMessages, markAsRead]);

  // Guarded autoscroll: keep users anchored when they are reading older messages.
  useEffect(() => {
    if (!conversationId) {
      scrollSnapshotRef.current = { conversationId: null, lastMessageId: null, length: 0 };
      setNewMessagesBelow(0);
      setShowScrollToLatest(false);
      return;
    }

    const previous = scrollSnapshotRef.current;
    const currentLength = conversationMessages.length;
    const conversationChanged = previous.conversationId !== conversationId;
    const firstLoadedBatch = previous.length === 0 && currentLength > 0;
    const addedMessages = Math.max(currentLength - previous.length, 0);
    const latestMessage = conversationMessages.at(-1);
    const latestMessageIsOwn = Boolean(
      latestMessage?.senderId && user?.id && latestMessage.senderId === user.id
    );

    scrollSnapshotRef.current = {
      conversationId,
      lastMessageId,
      length: currentLength,
    };

    if (currentLength === 0) {
      setNewMessagesBelow(0);
      setShowScrollToLatest(false);
      return;
    }

    if (scrollToMessageId) {
      return;
    }

    if (conversationChanged || firstLoadedBatch) {
      const frame = window.requestAnimationFrame(() => scrollToLatestMessages('auto'));
      return () => window.cancelAnimationFrame(frame);
    }

    if (addedMessages === 0 || previous.lastMessageId === lastMessageId) {
      return;
    }

    if (isNearScrollBottom(messagesScrollRef.current) || latestMessageIsOwn) {
      const frame = window.requestAnimationFrame(() => scrollToLatestMessages('smooth'));
      return () => window.cancelAnimationFrame(frame);
    }

    setNewMessagesBelow((count) => Math.min(999, count + addedMessages));
    setShowScrollToLatest(true);
    return undefined;
  }, [
    conversationId,
    conversationMessages,
    lastMessageId,
    scrollToLatestMessages,
    scrollToMessageId,
    user?.id,
  ]);

  useEffect(() => {
    if (!scrollToMessageId) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`message-${scrollToMessageId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setNewMessagesBelow(0);
      setShowScrollToLatest(!isNearScrollBottom(messagesScrollRef.current));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversationMessages.length, scrollToMessageId]);

  const handleMessageChange = (value: string) => {
    setMessageInput(value);
    if (value.trim()) setIsVoiceMode(false);
    if (!conversationId) return;

    const topic = `conversation:${conversationId}`;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!value.trim()) {
      sendConversationTyping(topic, false);
      return;
    }

    sendConversationTyping(topic, true);
    typingTimeoutRef.current = setTimeout(() => {
      sendConversationTyping(topic, false);
    }, 5000);
  };

  function addOptimisticVoiceMessage(uploaded: UploadedVoiceMessage) {
    if (!conversationId) return;

    addOptimisticMessage({
      id: uploaded.messageId ?? uploaded.id ?? `optimistic-voice-${Date.now()}`,
      conversationId,
      senderId: user?.id ?? '',
      content: '[Voice Message]',
      encryptedContent: null,
      isEncrypted: false,
      messageType: 'voice',
      replyToId: replyTo?.id ?? null,
      replyTo: null,
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
      reactions: [],
      sender: {
        id: user?.id ?? '',
        username: user?.username ?? '',
        displayName: user?.displayName ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      },
      deliveryStatus: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Message);
  }

  const handleVoiceComplete = async (recording: VoiceRecordingData) => {
    if (!conversationId || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);

    try {
      const uploaded = await uploadVoiceMessage(conversationId, recording);
      addOptimisticVoiceMessage(uploaded);
      setIsVoiceMode(false);
      setReplyTo(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
      await fetchMessages(conversationId).catch((error: unknown) => {
        logger.warn('Failed to refresh conversation after voice message:', error);
      });
    } catch (error) {
      logger.error('Failed to send voice message:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  async function sendRichMessage(
    content: string,
    contentType: Message['messageType'],
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!conversationId || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);

    try {
      addOptimisticMessage({
        id: `optimistic-${contentType}-${Date.now()}`,
        conversationId,
        senderId: user?.id ?? '',
        content,
        encryptedContent: null,
        isEncrypted: false,
        messageType: contentType,
        replyToId: replyTo?.id ?? null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,
        metadata: metadata satisfies Message['metadata'],
        reactions: [],
        sender: {
          id: user?.id ?? '',
          username: user?.username ?? '',
          displayName: user?.displayName ?? null,
          avatarUrl: user?.avatarUrl ?? null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies Message);
      window.requestAnimationFrame(() => scrollToLatestMessages('auto'));

      await sendMessage(conversationId, content, replyTo?.id, {
        type: contentType,
        metadata,
      });
      window.requestAnimationFrame(() => scrollToLatestMessages('smooth'));

      setMessageInput('');
      setReplyTo(null);
      setAttachment(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      logger.error('Failed to send rich message:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  }

  const handleGifSelect = (gif: GifResult) => {
    void sendRichMessage(gif.url, 'gif', {
      gifId: gif.id,
      gifTitle: gif.title,
      gifUrl: gif.url,
      gifPreviewUrl: gif.previewUrl,
      gifWidth: gif.width,
      gifHeight: gif.height,
      gifSource: gif.source,
    });
  };

  const handleStickerSelect = (sticker: StickerSelection) => {
    void sendRichMessage(sticker.emoji, 'sticker', {
      stickerId: sticker.id,
      stickerPackId: sticker.packId,
      stickerLabel: sticker.label,
      stickerEmoji: sticker.emoji,
    });
  };

  // Handle send message
  const handleSend = async () => {
    if (!conversationId || (!messageInput.trim() && !attachment) || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);
    let content = messageInput.trim();
    let contentType: Message['messageType'] = 'text';
    let metadata: Record<string, unknown> = {};

    try {
      if (attachment) {
        const uploaded = await uploadAttachment(attachment);
        content = content || uploaded.filename;
        contentType = messageContentTypeForMime(uploaded.contentType, uploaded.filename);
        metadata = buildMessageAttachmentMetadata(uploaded);
      }

      // Optimistic: show message in the list immediately with a sending indicator

      addOptimisticMessage({
        id: `optimistic-${Date.now()}`,
        conversationId,
        senderId: user?.id ?? '',
        content,
        encryptedContent: null,
        isEncrypted: false,
        messageType: contentType,
        replyToId: replyTo?.id ?? null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,

        metadata: metadata satisfies Message['metadata'],
        reactions: [],
        sender: {
          id: user?.id ?? '',
          username: user?.username ?? '',
          displayName: user?.displayName ?? null,
          avatarUrl: user?.avatarUrl ?? null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies Message);

      await sendMessage(conversationId, content, replyTo?.id, {
        type: contentType,
        metadata,
      });
      setMessageInput('');
      setReplyTo(null);
      setAttachment(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      logger.error('Failed to send message:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle avatar click
  const handleAvatarClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleStartCall = (callType: DirectCallType) => {
    const route = getDirectCallRoute(callRecipientId, callType);
    if (!route) return;

    HapticFeedback.medium();
    navigate(route);
  };

  const handleMessageRequestAccepted = () => {
    if (conversationId) removeRequestState(conversationId);
    setMessageRequest(null);
  };

  const handleMessageRequestRejected = () => {
    if (conversationId) removeRequestState(conversationId);
    setMessageRequest(null);
    navigate('/messages', { replace: true });
  };

  return {
    // Data
    conversationId,
    conversation,
    conversationMessages,
    typing,
    user,
    callRecipientId,
    messageRequest,
    // State
    messageInput,
    attachment,
    isVoiceMode,
    handleMessageChange,
    isSending,
    replyTo,
    setReplyTo,
    setAttachment,
    setIsVoiceMode,
    // Refs
    messagesEndRef,
    inputContainerRef,
    messagesScrollRef,
    // Handlers
    handleMessagesScroll,
    showScrollToLatest,
    newMessagesBelow,
    scrollToLatestMessages,
    handleSend,
    handleGifSelect,
    handleStickerSelect,
    handleVoiceComplete,
    handleAvatarClick,
    handleStartCall,
    handleMessageRequestAccepted,
    handleMessageRequestRejected,
    messageActions,
  };
}
