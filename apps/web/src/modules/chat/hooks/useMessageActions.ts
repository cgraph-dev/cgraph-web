import { useState } from 'react';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { http } from '@/lib/api-client';
import { toast } from '@/components/feedback/toast';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const logger = createLogger('MessageActions');

export interface ForwardMessageState {
  messageToForward: Message | null;
  showForwardModal: boolean;
}

export interface ForwardMessageHandlers {
  handleOpenForward: (message: Message, enableHaptic?: boolean) => void;
  handleCloseForward: () => void;
  handleForwardMessage: (conversationIds: string[], enableHaptic?: boolean) => Promise<void>;
  handleForwardMessages: (
    messages: readonly Message[],
    conversationIds: string[],
    enableHaptic?: boolean
  ) => Promise<void>;
}

export interface UseForwardMessageReturn extends ForwardMessageState, ForwardMessageHandlers {}

/**
 *
 * Description.
 */
export function useForwardMessage(closeMenu: () => void): UseForwardMessageReturn {
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleOpenForward = (message: Message, enableHaptic = false) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    closeMenu();
    if (enableHaptic) HapticFeedback.medium();
  };

  const handleCloseForward = () => {
    setShowForwardModal(false);
    setMessageToForward(null);
  };

  const handleForwardMessage = async (conversationIds: string[], enableHaptic = false) => {
    if (!messageToForward) return;

    try {
      await http.post(`/api/v1/messages/${messageToForward.id}/forward`, {
        conversation_ids: conversationIds,
      });

      const count = conversationIds.length;
      toast.success(`Message forwarded to ${count} conversation${count > 1 ? 's' : ''}`);
      if (enableHaptic) HapticFeedback.success();
      handleCloseForward();
    } catch (error) {
      logger.warn('Failed to forward message:', error);
      toast.error('Failed to forward message');
      if (enableHaptic) HapticFeedback.error();
    }
  };

  const handleForwardMessages = async (
    messages: readonly Message[],
    conversationIds: string[],
    enableHaptic = false
  ) => {
    if (messages.length === 0 || conversationIds.length === 0) return;

    try {
      for (const message of messages) {
        await http.post(`/api/v1/messages/${message.id}/forward`, {
          conversation_ids: conversationIds,
        });
      }

      const messageCount = messages.length;
      const targetCount = conversationIds.length;
      toast.success(
        `${messageCount} messages forwarded to ${targetCount} conversation${targetCount > 1 ? 's' : ''}`
      );
      if (enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to forward messages:', error);
      toast.error('Failed to forward messages');
      if (enableHaptic) HapticFeedback.error();
      throw error;
    }
  };

  return {
    messageToForward,
    showForwardModal,
    handleOpenForward,
    handleCloseForward,
    handleForwardMessage,
    handleForwardMessages,
  };
}

export interface MessageActionsState {
  activeMessageMenu: string | null;
  editingMessageId: string | null;
  editContent: string;
  messageToForward: Message | null;
  showForwardModal: boolean;
}

export interface MessageActionsHandlers {
  handleToggleMessageMenu: (messageId: string) => void;
  closeMessageMenu: () => void;
  handleStartEdit: (message: Message) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  setEditContent: (content: string) => void;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handlePinMessage: (messageId: string, conversationId: string) => Promise<void>;
  handleOpenForward: (message: Message, enableHaptic?: boolean) => void;
  handleCloseForward: () => void;
  handleForwardMessage: (conversationIds: string[], enableHaptic?: boolean) => Promise<void>;
  handleForwardMessages: (
    messages: readonly Message[],
    conversationIds: string[],
    enableHaptic?: boolean
  ) => Promise<void>;
}

export interface UseMessageActionsReturn extends MessageActionsState, MessageActionsHandlers {}

/**
 *
 * Description.
 */
export function useMessageActions(): UseMessageActionsReturn {
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleToggleMessageMenu = (messageId: string) => {
    setActiveMessageMenu((prev) => (prev === messageId ? null : messageId));
  };

  const closeMessageMenu = () => {
    setActiveMessageMenu(null);
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setActiveMessageMenu(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      const { editMessage } = useChatStore.getState();
      await editMessage(editingMessageId, editContent.trim());
      toast.success('Message edited');
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      logger.warn('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { deleteMessage } = useChatStore.getState();
      await deleteMessage(messageId);
      toast.success('Message deleted');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handlePinMessage = async (messageId: string, conversationId: string) => {
    try {
      await http.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/pin`);
      const { messages, updateMessage } = useChatStore.getState();
      const message = messages[conversationId]?.find((item) => item.id === messageId);
      if (message) {
        updateMessage({ ...message, isPinned: true });
      }
      toast.success('Message pinned');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to pin message:', error);
      toast.error('Failed to pin message');
    }
  };

  const forward = useForwardMessage(closeMessageMenu);

  return {
    activeMessageMenu,
    editingMessageId,
    editContent,
    messageToForward: forward.messageToForward,
    showForwardModal: forward.showForwardModal,
    handleToggleMessageMenu,
    closeMessageMenu,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    setEditContent,
    handleDeleteMessage,
    handlePinMessage,
    handleOpenForward: forward.handleOpenForward,
    handleCloseForward: forward.handleCloseForward,
    handleForwardMessage: forward.handleForwardMessage,
    handleForwardMessages: forward.handleForwardMessages,
  };
}
