import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

const fetchConversations = vi.fn().mockResolvedValue(undefined);
const fetchArchivedConversations = vi.fn().mockResolvedValue(undefined);
const chatState = {
  conversations: [],
  archivedConversations: [],
  isLoadingConversations: false,
  isLoadingArchivedConversations: false,
  fetchConversations,
  fetchArchivedConversations,
  createConversation: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
  archiveConversation: vi.fn(),
  unarchiveConversation: vi.fn(),
  pinConversation: vi.fn(),
  muteConversation: vi.fn(),
};

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: () => chatState,
}));

vi.mock('@/modules/chat/components/conversation-list', () => ({
  ConversationSidebar: ({
    showArchived,
    onShowArchivedChange,
  }: {
    readonly showArchived: boolean;
    readonly onShowArchivedChange: (nextShowArchived: boolean) => void;
  }) => (
    <div>
      <div data-testid="conversation-view">{showArchived ? 'archived' : 'inbox'}</div>
      <button type="button" onClick={() => onShowArchivedChange(true)}>
        Show archived
      </button>
      <button type="button" onClick={() => onShowArchivedChange(false)}>
        Show inbox
      </button>
    </div>
  ),
  NewChatModal: () => null,
  applySpaceConversationPatch: vi.fn(),
  filterConversations: (conversations: unknown[]) => conversations,
  readConversationSpace: () => null,
  spaceConversationPatch: vi.fn(),
}));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    getAllOnlineStatuses: () => new Map(),
    onStatusChange: () => () => undefined,
    peekConversationsPresence: vi.fn(),
  },
}));

vi.mock('@/lib/api-client', () => ({
  http: { get: vi.fn().mockResolvedValue({ data: [] }), patch: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/modules/chat/components/message-search', () => ({
  MessageSearch: () => null,
}));

vi.mock('./empty-states', () => ({
  NoConversationSelected: () => <div>No conversation selected</div>,
}));

import Messages from './messages';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderMessages(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/messages"
          element={
            <>
              <Messages />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Messages archive navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores the archived collection from the URL and fetches its server-owned data', async () => {
    renderMessages('/messages?view=archived&scrollTo=message-1');
    const user = userEvent.setup();

    expect(screen.getByTestId('conversation-view')).toHaveTextContent('archived');
    await waitFor(() => expect(fetchArchivedConversations).toHaveBeenCalledOnce());
    expect(fetchConversations).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Show inbox' }));

    expect(screen.getByTestId('conversation-view')).toHaveTextContent('inbox');
    expect(screen.getByTestId('location')).toHaveTextContent('/messages?scrollTo=message-1');
  });

  it('adds the archive view without discarding an existing navigation parameter', async () => {
    renderMessages('/messages?scrollTo=message-1');
    const user = userEvent.setup();

    expect(screen.getByTestId('conversation-view')).toHaveTextContent('inbox');
    await user.click(screen.getByRole('button', { name: 'Show archived' }));

    expect(screen.getByTestId('conversation-view')).toHaveTextContent('archived');
    expect(screen.getByTestId('location')).toHaveTextContent('/messages?scrollTo=message-1&view=archived');
  });
});
