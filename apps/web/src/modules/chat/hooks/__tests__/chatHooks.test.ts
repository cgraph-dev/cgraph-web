import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const { mockChatState, mockApi } = vi.hoisted(() => ({
  mockChatState: {
    conversations: [] as Array<{ id: string; name?: string; participants: unknown[] }>,
    messages: {} as Record<string, unknown[]>,
    isLoadingMessages: false,
    typingUsers: {} as Record<string, string[]>,
    hasMoreMessages: {} as Record<string, boolean>,
    fetchMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    setActiveConversation: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
  },
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/modules/chat/store', () => {
  const storeSelector = vi.fn((selector?: (s: typeof mockChatState) => unknown) => {
    if (typeof selector === 'function') return selector(mockChatState);
    return mockChatState;
  });
  (storeSelector as unknown as Record<string, unknown>).getState = () => mockChatState;
  return { useChatStore: storeSelector };
});

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 'me' } })),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: vi.fn(() => ({ friends: [], fetchFriends: vi.fn() })),
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    isUserOnline: vi.fn(() => false),
    onStatusChange: vi.fn(() => vi.fn()),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  getParticipantUserId: vi.fn((p: Record<string, unknown> | null) => p?.user_id ?? null),
  getParticipantDisplayName: vi.fn(
    (p: Record<string, unknown> | null) => (p?.display_name as string) ?? 'Unknown'
  ),
}));

vi.mock('@/components/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), medium: vi.fn(), light: vi.fn() },
}));

import { useMessageActions } from '../useMessageActions';
import type { Message } from '@/modules/chat/store/chatStore.types';
// NOTE: useConversationUI removed — archived in batch 2
// NOTE: useMessageInputState removed — archived in batch 2
describe('useMessageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with all nulls and false', () => {
    const { result } = renderHook(() => useMessageActions());

    expect(result.current.activeMessageMenu).toBeNull();
    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
    expect(result.current.messageToForward).toBeNull();
    expect(result.current.showForwardModal).toBe(false);
  });

  it('handleToggleMessageMenu should toggle menu for a message', () => {
    const { result } = renderHook(() => useMessageActions());

    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBe('msg-1');

    // Toggle same => close
    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleStartEdit should set editing state and close menu', () => {
    const { result } = renderHook(() => useMessageActions());

    const mockMessage = { id: 'msg-1', content: 'Hello world' } as unknown as Message;

    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBe('msg-1');

    act(() => {
      result.current.handleStartEdit(mockMessage);
    });

    expect(result.current.editingMessageId).toBe('msg-1');
    expect(result.current.editContent).toBe('Hello world');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleCancelEdit should clear editing state', () => {
    const { result } = renderHook(() => useMessageActions());

    act(() => {
      result.current.handleStartEdit({ id: 'msg-1', content: 'test' } as unknown as Message);
    });
    expect(result.current.editingMessageId).toBe('msg-1');

    act(() => {
      result.current.handleCancelEdit();
    });

    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
  });

  it('handleSaveEdit should call editMessage and reset state', async () => {
    mockChatState.editMessage.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMessageActions());

    act(() => {
      result.current.handleStartEdit({ id: 'msg-99', content: 'original' } as unknown as Message);
      result.current.setEditContent('updated content');
    });

    await act(async () => {
      await result.current.handleSaveEdit();
    });

    expect(mockChatState.editMessage).toHaveBeenCalledWith('msg-99', 'updated content');
    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
  });

  it('handleSaveEdit should not proceed when editContent is empty', async () => {
    const { result } = renderHook(() => useMessageActions());

    // No editing started, so editContent is empty
    await act(async () => {
      await result.current.handleSaveEdit();
    });

    expect(mockChatState.editMessage).not.toHaveBeenCalled();
  });

  it('handleDeleteMessage should call deleteMessage and clear menu', async () => {
    mockChatState.deleteMessage.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMessageActions());

    await act(async () => {
      await result.current.handleDeleteMessage('msg-42');
    });

    expect(mockChatState.deleteMessage).toHaveBeenCalledWith('msg-42');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handlePinMessage should call api and clear menu', async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useMessageActions());

    await act(async () => {
      await result.current.handlePinMessage('msg-1', 'conv-1');
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1/pin');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleOpenForward / handleCloseForward should manage forward modal state', () => {
    const { result } = renderHook(() => useMessageActions());

    const msg = { id: 'msg-5', content: 'fwd', messageType: 'text' } as unknown as Message;

    act(() => {
      result.current.handleOpenForward(msg);
    });

    expect(result.current.showForwardModal).toBe(true);
    expect(result.current.messageToForward).toBe(msg);

    act(() => {
      result.current.handleCloseForward();
    });

    expect(result.current.showForwardModal).toBe(false);
    expect(result.current.messageToForward).toBeNull();
  });
});

// NOTE: useConversationUI describe block removed — hook archived in batch 2
// NOTE: useMessageInputState describe block removed — hook archived in batch 2
