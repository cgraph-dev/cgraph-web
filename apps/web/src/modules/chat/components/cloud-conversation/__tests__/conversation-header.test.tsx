import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConversationHeader } from '../conversation-header';

vi.mock('@/shared/components/connection-status', () => ({
  ConnectionStatus: () => <div data-testid="connection-status" />,
}));

vi.mock('@/modules/settings/components/customize/panels/chat-color-picker', () => ({
  ChatColorPicker: ({ conversationId }: { conversationId?: string }) => (
    <div data-testid="chat-color-picker">{conversationId}</div>
  ),
}));

describe('Cloud ConversationHeader', () => {
  it('opens the per-conversation chat color picker from the live header', async () => {
    const user = userEvent.setup();

    render(
      <ConversationHeader
        conversationId="conversation-1"
        conversationName="Ada"
        isTyping={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change conversation color' }));

    expect(screen.getByRole('dialog', { name: 'Conversation color' })).toBeInTheDocument();
    expect(screen.getByTestId('chat-color-picker')).toHaveTextContent('conversation-1');
  });
});
