/** @module conversation-page tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/modules/chat/components/cloud-conversation', () => ({
  CloudConversation: () => <div data-testid="cloud-conversation">cloud-ui</div>,
}));

vi.mock('@/components/mobile-only-feature', () => ({
  MobileOnlyFeature: ({ feature }: { readonly feature: string }) => (
    <div data-testid="mobile-only">{feature} is mobile + desktop only</div>
  ),
}));

const useChatStoreMock = vi.fn();
vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: (selector?: (state: unknown) => unknown) => useChatStoreMock(selector),
}));

import Conversation from './page';
import type { Conversation as ConversationType } from '@/modules/chat/store/chatStore.types';

function setConversations(convs: readonly ConversationType[]): void {
  useChatStoreMock.mockImplementation((selector?: (state: unknown) => unknown) => {
    const state = { conversations: convs };
    return selector ? selector(state) : state;
  });
}

function renderAt(id: string): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[`/messages/${id}`]}>
      <Routes>
        <Route path="/messages/:conversationId" element={<Conversation />} />
      </Routes>
    </MemoryRouter>
  );
}

function makeConv(overrides: Partial<ConversationType> = {}): ConversationType {
  return {
    id: 'c1',
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [],
    lastMessage: null,
    unreadCount: 0,
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
    ...overrides,
  };
}

describe('ConversationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cloud UI when conversationType is cloud', () => {
    setConversations([makeConv({ id: 'c1', conversationType: 'cloud' })]);
    const { getByTestId } = renderAt('c1');
    expect(getByTestId('cloud-conversation')).toBeInTheDocument();
  });

  it('renders MobileOnlyFeature when conversationType is secret', () => {
    setConversations([makeConv({ id: 'c1', conversationType: 'secret' })]);
    const { getByTestId, getByText } = renderAt('c1');
    expect(getByTestId('mobile-only')).toBeInTheDocument();
    expect(getByText(/Secret Chat is mobile \+ desktop only/i)).toBeInTheDocument();
  });

  it('falls back to MobileOnlyFeature when conversationType is missing (pre-migration)', () => {
    setConversations([makeConv({ id: 'c1' })]);
    const { getByTestId } = renderAt('c1');
    expect(getByTestId('mobile-only')).toBeInTheDocument();
  });

  it('renders MobileOnlyFeature when conversation is not loaded yet', () => {
    setConversations([]);
    const { getByTestId } = renderAt('c1');
    expect(getByTestId('mobile-only')).toBeInTheDocument();
  });
});
