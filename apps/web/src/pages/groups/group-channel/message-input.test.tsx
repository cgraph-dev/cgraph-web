import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageInput } from './message-input';
import type { MessageInputProps } from './types';

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: () => <div>Voice recorder</div>,
}));

function makeProps(overrides: Partial<MessageInputProps> = {}): MessageInputProps {
  return {
    channelName: 'general',
    messageInput: '',
    isSending: false,
    replyTo: null,
    attachment: null,
    isVoiceMode: false,
    onInputChange: vi.fn(),
    onKeyDown: vi.fn(),
    onSend: vi.fn(),
    onVoiceModeChange: vi.fn(),
    onCancelReply: vi.fn(),
    onEmojiSelect: vi.fn(),
    onGifSelect: vi.fn(),
    onStickerSelect: vi.fn(),
    onVoiceComplete: vi.fn(),
    onFileSelect: vi.fn(),
    onClearAttachment: vi.fn(),
    ...overrides,
  };
}

describe('Group channel MessageInput', () => {
  it('keeps every composer action labelled and uses the responsive field surface', () => {
    const { container } = render(<MessageInput {...makeProps()} />);

    expect(screen.getByPlaceholderText('Message #general')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open emoji picker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open sticker picker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open GIF picker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record voice message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();

    expect(container.querySelector('.cgraph-field')).toHaveClass(
      'flex-col',
      'sm:flex-row'
    );
  });

  it('forwards text changes and sends non-empty messages', () => {
    const onInputChange = vi.fn();
    const onSend = vi.fn();
    const props = makeProps({ messageInput: 'Ready', onInputChange, onSend });

    render(<MessageInput {...props} />);

    fireEvent.change(screen.getByPlaceholderText('Message #general'), {
      target: { value: 'Ready to send' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onInputChange).toHaveBeenCalledWith('Ready to send');
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
