/**
 * Cloud conversation controller.
 *
 * Owns backend data, socket lifecycle, composer payloads, uploads, and routed
 * action handlers for direct Cloud Chat conversations. Page components should
 * render slots from this controller instead of composing chat API actions
 * themselves.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { useMessageActions } from '@/modules/chat/hooks/useMessageActions';
import { useMessageRequest } from '@/modules/chat/hooks/use-message-request';
import { socketManager } from '@/lib/socket';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { publicProfilePath } from '@/lib/profile-route';
import { toast } from '@/shared/components/ui';
import { buildMessageAttachmentMetadata, messageContentTypeForMime } from '@cgraph-dev/shared-types';
import { uploadMessageAttachment } from '@/lib/uploads/message-attachment-upload';
import type { MessagePayload } from '@/modules/chat/components/message-input';
import {
  buildPrivateCloudChatAttachmentMetadata,
  shouldUsePrivateCloudChatAttachment,
} from '@/modules/chat/media/cloud-chat-attachment';
import { getDirectCallRoute, type DirectCallType } from './direct-call-routing';
import { uploadVoiceMessage, type VoiceRecordingData } from './voice-message-upload';
const logger = createLogger('CloudConversationController');

interface MessageScrollSnapshot {
  conversationId: string | null;
  lastMessageId: string | null;
  length: number;
}

const SCROLL_BOTTOM_THRESHOLD_PX = 96;
const OPTIMISTIC_ATTACHMENT_URL_TTL_MS = 30_000;
const EMPTY_MESSAGES: readonly Message[] = [];

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

function videoNoteMimeType(blob: Blob): string {
  if (blob.type.startsWith('video/webm')) return blob.type;
  return blob.type || 'video/webm';
}

function videoNoteFilename(mimeType: string): string {
  if (mimeType === 'video/mp4') return 'video-note.mp4';
  return 'video-note.webm';
}

/**
 * Hook for managing the routed Cloud Chat conversation owner.
 */
