/**
 * useEnhancedConversation hook - state and handlers for the conversation
 */

import { useEffect, useRef, useState, useOptimistic } from 'react';
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
const logger = createLogger('EnhancedConversation');

interface PendingMessageRequest {
  requesterName: string;
  requesterAvatar: string | null;
  sharedGroupCount: number;
}

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
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

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
      socketManager.sendTyping(`conversation:${conversationId}`, false);
      socketManager.leaveConversation(conversationId);
    };
  }, [conversationId, fetchMessages, markAsRead]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  useEffect(() => {
    if (!scrollToMessageId) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`message-${scrollToMessageId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      socketManager.sendTyping(topic, false);
      return;
    }

    socketManager.sendTyping(topic, true);
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(topic, false);
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
      socketManager.sendTyping(`conversation:${conversationId}`, false);
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
      socketManager.sendTyping(`conversation:${conversationId}`, false);
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
    // Handlers
    handleSend,
    handleVoiceComplete,
    handleAvatarClick,
    handleStartCall,
    handleMessageRequestAccepted,
    handleMessageRequestRejected,
    messageActions,
  };
}
