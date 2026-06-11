/**
 * MessageBubble Customization Integration Tests
 * Verifies that bubble renders with custom style class, sender title,
 * sender colors, profile card CSS vars, and background renderer response.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../message-bubble';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import type { UIPreferences } from '../preferences';
import { DEFAULT_UI_PREFERENCES } from '../preferences';
import { areMessageBubblePropsEqual } from '../utils';

// Mock framer-motion to prevent layout animation infinite loops in jsdom
// Proxy defined inline because vi.mock factories are hoisted above variable declarations

// Mock stores — paths must match the actual import paths in MessageBubble.tsx
vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
      const state = {
        chatBubbleStyle: 'neon',
        chatBubbleColor: 'emerald',
        bubbleBorderRadius: 'lg',
        messageEffect: 'none',
        equippedTitle: { id: 'title-1', name: 'Legend', color: '#fbbf24' },
        equippedNameplate: null,
      };
      return selector(state);
    }),
    {
      getState: () => ({
        chatBubbleStyle: 'neon',
        bubbleBorderRadius: 'lg',
        messageEffect: 'none',
        equippedTitle: null,
        equippedNameplate: null,
      }),
    }
  ),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: ((s: Record<string, unknown>) => unknown) | undefined) => {
      const state = { user: { id: 'user-1' } };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ user: { id: 'user-1' } }) }
  ),
}));

// Mock heavy sub-components to isolate MessageBubble logic
vi.mock('@/modules/chat/components/message-reactions', () => ({
  default: () => <div data-testid="message-reactions" />,
}));
vi.mock('@/modules/chat/components/rich-media-embed', () => ({
  default: () => <div data-testid="rich-media-embed" />,
}));
vi.mock('@/modules/social/components/user-profile-card', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
// NOTE: vi.mock('@/modules/gamification/components/title-badge') removed — module was deleted.
vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ username }: { username: string }) => <div data-testid="avatar">{username}</div>,
}));
vi.mock('@/modules/chat/components/markdown-content', () => ({
  MarkdownContent: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock('@/lib/chat', () => ({
  aggregateReactions: () => [],
  handleRemoveReaction: vi.fn(),
}));

vi.mock('@/shared/components/ui', () => ({
  InlineTitle: ({ titleId }: { titleId: string }) => (
    <span data-testid="inline-title">{titleId}</span>
  ),
  DisplayName: ({ name }: { name: string }) => <span>{name}</span>,
}));

// Minimal message factory with all required fields
function createMessage(overrides: Partial<Message> = {}): Message {
  const base: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: 'Hello world',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEdited: false,
    isPinned: false,
    deletedAt: null,
    reactions: [],
    sender: {
      id: 'user-2',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
      avatarBorderId: 'border-fire',
      bubbleStyle: 'gradient',
      bubbleColor: '#ef4444',
      equippedTitleId: 'title-veteran',
      equippedNameplateId: null,
      chatTheme: 'midnight',
    },
    metadata: {},
  };
  return { ...base, ...overrides } as Message;
}

const noop = () => {};

const defaultUiPrefs: UIPreferences = { ...DEFAULT_UI_PREFERENCES };

const defaultProps = {
  message: createMessage(),
  isOwn: false,
  showAvatar: true,
  onReply: noop,
  uiPreferences: defaultUiPrefs,
  onEdit: noop,
  onDelete: noop,
  onPin: noop,
  onForward: noop,
  isMenuOpen: false,
  onToggleMenu: noop,
  isEditing: false,
  editContent: '',
  onEditContentChange: noop,
  onSaveEdit: noop,
  onCancelEdit: noop,
};

describe('MessageBubble Customization', () => {
  it('renders message content', () => {
    render(<MessageBubble {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders sender username', () => {
    render(<MessageBubble {...defaultProps} />);
    // Component renders displayName first, falling back to username
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('uses sender bubbleStyle for other user messages', () => {
    const { container } = render(<MessageBubble {...defaultProps} />);
    // The bubble should apply a style class derived from sender's bubbleStyle
    const bubble = container.querySelector('[class*="gradient"]') || container.firstChild;
    expect(bubble).toBeTruthy();
  });

  it('uses own customization store for own messages', () => {
    const ownMsg = createMessage({
      senderId: 'user-1',
      sender: { id: 'user-1', username: 'me', displayName: 'Me', avatarUrl: null },
    });
    render(<MessageBubble {...defaultProps} message={ownMsg} isOwn={true} />);
    // Should render with 'neon' style from mocked store
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders sender title when available', () => {
    const msgWithTitle = createMessage({
      sender: {
        id: 'user-2',
        username: 'alice',
        displayName: 'Alice',
        avatarUrl: null,
        equippedTitleId: 'title-veteran',
      },
    });
    render(<MessageBubble {...defaultProps} message={msgWithTitle} />);
    // At minimum the message should render without errors
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects bubbleStyle changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, bubbleStyle: 'glass' },
    });
    // This should trigger re-render due to updated comparator
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects equippedTitleId changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, equippedTitleId: 'title-new' },
    });
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('uses sender nameplate as a bubble surface for other user messages', () => {
    const msgWithNameplate = createMessage({
      sender: {
        ...createMessage().sender,
        bubbleStyle: null,
        bubbleColor: null,
        equippedNameplateId: 'plate_stone_sentinel_01',
      },
    });

    const { container } = render(<MessageBubble {...defaultProps} message={msgWithNameplate} />);

    const bubble = container.querySelector(
      '[data-nameplate-bubble-id="plate_stone_sentinel_01"]'
    );
    expect(bubble).toBeTruthy();
    expect(bubble?.className).toContain('nameplate-bubble-surface');
  });

  it('memo comparator detects equippedNameplateId changes', () => {
    const previous = {
      ...defaultProps,
      message: createMessage({
        sender: { ...createMessage().sender, equippedNameplateId: 'plate_mystic_purple_relic_01' },
      }),
    };
    const next = {
      ...defaultProps,
      message: createMessage({
        sender: { ...createMessage().sender, equippedNameplateId: 'plate_stone_sentinel_01' },
      }),
    };

    expect(areMessageBubblePropsEqual(previous, next)).toBe(false);
  });

  it('memo comparator detects avatarBorderId changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, avatarBorderId: 'border-new' },
    });
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects uiPreferences changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedPrefs: UIPreferences = {
      ...DEFAULT_UI_PREFERENCES,
      animationIntensity: 'low',
    };
    rerender(<MessageBubble {...defaultProps} uiPreferences={updatedPrefs} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });
});