export function useCloudConversationController() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    messageHistoryErrors,
    typingUsers,
    sendMessage,
    fetchMessages,
    markAsRead,
    getRecipientId,
    setActiveConversation,
  } = useChatStore();

  const [attachmentNodePrice, setAttachmentNodePrice] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messageActions = useMessageActions();
  const conversation = conversations.find((c) => c.id === conversationId);
  const currentParticipantRequestStatus =
    conversation?.participants.find((participant) => participant.userId === user?.id)
      ?.messageRequestStatus;
  const messageRequest = useMessageRequest(conversationId, currentParticipantRequestStatus);

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

  const scrollToMessageId = searchParams.get('scrollTo');
  const callRecipientId =
    conversationId && user?.id ? getRecipientId(conversationId, user.id) : null;
  const conversationMessages = conversationId
    ? (messages[conversationId] ?? EMPTY_MESSAGES)
    : EMPTY_MESSAGES;
  const messageHistoryError = conversationId ? (messageHistoryErrors[conversationId] ?? null) : null;
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
    if (!conversationId) return;

    let isActive = true;
    setActiveConversation(conversationId);

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
      if (useChatStore.getState().activeConversationId === conversationId) {
        setActiveConversation(null);
      }
    };
  }, [conversationId, fetchMessages, markAsRead, setActiveConversation]);

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

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;

      const topic = `conversation:${conversationId}`;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      sendConversationTyping(topic, isTyping);

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          sendConversationTyping(topic, false);
        }, 5000);
      }
    },
    [conversationId]
  );

  const handleVoiceComplete = async (recording: VoiceRecordingData) => {
    if (!conversationId || isUploading) return;

    HapticFeedback.medium();
    setIsUploading(true);

    try {
      await uploadVoiceMessage(conversationId, recording);
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
      toast.error('Voice message not sent', getErrorMessage(error));
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  async function sendRichMessage(
    content: string,
    contentType: Message['messageType'],
    metadata: Record<string, unknown>,
    replyToId?: string
  ): Promise<void> {
    if (!conversationId) return;

    HapticFeedback.medium();

    try {
      const pendingSend = sendMessage(conversationId, content, replyToId ?? replyTo?.id, {
        type: contentType,
        metadata,
      });
      setReplyTo(null);
      setAttachmentNodePrice(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
      await pendingSend;
    } catch (error) {
      logger.error('Failed to send rich message:', error);
      HapticFeedback.error();
    }
  }

  async function handleComposerPayload(payload: MessagePayload): Promise<void> {
    if (!conversationId) return;

    const payloadMetadata = payload.metadata ?? {};

    if (payload.type === 'voice') {
      const audio = payloadMetadata.audio;
      if (!(audio instanceof Blob)) {
        logger.error('Voice composer payload did not include an audio blob');
        HapticFeedback.error();
        return;
      }

      await handleVoiceComplete({
        blob: audio,
        duration: typeof payloadMetadata.duration === 'number' ? payloadMetadata.duration : 0,
        waveform: Array.isArray(payloadMetadata.waveform)
          ? payloadMetadata.waveform.filter((value): value is number => typeof value === 'number')
          : [],
      });
      return;
    }

    if (payload.type === 'video') {
      if (isUploading) return;

      const video = payloadMetadata.video;
      if (!(video instanceof Blob)) {
        logger.error('Video-note composer payload did not include a video blob');
        HapticFeedback.error();
        return;
      }

      HapticFeedback.medium();
      setIsUploading(true);

      try {
        const mimeType = videoNoteMimeType(video);
        const videoFile = new File([video], videoNoteFilename(mimeType), { type: mimeType });
        const uploaded = await uploadMessageAttachment(videoFile, { context: 'message' });
        const metadata = {
          ...buildMessageAttachmentMetadata(uploaded),
          duration: typeof payloadMetadata.duration === 'number' ? payloadMetadata.duration : 0,
          isVideoNote: true,
        };
        const content = uploaded.filename;

        const pendingSend = sendMessage(conversationId, content, payload.replyToId ?? replyTo?.id, {
          type: 'video',
          metadata,
        });
        setReplyTo(null);
        setAttachmentNodePrice(null);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendConversationTyping(`conversation:${conversationId}`, false);
        await pendingSend;
      } catch (error) {
        logger.error('Failed to send video note:', error);
        HapticFeedback.error();
        toast.error('Video note not sent', getErrorMessage(error));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (payload.type === 'gif') {
      await sendRichMessage(
        String(payloadMetadata.gifUrl ?? payload.content),
        'gif',
        payloadMetadata,
        payload.replyToId
      );
      return;
    }

    if (payload.type === 'sticker') {
      await sendRichMessage(payload.content, 'sticker', payloadMetadata, payload.replyToId);
      return;
    }

    const attachment = payload.attachments?.[0] ?? null;
    if (!payload.content.trim() && !attachment) return;
    if (attachment && isUploading) return;

    HapticFeedback.medium();
    if (attachment) setIsUploading(true);
    let content = payload.content.trim();
    let contentType: Message['messageType'] = 'text';
    let metadata: Record<string, unknown> = payload.isViewOnce
      ? {
          is_view_once: true,
          isViewOnce: true,
        }
      : {};
    let optimisticAttachmentUrl: string | null = null;

    try {
      if (attachment) {
        const usePrivateUpload = shouldUsePrivateCloudChatAttachment(attachment, {
          isPaid: attachmentNodePrice !== null,
          isViewOnce: payload.isViewOnce === true,
        });
        const uploaded = await uploadMessageAttachment(attachment, {
          context: usePrivateUpload ? 'cloud_chat' : 'message',
        });
        content = content || uploaded.filename;
        contentType = messageContentTypeForMime(uploaded.contentType, uploaded.filename);

        if (usePrivateUpload) {
          optimisticAttachmentUrl = URL.createObjectURL(attachment);
          metadata = buildPrivateCloudChatAttachmentMetadata(uploaded, optimisticAttachmentUrl);
        } else {
          metadata = buildMessageAttachmentMetadata(uploaded);
        }

        if (attachmentNodePrice !== null) {
          if (!callRecipientId) {
            throw new Error('Paid file attachments require a direct Cloud Chat recipient.');
          }

          const paidFile = await apiClient.paidDms.sendFile({
            receiver_id: callRecipientId,
            file_url: uploaded.url,
            file_type: uploaded.contentType,
            nodes_price: attachmentNodePrice,
          });

          if (!paidFile.ok) {
            throw new Error(paidFile.error.message);
          }

          metadata = {
            ...metadata,
            paid_dm_file_id: paidFile.data.id,
            paidDmFileId: paidFile.data.id,
            paid_dm_expires_at: paidFile.data.expires_at,
            paidDmExpiresAt: paidFile.data.expires_at,
            nodes_price: paidFile.data.nodes_required,
            nodesPrice: paidFile.data.nodes_required,
            is_file_locked: true,
            isFileLocked: true,
          };
        }
      }

      const pendingSend = sendMessage(conversationId, content, replyTo?.id, {
        type: contentType,
        metadata,
      });
      setReplyTo(null);
      setAttachmentNodePrice(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendConversationTyping(`conversation:${conversationId}`, false);
      await pendingSend;
    } catch (error) {
      logger.error('Failed to send message:', error);
      HapticFeedback.error();
      toast.error('Message not sent', getErrorMessage(error));
    } finally {
      if (optimisticAttachmentUrl) {
        const url = optimisticAttachmentUrl;
        window.setTimeout(() => URL.revokeObjectURL(url), OPTIMISTIC_ATTACHMENT_URL_TTL_MS);
      }
      if (attachment) setIsUploading(false);
    }
  }

  // Handle avatar click
  const handleAvatarClick = (userId: string) => {
    navigate(publicProfilePath({ id: userId }));
  };

  const handleStartCall = (callType: DirectCallType) => {
    const route = getDirectCallRoute(callRecipientId, callType);
    if (!route) return;

    HapticFeedback.medium();
    navigate(route);
  };

  const handleMessageRequestDeleted = () => {
    navigate('/messages', { replace: true });
  };

  const handleBackToMessages = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const retryMessageHistory = useCallback(() => {
    if (!conversationId) return;

    void fetchMessages(conversationId).catch((error: unknown) => {
      logger.warn('Failed to retry conversation history:', error);
    });
  }, [conversationId, fetchMessages]);

  return {
    // Data
    conversationId,
    conversation,
    conversationMessages,
    scrollToMessageId,
    typing,
    user,
    callRecipientId,
    messageRequest,
    messageHistoryError,
    // State
    attachmentNodePrice,
    isUploading,
    replyTo,
    setReplyTo,
    setAttachmentNodePrice,
    // Refs
    messagesEndRef,
    inputContainerRef,
    messagesScrollRef,
    // Handlers
    handleMessagesScroll,
    showScrollToLatest,
    newMessagesBelow,
    scrollToLatestMessages,
    handleTyping,
    handleComposerPayload,
    handleAvatarClick,
    handleStartCall,
    handleBackToMessages,
    handleMessageRequestDeleted,
    retryMessageHistory,
    messageActions,
  };
}
