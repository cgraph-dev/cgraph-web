import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ChannelsTab } from '../channels-tab';

const apiMocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    delete: apiMocks.delete,
    get: apiMocks.get,
    post: apiMocks.post,
    put: apiMocks.put,
  },
}));

vi.mock('../channel-categories-panel', () => ({
  ChannelCategoriesPanel: () => <div data-testid="channel-categories-panel" />,
}));

vi.mock('../channel-permissions-panel', () => ({
  ChannelPermissionsPanel: () => <div data-testid="channel-permissions-panel" />,
}));

function withoutMotionProps(props: Record<string, unknown>) {
  const nextProps = { ...props };
  delete nextProps.animate;
  delete nextProps.exit;
  delete nextProps.initial;
  delete nextProps.transition;
  delete nextProps.variants;
  delete nextProps.whileHover;
  delete nextProps.whileTap;
  return nextProps;
}

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <button {...withoutMotionProps(props)}>{children}</button>
    ),
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...withoutMotionProps(props)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

const channelResponse = {
  data: [
    {
      id: 'general',
      name: 'general',
      type: 'text',
      topic: 'General discussion',
      position: 0,
      category_id: 'category-1',
      nsfw: false,
      slowmode_seconds: 0,
    },
    {
      id: 'news',
      name: 'news',
      type: 'announcement',
      topic: null,
      position: 1,
      category_id: 'category-1',
      nsfw: false,
      slowmode_seconds: 0,
    },
  ],
  meta: { total: 2 },
};

describe('ChannelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.get.mockResolvedValue({ data: channelResponse });
    apiMocks.post.mockResolvedValue({});
    apiMocks.delete.mockResolvedValue({});
    apiMocks.put.mockResolvedValue({});
  });

  it('loads the flat backend channel response with explicit reorder boundaries', async () => {
    render(<ChannelsTab groupId="group-1" />);

    await screen.findByText('general');

    expect(apiMocks.get).toHaveBeenCalledWith('/api/v1/groups/group-1/channels');
    expect(screen.getByTestId('channel-categories-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move general up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move general down' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move news up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move news down' })).toBeDisabled();
  });

  it('normalizes and creates a channel with the backend topic contract', async () => {
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Create Channel' }));
    fireEvent.change(screen.getByPlaceholderText('channel-name'), {
      target: { value: 'Product Updates' },
    });
    fireEvent.change(screen.getByPlaceholderText('Channel topic (optional)'), {
      target: { value: ' Release notes ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/api/v1/groups/group-1/channels', {
        name: 'product-updates',
        type: 'text',
        topic: 'Release notes',
      });
    });
  });

  it('updates a channel through the exact backend fields', async () => {
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Edit general' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Channel name for general' }), {
      target: { value: 'Team Chat' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Channel topic for general' }), {
      target: { value: ' Team discussion ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith('/api/v1/groups/group-1/channels/general', {
        name: 'team-chat',
        topic: 'Team discussion',
      })
    );
  });

  it('retains the channel edit draft and reports a rejected update', async () => {
    apiMocks.put.mockRejectedValueOnce(new Error('update failed'));
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Edit general' }));
    const nameInput = screen.getByRole('textbox', { name: 'Channel name for general' });
    fireEvent.change(nameInput, { target: { value: 'team-chat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('update failed');
    expect(nameInput).toHaveValue('team-chat');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('uses destructive confirmation and removes only after server success', async () => {
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Delete general' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Channel' });
    expect(dialog).toHaveTextContent('permanently delete the channel and all its messages');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(apiMocks.delete).toHaveBeenCalledWith('/api/v1/groups/group-1/channels/general')
    );
    expect(screen.queryByText('general')).not.toBeInTheDocument();
  });

  it('persists the complete channel ID order after an explicit move', async () => {
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Move general down' }));

    await waitFor(() => {
      expect(apiMocks.put).toHaveBeenCalledWith('/api/v1/groups/group-1/channels/reorder', {
        channel_ids: ['news', 'general'],
      });
    });

    const list = screen.getByRole('list', { name: 'Channels' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((row) => row.getAttribute('data-testid'))
    ).toEqual(['channel-settings-row-news', 'channel-settings-row-general']);
  });

  it('restores server order and reports an ordering failure', async () => {
    apiMocks.put.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Move general down' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    await waitFor(() => expect(apiMocks.get).toHaveBeenCalledTimes(2));

    const list = screen.getByRole('list', { name: 'Channels' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((row) => row.getAttribute('data-testid'))
    ).toEqual(['channel-settings-row-general', 'channel-settings-row-news']);
  });

  it('shows a recoverable channel load failure', async () => {
    apiMocks.get.mockRejectedValue(new Error('offline'));
    render(<ChannelsTab groupId="group-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load channels. Please try again.'
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByText('No channels yet.')).not.toBeInTheDocument();
  });
});
