import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInputArea } from '../message-input-area';
import type { MessageInputAreaProps } from '../types';

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: ({
    onComplete,
    onCancel,
  }: {
    onComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="voice-recorder">
      <button
        type="button"
        onClick={() =>
          onComplete({
            blob: new Blob(['voice'], { type: 'audio/webm' }),
            duration: 4,
            waveform: [0.2, 0.8],
          })
        }
      >
        Send recorded voice
      </button>
      <button type="button" onClick={onCancel}>
        Cancel recorded voice
      </button>
    </div>
  ),
}));

function makeProps(overrides: Partial<MessageInputAreaProps> = {}): MessageInputAreaProps {
  return {
    messageInput: '',
    attachment: null,
    isSending: false,
    isVoiceMode: false,
    replyTo: null,
    onVoiceModeChange: vi.fn(),
    onMessageChange: vi.fn(),
    onFileSelect: vi.fn(),
    onClearAttachment: vi.fn(),
    onClearReply: vi.fn(),
    onVoiceComplete: vi.fn(),
    onSend: vi.fn(),
    ...overrides,
  };
}

describe('EnhancedConversation MessageInputArea', () => {
  it('offers voice recording when there is no text or attachment to send', async () => {
    const user = userEvent.setup();
    const props = makeProps();

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    await user.click(screen.getByRole('button', { name: /record voice message/i }));

    expect(props.onVoiceModeChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
  });

  it('passes completed voice recordings back to the routed conversation owner', async () => {
    const user = userEvent.setup();
    const props = makeProps({ isVoiceMode: true });

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    await user.click(screen.getByRole('button', { name: /send recorded voice/i }));

    expect(props.onVoiceComplete).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      duration: 4,
      waveform: [0.2, 0.8],
    });
  });

  it('keeps the regular send button when text is present', async () => {
    const user = userEvent.setup();
    const props = makeProps({ messageInput: 'hello' });

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(props.onSend).toHaveBeenCalled();
    expect(props.onVoiceModeChange).not.toHaveBeenCalled();
  });
});
