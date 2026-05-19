import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import type { ChannelMessage } from '@/modules/groups/store';
import { PinnedMessagesPanel } from './pinned-messages-panel';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  getErrorMessage: (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return typeof error.message === 'string' ? error.message : '';
    }

    return '';
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
  }),
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function makeMessage(overrides: Partial<ChannelMessage> = {}): ChannelMessage {
  return {
    id: 'message-1',
    channelId: 'channel-1',
    authorId: 'user-1',
    content: 'Pinned proof message',
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: true,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    author: {
      id: 'user-1',
      username: 'owner',
      displayName: 'Owner',
      avatarUrl: null,
      member: null,
    },
    createdAt: '2026-05-19T00:00:00.000Z',
    ...overrides,
  };
}

function renderPanel(overrides: { onUnpin?: ReturnType<typeof vi.fn> } = {}) {
  return render(
    <PinnedMessagesPanel
      groupId="group-1"
      channelId="channel-1"
      channelMessages={[makeMessage()]}
      onClose={vi.fn()}
      onUnpin={overrides.onUnpin}
    />
  );
}

describe('PinnedMessagesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps a pinned message visible and reports permission errors when unpin is denied', async () => {
    const onUnpin = vi.fn();
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'pin-1',
            channel_id: 'channel-1',
            message_id: 'message-1',
            pinned_by_id: 'user-1',
            position: 1,
            pinned_at: '2026-05-19T00:00:00.000Z',
          },
        ],
      },
    });
    mockedHttp.delete.mockRejectedValueOnce({
      response: { status: 403 },
      message: 'Forbidden',
    });

    renderPanel({ onUnpin });

    expect(await screen.findByText('Pinned proof message')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Unpin Pinned proof message' }));

    expect(
      await screen.findByText('You do not have permission to unpin messages in this channel.')
    ).toBeInTheDocument();
    expect(screen.getByText('Pinned proof message')).toBeInTheDocument();
    expect(onUnpin).not.toHaveBeenCalled();
  });

  it('reports permission errors when pinned messages cannot be viewed', async () => {
    mockedHttp.get.mockRejectedValueOnce({
      response: { status: 403 },
      message: 'Forbidden',
    });

    renderPanel();

    expect(
      await screen.findByText('You do not have permission to view pinned messages in this channel.')
    ).toBeInTheDocument();
    expect(screen.getByText('No pinned messages')).toBeInTheDocument();
  });
});
