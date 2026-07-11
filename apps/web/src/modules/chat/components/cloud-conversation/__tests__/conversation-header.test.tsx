import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConversationHeader } from '../conversation-header';

const store = vi.hoisted(() => ({
  state: {
    chatThemeSettings: {
      wallpaper: {
        intensity: 44,
        backgroundColor: 0xe5f1fa,
        secondBackgroundColor: 0xc4dfef,
        thirdBackgroundColor: 0xe8eaf9,
        fourthBackgroundColor: 0xdfeff0,
        dark: false,
      },
    },
    conversationChatThemeOverrides: {} as Record<string, { wallpaper?: unknown }>,
    setConversationChatThemeWallpaper: vi.fn(),
    resetConversationChatThemeWallpaper: vi.fn(),
  },
}));

vi.mock('@/shared/components/connection-status', () => ({
  ConnectionStatus: () => <div data-testid="connection-status" />,
}));

vi.mock('@/modules/settings/components/customize/panels/chat-color-picker', () => ({
  ChatColorPicker: ({ conversationId }: { conversationId?: string }) => (
    <div data-testid="chat-color-picker">{conversationId}</div>
  ),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn(
    (selector: (state: typeof store.state) => unknown) => selector(store.state),
  ),
}));

describe('Cloud ConversationHeader', () => {
  beforeEach(() => {
    store.state.conversationChatThemeOverrides = {};
    vi.clearAllMocks();
  });

  it('opens the per-conversation appearance controls from the live header', async () => {
    const user = userEvent.setup();

    render(
      <ConversationHeader
        conversationId="conversation-1"
        conversationName="Ada"
        isTyping={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change conversation appearance' }));

    expect(screen.getByRole('dialog', { name: 'Conversation appearance' })).toBeInTheDocument();
    expect(screen.getByTestId('chat-color-picker')).toHaveTextContent('conversation-1');
    expect(screen.getByRole('button', { name: 'Reset conversation wallpaper' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lattice' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Contour' }));

    expect(store.state.setConversationChatThemeWallpaper).toHaveBeenCalledWith('conversation-1', {
      intensity: 42,
      backgroundColor: 0xe2f1eb,
      secondBackgroundColor: 0xb6d5c9,
      thirdBackgroundColor: 0xd9e9d9,
      fourthBackgroundColor: 0xb0c9be,
      dark: false,
    });
  });

  it('resets only a persisted conversation wallpaper from the live header', async () => {
    const user = userEvent.setup();
    store.state.conversationChatThemeOverrides = {
      'conversation-1': {
        wallpaper: {
          intensity: 36,
          backgroundColor: 0x192436,
          secondBackgroundColor: 0x284b5c,
          thirdBackgroundColor: 0x263848,
          fourthBackgroundColor: 0x131b2a,
          dark: true,
        },
      },
    };

    render(
      <ConversationHeader
        conversationId="conversation-1"
        conversationName="Ada"
        isTyping={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change conversation appearance' }));
    await user.click(screen.getByRole('button', { name: 'Reset conversation wallpaper' }));

    expect(store.state.resetConversationChatThemeWallpaper).toHaveBeenCalledWith('conversation-1');
  });
});
