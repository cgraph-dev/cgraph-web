/**
 * useEnhancedConversation hook - state and handlers for the conversation
 */

import { useEffect, useRef, useState, useOptimistic } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { socketManager } from '@/lib/socket';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getDirectCallRoute, type DirectCallType } from './call-routing';
const logger = createLogger('EnhancedConversation');

/**
 * Hook for managing enhanced conversation.
 */
export function useEnhancedConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, messages, typingUsers, sendMessage, fetchMessages, getRecipientId } =
    useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
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

    void fetchMessages(conversationId).catch((error: unknown) => {
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
      socketManager.leaveConversation(conversationId);
    };
  }, [conversationId, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Handle send message
  const handleSend = async () => {
    if (!conversationId || !messageInput.trim() || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);
    const content = messageInput.trim();

    // Optimistic: show message in the list immediately with a sending indicator

    addOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      conversationId,
      senderId: user?.id ?? '',
      content,
      encryptedContent: null,
      isEncrypted: false,
      messageType: 'text',
      replyToId: replyTo?.id ?? null,
      replyTo: null,
      isPinned: false,
      isEdited: false,
      deletedAt: null,

      metadata: {} satisfies Message['metadata'], // empty metadata for optimistic message
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

    try {
      await sendMessage(conversationId, content, replyTo?.id);
      setMessageInput('');
      setReplyTo(null);

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
    setMessageInput,
    isSending,
    replyTo,
    setReplyTo,
    // Refs
    messagesEndRef,
    inputContainerRef,
    // Handlers
    handleSend,
    handleAvatarClick,
    handleStartCall,
  };
}
