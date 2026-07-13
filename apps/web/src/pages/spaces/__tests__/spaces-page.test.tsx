import type { PropsWithChildren } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SpacesPage from '../spaces-page';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  fetchConversations: vi.fn(),
}));

const space = {
  id: 'space-1',
  name: 'Priority',
  emoji: 'p',
  position: 0,
  includeAllIndividual: true,
  includeAllGroups: false,
  showOnlyUnread: true,
  showMuted: false,
  includedConversationIds: [],
  excludedConversationIds: [],
};

const secondarySpace = {
  ...space,
  id: 'space-2',
  name: 'Later',
  position: 1,
};

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/api-client', () => ({
  http: mocks,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: () => ({ conversations: [], fetchConversations: mocks.fetchConversations }),
}));

vi.mock('@/modules/chat/components/spaces/space-filter-editor', () => ({
  SpaceFilterEditor: () => <div>Space filters</div>,
}));

vi.mock('@/modules/chat/components/conversation-list', () => ({
  conversationMatchesSpace: () => true,
  getConversationName: () => 'Conversation',
  readConversationSpace: (value: unknown) => value,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: PropsWithChildren<{ open: boolean }>) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children, ariaLabel }: PropsWithChildren<{ ariaLabel: string }>) => (
    <div role="dialog" aria-label={ariaLabel}>
      {children}
    </div>
  ),
  DialogFooter: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderSpaces() {
  return render(
    <MemoryRouter initialEntries={['/spaces/space-1']}>
      <Routes>
        <Route path="/spaces" element={<SpacesPage />} />
        <Route path="/spaces/:spaceId" element={<SpacesPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('SpacesPage', () => {
  beforeEach(() => {
    mocks.get.mockResolvedValue({ data: [space] });
    mocks.post.mockReset();
    mocks.patch.mockReset();
    mocks.delete.mockReset();
    mocks.fetchConversations.mockResolvedValue(undefined);
  });

  it('edits a selected Space through the existing PATCH owner', async () => {
    mocks.patch.mockResolvedValue({ data: { ...space, name: 'Work' } });
    renderSpaces();
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Priority' });
    await user.click(screen.getByRole('button', { name: 'Edit Priority' }));
    await user.clear(screen.getByRole('textbox', { name: 'Space name' }));
    await user.type(screen.getByRole('textbox', { name: 'Space name' }), 'Work');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mocks.patch).toHaveBeenCalledWith('/api/v1/spaces/space-1', {
        name: 'Work',
        emoji: 'p',
        include_all_individual: true,
        include_all_groups: false,
        show_only_unread: true,
        show_muted: false,
      });
    });
  });

  it('requires confirmation before deleting a selected Space', async () => {
    mocks.delete.mockResolvedValue({});
    renderSpaces();
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Priority' });
    await user.click(screen.getByRole('button', { name: 'Delete Priority' }));

    expect(mocks.delete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete Space' }));

    await waitFor(() => {
      expect(mocks.delete).toHaveBeenCalledWith('/api/v1/spaces/space-1');
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/spaces');
  });

  it('cancels an edit when navigation selects a different Space', async () => {
    mocks.get.mockResolvedValue({ data: [space, secondarySpace] });
    renderSpaces();
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Priority' });
    await user.click(screen.getByRole('button', { name: 'Edit Priority' }));
    await user.click(screen.getByRole('link', { name: /Later/ }));

    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Create Space' })).toBeInTheDocument();
    });
  });
});
