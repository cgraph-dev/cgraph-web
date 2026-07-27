import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ChannelsTab } from '../channels-tab';

const apiMocks = vi.hoisted(() => ({
  createChannel: vi.fn(),
  getChannels: vi.fn(),
  delete: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    groups: {
      createChannel: apiMocks.createChannel,
      getChannels: apiMocks.getChannels,
    },
  },
  http: {
    delete: apiMocks.delete,
    put: apiMocks.put,
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
    const { variant: _variant, ...elementProps } = props;
    return <div {...elementProps}>{children}</div>;
  },
}));

vi.mock('../channel-categories-panel', () => ({
  ChannelCategoriesPanel: () => <div data-testid="channel-categories-panel" />,
}));

vi.mock('../channel-permissions-panel', () => ({
  ChannelPermissionsPanel: () => <div data-testid="channel-permissions-panel" />,
}));

vi.mock('../delete-channel-modal', () => ({
  DeleteChannelModal: () => null,
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

const channelResponse = [
  {
    id: 'category-1',
    name: 'Core',
    position: 0,
    channels: [
      {
        id: 'general',
        name: 'general',
        type: 'text',
        topic: 'General discussion',
        position: 0,
        category_id: 'category-1',
        is_nsfw: false,
        slow_mode_seconds: 0,
      },
      {
        id: 'news',
        name: 'news',
        type: 'announcement',
        topic: null,
        position: 1,
        category_id: 'category-1',
        is_nsfw: false,
        slow_mode_seconds: 0,
      },
    ],
  },
];

describe('ChannelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getChannels.mockResolvedValue({ ok: true, data: channelResponse });
    apiMocks.createChannel.mockResolvedValue({ ok: true, data: {} });
    apiMocks.put.mockResolvedValue({});
  });

  it('loads the mounted channel owner with explicit reorder boundaries', async () => {
    render(<ChannelsTab groupId="group-1" />);

    await screen.findByText('general');

    expect(screen.getByTestId('channel-categories-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move general up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move general down' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move news up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move news down' })).toBeDisabled();
  });

  it('normalizes and creates a channel through the typed group client', async () => {
    render(<ChannelsTab groupId="group-1" />);
    await screen.findByText('general');

    fireEvent.click(screen.getByRole('button', { name: 'Create Channel' }));
    fireEvent.change(screen.getByPlaceholderText('channel-name'), {
      target: { value: 'Product Updates' },
    });
    fireEvent.change(screen.getByPlaceholderText('Channel topic (optional)'), {
      target: { value: 'Release notes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(apiMocks.createChannel).toHaveBeenCalledWith('group-1', {
        name: 'product-updates',
        type: 'text',
        description: 'Release notes',
      });
    });
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
    await waitFor(() => expect(apiMocks.getChannels).toHaveBeenCalledTimes(2));

    const list = screen.getByRole('list', { name: 'Channels' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((row) => row.getAttribute('data-testid'))
    ).toEqual(['channel-settings-row-general', 'channel-settings-row-news']);
  });
});
