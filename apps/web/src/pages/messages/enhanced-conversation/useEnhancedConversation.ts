/**
 * useEnhancedConversation hook - state and handlers for the conversation
 */

import { useEffect, useRef, useState, useOptimistic } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { socketManager } from '@/lib/socket';
import { http } from '@/lib/api-client';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getDirectCallRoute, type DirectCallType } from './call-routing';
const logger = createLogger('EnhancedConversation');

interface UploadedAttachment {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  thumbnailUrl: string | null;
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

function messageTypeForFile(file: File): Message['messageType'] {
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
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

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
        contentType = messageTypeForFile(attachment);
        metadata = {
          fileUrl: uploaded.url,
          fileName: uploaded.filename,
          fileSize: uploaded.size,
          fileMimeType: uploaded.contentType,
          url: uploaded.url,
          filename: uploaded.filename,
          size: uploaded.size,
          mimeType: uploaded.contentType,
        };

        if (uploaded.thumbnailUrl) {
          metadata.thumbnailUrl = uploaded.thumbnailUrl;
        }
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

  return {
    // Data
    conversationId,
    conversation,
    conversationMessages,
    typing,
    user,
    callRecipientId,
    // State
    messageInput,
    attachment,
    handleMessageChange,
    isSending,
    replyTo,
    setReplyTo,
    setAttachment,
    // Refs
    messagesEndRef,
    inputContainerRef,
    // Handlers
    handleSend,
    handleAvatarClick,
    handleStartCall,
  };
}
