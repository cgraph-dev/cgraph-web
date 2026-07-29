import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ChannelMessage, Role } from '@/modules/groups/store';
import { ChannelMessageItem } from './channel-message-item';

vi.mock('@/modules/chat/components/emoji-picker', () => ({
  EmojiPicker: ({
    isOpen,
    onSelect,
  }: {
    isOpen: boolean;
    onSelect: (emoji: string) => void;
  }) =>
    isOpen ? (
      <button type="button" onClick={() => onSelect('🎉')}>
        Choose celebration
      </button>
    ) : null,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({
    alt,
    avatarBorderId,
    fallbackText,
  }: {
    alt: string;
    avatarBorderId?: string | null;
    fallbackText?: string;
  }) => (
    <span
      data-testid={`avatar-${alt}`}
      data-avatar-border-id={avatarBorderId}
      data-fallback-text={fallbackText}
    />
  ),
}));

function makeRole(overrides: Partial<Role>): Role {
  return {
    id: 'role',
    name: 'Member',
    color: '#687486',
    position: 0,
    permissions: 0,
    isDefault: false,
    isHoisted: false,
    isMentionable: false,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<ChannelMessage> = {}): ChannelMessage {
  return {
    id: 'message-1',
    channelId: 'channel-1',
    authorId: 'user-1',
    content: 'Original message',
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [{ emoji: '👍', count: 2, hasReacted: true }],
    author: {
      id: 'user-1',
      username: 'owner',
      displayName: 'Owner',
      avatarUrl: null,
      member: null,
    },
    createdAt: '2026-07-29T00:00:00.000Z',
    ...overrides,
  };
}

function renderMessage(
  overrides: Partial<React.ComponentProps<typeof ChannelMessageItem>> = {}
) {
  const props: React.ComponentProps<typeof ChannelMessageItem> = {
    message: makeMessage(),
    showHeader: true,
    onReply: vi.fn(),
    onOpenThread: vi.fn(),
    onEditMessage: vi.fn(),
    onDeleteMessage: vi.fn(),
    onPinMessage: vi.fn(),
    onCopyLink: vi.fn(),
    onReport: vi.fn(),
    onReaction: vi.fn(),
    onToggleReaction: vi.fn(),
    currentUserId: 'user-1',
    canManageMessages: true,
    threadReplyCount: 2,
    ...overrides,
  };

  return {
    ...render(
      <MemoryRouter>
        <ChannelMessageItem {...props} />
      </MemoryRouter>
    ),
    props,
  };
}

describe('ChannelMessageItem', () => {
  it('links the author identity and preserves avatar and highest-role cosmetics', () => {
    const roles = [
      makeRole({ id: 'member', name: 'Member', color: '#687486', position: 1 }),
      makeRole({ id: 'owner', name: 'Owner', color: '#25c48a', position: 20 }),
      makeRole({
        id: 'default',
        name: 'Everyone',
        color: '#ffffff',
        position: 100,
        isDefault: true,
      }),
    ];
    renderMessage({
      message: makeMessage({
        author: {
          ...makeMessage().author,
          avatarBorderId: 'aurora-ring',
          member: {
            id: 'member-1',
            userId: 'user-1',
            nickname: null,
            user: {
              id: 'user-1',
              username: 'owner',
              displayName: 'Owner',
              avatarUrl: null,
              status: 'online',
            },
            roles,
            joinedAt: '2026-07-29T00:00:00.000Z',
          },
        },
      }),
    });

    expect(screen.getByRole('link', { name: 'View profile for Owner' })).toHaveAttribute(
      'href',
      '/owner'
    );
    expect(screen.getByRole('link', { name: 'Open profile for Owner' })).toHaveAttribute(
      'href',
      '/owner'
    );
    expect(screen.getByTestId('avatar-Owner')).toHaveAttribute(
      'data-avatar-border-id',
      'aurora-ring'
    );
    expect(screen.getByText('Owner', { selector: '.cgraph-role-badge' })).toHaveStyle({
      color: '#25c48a',
    });
    expect(roles.map((role) => role.id)).toEqual(['member', 'owner', 'default']);
  });

  it('reveals labelled shortcuts on keyboard focus and forwards reply actions', async () => {
    const { props } = renderMessage();
    const message = screen.getByRole('article', { name: 'Message from Owner' });

    fireEvent.focus(message);

    fireEvent.click(await screen.findByRole('button', { name: 'Reply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reply in thread' }));

    expect(props.onReply).toHaveBeenCalledOnce();
    expect(props.onOpenThread).toHaveBeenCalledOnce();
    expect(screen.getByRole('toolbar', { name: 'Message shortcuts' })).toBeInTheDocument();
  });

  it('exposes only permitted menu actions and forwards an edited message', async () => {
    const user = userEvent.setup();
    const onEditMessage = vi.fn().mockResolvedValue(undefined);
    renderMessage({ onEditMessage });

    fireEvent.focus(screen.getByRole('article', { name: 'Message from Owner' }));
    fireEvent.click(await screen.findByRole('button', { name: 'More message actions' }));

    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Pin' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Report' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const editor = screen.getByRole('textbox');
    await user.clear(editor);
    await user.type(editor, 'Updated message');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEditMessage).toHaveBeenCalledWith('Updated message');
  });

  it('preserves reaction state and filters owner-only actions for another user', async () => {
    const user = userEvent.setup();
    const onToggleReaction = vi.fn();
    renderMessage({
      currentUserId: 'user-2',
      canManageMessages: false,
      onToggleReaction,
    });

    const reaction = screen.getByRole('button', { name: 'Remove 👍 reaction (2)' });
    expect(reaction).toHaveAttribute('aria-pressed', 'true');
    await user.click(reaction);
    expect(onToggleReaction).toHaveBeenCalledWith('👍', true);

    fireEvent.focus(screen.getByRole('article', { name: 'Message from Owner' }));
    fireEvent.click(await screen.findByRole('button', { name: 'More message actions' }));

    expect(screen.getByRole('menuitem', { name: 'Report' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Pin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
