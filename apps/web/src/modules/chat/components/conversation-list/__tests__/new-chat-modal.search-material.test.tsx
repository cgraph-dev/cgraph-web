import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { NewChatModal } from '../new-chat-modal';

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: () => ({
    createConversation: vi.fn(),
  }),
}));

describe('NewChatModal search material', () => {
  it('uses the shared search field without changing its input contract', () => {
    render(
      <MemoryRouter>
        <NewChatModal onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByRole('textbox', { name: 'Search users' });
    expect(input).toHaveAttribute('placeholder', 'Search users...');
    expect(input).toHaveClass('cgraph-field');
    expect(input.parentElement).toHaveClass('cgraph-search-field');
    expect(input.parentElement?.querySelector('.cgraph-search-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
