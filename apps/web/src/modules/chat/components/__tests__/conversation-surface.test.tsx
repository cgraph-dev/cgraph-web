import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConversationSurface } from '../conversation-surface';

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
});
