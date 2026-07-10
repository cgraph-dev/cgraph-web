import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConversationSurface } from '../conversation-surface';
import { chatThemeSettingsToAppearance } from '@/modules/chat/theme/chat-theme-appearance';

describe('ConversationSurface', () => {
  it('owns the shared conversation shell slots and scroll contract', () => {
    const messagesScrollRef = createRef<HTMLDivElement>();
    const onMessagesScroll = vi.fn();

    render(
      <ConversationSurface
        header={<div>Header slot</div>}
        pinnedPanel={<div>Pinned slot</div>}
        requestBanner={<div>Request slot</div>}
        messages={<div>Messages slot</div>}
        scrollControl={<button type="button">Jump</button>}
        composer={<div>Composer slot</div>}
        modalLayer={<div>Modal slot</div>}
        messagesScrollRef={messagesScrollRef}
        onMessagesScroll={onMessagesScroll}
      />
    );

    expect(screen.getByText('Header slot')).toBeInTheDocument();
    expect(screen.getByText('Pinned slot')).toBeInTheDocument();
    expect(screen.getByText('Request slot')).toBeInTheDocument();
    expect(screen.getByText('Messages slot')).toBeInTheDocument();
    expect(screen.getByText('Composer slot')).toBeInTheDocument();
    expect(screen.getByText('Modal slot')).toBeInTheDocument();

    const messagesRegion = screen.getByLabelText('Conversation messages');
    expect(messagesScrollRef.current).toBe(messagesRegion);

    fireEvent.scroll(messagesRegion);
    expect(onMessagesScroll).toHaveBeenCalledTimes(1);
  });

  it('applies one source-derived chat appearance to the messages surface', () => {
    const messagesScrollRef = createRef<HTMLDivElement>();
    const appearance = chatThemeSettingsToAppearance({
      base: 'day',
      accentColor: 0x0088ff,
      messageColors: [0x0088ff],
    });

    render(
      <ConversationSurface
        header={<div>Header slot</div>}
        messages={<div>Messages slot</div>}
        composer={<div>Composer slot</div>}
        messagesScrollRef={messagesScrollRef}
        onMessagesScroll={vi.fn()}
        chatThemeAppearance={appearance}
      />
    );

    const messagesRegion = screen.getByLabelText('Conversation messages');
    expect(messagesRegion).toHaveAttribute('data-chat-theme-base', 'day');
    expect(messagesRegion).toHaveAttribute('data-chat-conversation-color', 'ultramarine');
    expect(messagesRegion.getAttribute('style')).toContain('background');
  });
});
