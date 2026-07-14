import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble, type UIPreferences, type MessageBubbleProps } from '../message-bubble';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import { chatThemeSettingsToAppearance } from '@/modules/chat/theme/chat-theme-appearance';

// Mock dependencies
vi.mock('@/lib/chat', () => ({
  aggregateReactions: vi.fn(() => []),
  handleRemoveReaction: vi.fn(),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: ((s: Record<string, unknown>) => unknown) | undefined) => {
      const state = { user: { id: 'current-user-1' } };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ user: { id: 'current-user-1' } }) }
  ),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
      const state = {
        chatBubbleStyle: 'default',
        chatBubbleColor: null,
        bubbleBorderRadius: null,
        messageEffect: 'none',
        equippedTitle: null,
      };
      return selector(state);
    }),
    {
      getState: () => ({
        chatBubbleStyle: 'default',
        bubbleBorderRadius: null,
        messageEffect: 'none',
        equippedTitle: null,
      }),
    }
  ),
}));

vi.mock('@/modules/social/components/user-profile-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="profile-card">{children}</div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('@/modules/chat/components/audio/advanced-voice-visualizer', () => ({
  default: () => <div data-testid="voice-visualizer">Voice Visualizer</div>,
}));

vi.mock('@/modules/chat/components/message-reactions', () => ({
  default: () => <div data-testid="reactions">Reactions</div>,
}));

vi.mock('@/modules/chat/components/rich-media-embed', () => ({
  default: () => <div data-testid="rich-embed">Rich Embed</div>,
}));

vi.mock('@/modules/chat/components/markdown-content', () => ({
  MarkdownContent: ({ content, emojiSize }: { content: string; emojiSize?: number }) => (
    <span data-testid="markdown-content" data-emoji-size={emojiSize}>
      {content}
    </span>
  ),
}));

vi.mock('@/modules/chat/components/gif-message', () => ({
  GifMessage: () => <div data-testid="gif-message">GIF</div>,
}));

vi.mock('@/modules/chat/components/file-message', () => ({
  FileMessage: () => <div data-testid="file-message">File</div>,
}));

vi.mock('@/components/media/voice-message-player', () => ({
  VoiceMessagePlayer: () => <div data-testid="voice-player">Voice Player</div>,
}));

// NOTE: vi.mock('@/modules/gamification/components/title-badge') removed — module was deleted.

const defaultUIPreferences: UIPreferences = {
  glassEffect: 'frosted',
  animationIntensity: 'medium',
  showParticles: false,
  enableGlow: false,
  enable3D: false,
  enableHaptic: false,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'fade',
};

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  content: 'Test message content',
  senderId: 'user-1',
  conversationId: 'conv-1',
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
  encryptedContent: null,
  isEncrypted: false,
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  messageType: 'text',
  sender: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  ...overrides,
});

const defaultProps: Omit<MessageBubbleProps, 'message'> = {
  isOwn: false,
  showAvatar: true,
  onReply: vi.fn(),
  uiPreferences: defaultUIPreferences,
};

describe('MessageBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders text message content', () => {
      const message = createMockMessage({ content: 'Hello, world!' });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('renders avatar for non-own messages when showAvatar is true', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} isOwn={false} showAvatar={true} />);

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('does not render avatar for own messages', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} isOwn={true} showAvatar={true} />);

      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
    });

    it('renders message reactions', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('reactions')).toBeInTheDocument();
    });

    it('renders a pinned badge from the shared bubble surface', () => {
      const message = createMockMessage({ isPinned: true });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });
  });

  describe('message types', () => {
    it('renders GIF message', () => {
      const message = createMockMessage({ messageType: 'gif' });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('gif-message')).toBeInTheDocument();
    });

    it('renders file message', () => {
      const message = createMockMessage({
        messageType: 'file',
        metadata: {
          url: 'http://example.com/file.pdf',
          filename: 'file.pdf',
        },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('file-message')).toBeInTheDocument();
    });

    it('renders voice message with visualizer', () => {
      const message = createMockMessage({
        messageType: 'voice',
        metadata: { url: 'http://example.com/audio.mp3' },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('voice-visualizer')).toBeInTheDocument();
      expect(screen.getByTestId('voice-player')).toBeInTheDocument();
    });
  });

  describe('reply preview', () => {
    it('renders reply preview when message has replyTo', () => {
      const message = createMockMessage({
        replyToId: 'reply-msg',
        replyTo: {
          ...createMockMessage({ id: 'reply-msg', content: 'Original message' }),
          sender: { id: 'user-2', username: 'replyuser', displayName: null, avatarUrl: null },
        },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('replyuser')).toBeInTheDocument();
      expect(screen.getByText('Original message')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders edit form when isEditing is true', () => {
      const message = createMockMessage({ content: 'Editable message' });
      render(
        <MessageBubble
          {...defaultProps}
          message={message}
          isEditing={true}
          editContent="Edited content"
          onEditContentChange={vi.fn()}
          onSaveEdit={vi.fn()}
          onCancelEdit={vi.fn()}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('Edited content');
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onSaveEdit when Save button clicked', () => {
      const onSaveEdit = vi.fn();
      const message = createMockMessage();
      render(
        <MessageBubble
          {...defaultProps}
          message={message}
          isEditing={true}
          editContent="Edited"
          onSaveEdit={onSaveEdit}
          onCancelEdit={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Save'));
      expect(onSaveEdit).toHaveBeenCalled();
    });
  });

  describe('timestamp', () => {
    it('renders formatted timestamp', () => {
      const message = createMockMessage({
        createdAt: '2026-01-01T14:30:00Z',
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      // Should show time in h:mm a format
      expect(screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)).toBeInTheDocument();
    });

    it('shows edited indicator for edited messages', () => {
      const message = createMockMessage({ isEdited: true });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies correct styles for own messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble {...defaultProps} message={message} isOwn={true} />
      );

      const bubble = container.querySelector('[class*="bg-primary-600"]');
      expect(bubble).toBeInTheDocument();
    });

    it('applies correct styles for other messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble {...defaultProps} message={message} isOwn={false} />
      );

      const bubble = container.querySelector('[class*="bg-[var(--token-card-bg)]"]');
      expect(bubble).toBeInTheDocument();
    });

    it('keeps source-sized rounded bubbles when a chat theme supplies colors', () => {
      const message = createMockMessage();
      const appearance = chatThemeSettingsToAppearance({
        base: 'night',
        accentColor: 0x7c3aed,
        messageColors: [0x7c3aed],
      });
      const { container } = render(
        <MessageBubble
          {...defaultProps}
          message={message}
          isOwn={true}
          chatThemeAppearance={appearance}
        />
      );

      const bubble = container.querySelector('[data-chat-theme-bubble="outgoing"]');
      expect(bubble).toHaveClass('max-w-full', 'min-w-40', 'rounded-2xl', 'rounded-br-md');
      expect(bubble?.parentElement?.parentElement).toHaveClass('max-w-[min(430px,78%)]');
    });

    it('renders up to three supported emoji without a normal bubble background', () => {
      const message = createMockMessage({ content: '😂' });
      const { container } = render(
        <MessageBubble {...defaultProps} message={message} isOwn={true} />
      );

      const bubble = container.querySelector('[data-isolated-emoji-count="1"]');
      expect(bubble).toHaveClass('bg-transparent', 'px-0', 'py-0');
      expect(bubble).not.toHaveClass('min-w-40');
      expect(screen.getByTestId('markdown-content')).toHaveAttribute('data-emoji-size', '72');
    });
  });
});
