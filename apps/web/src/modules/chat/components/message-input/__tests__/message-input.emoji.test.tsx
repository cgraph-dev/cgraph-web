import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const SELECTED_EMOJI = '\u{1F600}';
const setDraftText = vi.fn();

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'emerald' } }),
  THEME_COLORS: {
    emerald: { primary: '#10b981', secondary: '#34d399', accent: '#34d399' },
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/modules/chat/hooks/useDraft', () => ({
  useDraft: () => ({
    draftText: 'draft',
    hydrated: true,
    setDraftText,
    clearDraft: vi.fn(),
  }),
}));

vi.mock('../reply-preview', () => ({ ReplyPreview: () => null }));
vi.mock('../attachments-preview', () => ({ AttachmentsPreview: () => null }));
vi.mock('../attachment-menu', () => ({ AttachmentMenu: () => null }));
vi.mock('../mention-autocomplete', () => ({ MentionAutocomplete: () => null }));
vi.mock('@/components/media/voice-message-recorder', () => ({ VoiceMessageRecorder: () => null }));
vi.mock('@/components/media/video-message-recorder', () => ({ VideoMessageRecorder: () => null }));
vi.mock('@/modules/chat/components/gif-picker', () => ({ GifPicker: () => null }));
vi.mock('@/modules/chat/components/emoji-picker', () => ({
  EmojiPicker: ({ onClose, onSelect }: { onClose: () => void; onSelect: (emoji: string) => void }) => (
    <div role="dialog" aria-label="Noto emoji picker">
      <button type="button" onClick={() => onSelect(SELECTED_EMOJI)}>
        Select Noto emoji
      </button>
      <button type="button" onClick={onClose}>
        Close Noto emoji picker
      </button>
    </div>
  ),
}));

import { MessageInput } from '../message-input';

describe('MessageInput emoji picker', () => {
  it('mounts the existing Noto picker and appends the selected emoji to the current draft', async () => {
    const onSend = vi.fn();
    render(<MessageInput conversationId="conversation-1" onSend={onSend} />);

    const input = await screen.findByTestId('message-input');
    await waitFor(() => expect(input).toHaveValue('draft'));

    fireEvent.click(screen.getByRole('button', { name: 'Open emoji picker' }));

    expect(await screen.findByRole('dialog', { name: 'Noto emoji picker' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select Noto emoji' }));

    await waitFor(() => {
      expect(input).toHaveValue(`draft${SELECTED_EMOJI}`);
      expect(setDraftText).toHaveBeenCalledWith(`draft${SELECTED_EMOJI}`);
      expect(input).toHaveFocus();
    });
    expect(screen.queryByRole('dialog', { name: 'Noto emoji picker' })).not.toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });
});
