/** @module conversation-list tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/haptics', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

// jsdom reports zero element sizes, so @tanstack/react-virtual would render
// no items. Stub the virtualizer to pass all rows straight through so the
// rendering logic is exercised under test.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, index) => ({
        index,
        start: index * 76,
        size: 76,
        key: `v:${index}`,
        end: (index + 1) * 76,
        lane: 0,
      })),
    getTotalSize: () => opts.count * 76,
  }),
}));

const mockConversations = [
  {
    id: 'conv-1',
    name: 'Alice',
    type: 'direct' as const,
    participants: [
      { id: 'user-1', username: 'alice', avatar: null },
      { id: 'current-user', username: 'me', avatar: null },
    ],
    lastMessage: { content: 'Hello!', timestamp: new Date().toISOString() },
    unreadCount: 2,
    isPinned: false,
    isMuted: false,
    isArchived: false,
  },
  {
    id: 'conv-2',
    name: 'Team Chat',
    type: 'group' as const,
    participants: [
      { id: 'user-1', username: 'alice', avatar: null },
      { id: 'user-2', username: 'bob', avatar: null },
    ],
    lastMessage: { content: 'Meeting at 3pm', timestamp: new Date().toISOString() },
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isArchived: false,
  },
];

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: Object.assign(
    vi.fn((sel?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        conversations: mockConversations,
        activeConversationId: null,
        typing: {},
        typingUsers: {},
      };
      return typeof sel === 'function' ? sel(state) : state;
    }),
    { getState: () => ({ conversations: mockConversations }) }
  ),
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: vi.fn(() => ({
    conversations: mockConversations,
    activeConversationId: null,
    typing: {},
    typingUsers: {},
  })),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: { id: 'current-user', username: 'me' } })),
    { getState: () => ({ user: { id: 'current-user', username: 'me' } }) }
  ),
}));

vi.mock('../conversation-list-header', () => ({
  ConversationListHeader: ({
    searchQuery,
    onSearch,
  }: {
    searchQuery: string;
    onSearch: (q: string) => void;
  }) => (
    <div data-testid="conversation-list-header">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../conversation-item', () => ({
  ConversationItem: ({
    conversation,
    onClick,
  }: {
    conversation: { id: string; name: string };
    onClick: () => void;
  }) => (
    <div data-testid={`conversation-${conversation.id}`} onClick={onClick}>
      {conversation.name}
    </div>
  ),
}));

vi.mock('../empty-state', () => ({
  EmptyState: () => <div data-testid="empty-state">No conversations</div>,
}));

vi.mock('../new-chat-modal', () => ({
  NewChatModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="new-chat-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: () => <div data-testid="avatar" />,
}));

import { ConversationList } from '../conversation-list';

describe('ConversationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conversation list header', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    expect(screen.getByTestId('conversation-list-header')).toBeInTheDocument();
  });

  it('renders conversation items', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  it('renders pinned conversations section when present', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    // Team Chat is pinned, should appear
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationList className="my-custom" />
      </MemoryRouter>
    );
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
