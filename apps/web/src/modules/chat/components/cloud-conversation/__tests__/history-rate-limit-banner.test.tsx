import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const controller = vi.hoisted(() => ({
  retryMessageHistory: vi.fn(),
  value: {
    conversationId: 'conversation-1',
    conversation: { id: 'conversation-1', type: 'direct', isGroup: false } as {
      id: string;
      type: string;
      isGroup: boolean;
    } | null,
    conversationMessages: [],
    scrollToMessageId: null,
    typing: [],
    user: { id: 'user-1' },
    attachmentNodePrice: null,
    replyTo: null,
    messageRequest: { blocksComposer: false },
    messageHistoryError: 'Too many requests. Please wait 12 seconds before retrying.',
    isUploading: false,
    setAttachmentNodePrice: vi.fn(),
    setReplyTo: vi.fn(),
    messagesEndRef: { current: null },
    inputContainerRef: { current: null },
    messagesScrollRef: { current: null },
    callRecipientId: 'user-2',
    handleMessagesScroll: vi.fn(),
    showScrollToLatest: false,
    newMessagesBelow: 0,
    scrollToLatestMessages: vi.fn(),
    handleTyping: vi.fn(),
    handleComposerPayload: vi.fn(),
    handleStartCall: vi.fn(),
    handleBackToMessages: vi.fn(),
    handleMessageRequestDeleted: vi.fn(),
    retryMessageHistory: vi.fn(),
    messageActions: {
      activeMessageMenu: null,
      editingMessageId: null,
      editContent: '',
      showForwardModal: false,
      messageToForward: null,
      handlePinMessage: vi.fn(),
      handleStartEdit: vi.fn(),
      handleDeleteMessage: vi.fn(),
      handleOpenForward: vi.fn(),
      handleToggleMessageMenu: vi.fn(),
      setEditContent: vi.fn(),
      handleSaveEdit: vi.fn(),
      handleCancelEdit: vi.fn(),
      closeMessageMenu: vi.fn(),
      handleForwardMessages: vi.fn(),
      handleCloseForward: vi.fn(),
      handleForwardMessage: vi.fn(),
    },
  },
}));

vi.mock('@/modules/chat/controllers/cloud-conversation', () => ({
  useCloudConversationController: () => controller.value,
}));

vi.mock('../conversation-header', () => ({ ConversationHeader: () => <div>header</div> }));
vi.mock('../message-input-area', () => ({ MessageInputArea: () => <div>composer</div> }));
vi.mock('../conversation-loading-state', () => ({
  ConversationLoadingState: () => <div>loading</div>,
}));
vi.mock('@/modules/chat/components', () => ({
  DEFAULT_UI_PREFERENCES: {},
  MessageList: () => <div>messages</div>,
  ConversationSurface: ({ requestBanner }: { requestBanner?: React.ReactNode }) => (
    <main>{requestBanner}</main>
  ),
}));
vi.mock('@/modules/chat/components/batch-actions/batch-action-bar', () => ({
  BatchActionBar: () => null,
}));
vi.mock('@/modules/chat/components/message-request-panel', () => ({
  MessageRequestPanel: () => null,
}));
vi.mock('@/modules/chat/components/forward-message-modal', () => ({
  ForwardMessageModal: () => null,
}));
vi.mock('@/modules/chat/components/new-messages-bar', () => ({ NewMessagesBar: () => null }));
vi.mock('@/modules/chat/components/scroll-to-bottom-button', () => ({
  ScrollToBottomButton: () => null,
}));
vi.mock('@/modules/chat/hooks/use-batch-select', () => ({
  useBatchSelect: () => ({
    selectedMessageIds: new Set<string>(),
    selectedCount: 0,
    isSelecting: false,
    enterSelectMode: vi.fn(),
    exitSelectMode: vi.fn(),
    toggleSelect: vi.fn(),
    isOperationAllowed: vi.fn(() => true),
  }),
}));
vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: { getState: vi.fn(() => ({ deleteMessage: vi.fn() })) },
}));
vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      chatThemeSettings: {},
      defaultConversationColor: null,
      conversationChatThemeOverrides: {},
    }),
}));
vi.mock('@/modules/chat/theme/chat-theme-appearance', () => ({
  chatThemeSettingsToAppearance: () => undefined,
}));
vi.mock('@/modules/chat/components/conversation-list/utils', () => ({
  getConversationAvatar: () => null,
  getConversationAvatarBorderId: () => null,
  getConversationName: () => 'Alice',
  getConversationOnlineStatus: () => true,
}));
vi.mock('@/shared/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/components/ui')>()),
  toast: { success: vi.fn(), error: vi.fn() },
}));

import CloudConversation from '../cloud-conversation';

describe('CloudConversation history rate-limit banner', () => {
  beforeEach(() => {
    controller.value.retryMessageHistory.mockClear();
    controller.value.handleBackToMessages.mockClear();
    controller.value.conversation = {
      id: 'conversation-1',
      type: 'direct',
      isGroup: false,
    };
  });

  it('announces the server wait and exposes one explicit retry command', () => {
    render(<CloudConversation />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Too many requests. Please wait 12 seconds before retrying.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(controller.value.retryMessageHistory).toHaveBeenCalledOnce();
  });

  it('keeps a narrow-screen back command available while conversation data loads', () => {
    controller.value.conversation = null;

    render(<CloudConversation />);

    const backButton = screen.getByRole('button', { name: 'Back to conversations' });
    expect(backButton).toHaveClass('h-10', 'w-10');
    expect(screen.getByText('loading')).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(controller.value.handleBackToMessages).toHaveBeenCalledOnce();
  });
});
