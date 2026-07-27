import { fireEvent, render, screen, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Group } from '@/modules/groups/store';
import { ChannelList } from './channel-list';

function withoutMotionProps(props: Record<string, unknown>) {
  const nextProps = { ...props };
  delete nextProps.animate;
  delete nextProps.initial;
  delete nextProps.layoutId;
  delete nextProps.transition;
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

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
  },
}));

vi.mock('@/modules/groups/store', async () => {
  const actual = await vi.importActual<typeof import('@/modules/groups/store')>(
    '@/modules/groups/store'
  );
  return {
    ...actual,
    useGroupStore: () => ({
      fetchGroup: vi.fn(),
    }),
  };
});

const group = {
  id: 'group-1',
  name: 'Alpha Team',
  slug: 'alpha-team',
  description: 'Product community',
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 12,
  onlineMemberCount: 3,
  ownerId: 'owner-1',
  categories: [
    {
      id: 'product',
      name: 'Product',
      position: 0,
      channels: [
        {
          id: 'news',
          name: 'News',
          type: 'announcement',
          topic: null,
          categoryId: 'product',
          position: 0,
          isNsfw: false,
          slowModeSeconds: 0,
          unreadCount: 7,
          lastMessageAt: null,
        },
      ],
    },
  ],
  channels: [
    {
      id: 'general',
      name: 'General',
      type: 'text',
      topic: null,
      categoryId: null,
      position: 0,
      isNsfw: false,
      slowModeSeconds: 0,
      unreadCount: 0,
      lastMessageAt: null,
    },
  ],
  roles: [],
  myMember: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
} satisfies Group;

describe('ChannelList', () => {
  it('provides explicit narrow back, close, settings, and channel transitions', () => {
    const onBackToGroups = vi.fn();
    const onCloseMobile = vi.fn();
    const toggleCategory = vi.fn();

    render(
      <MemoryRouter initialEntries={['/groups/group-1/channels/general']}>
        <ChannelList
          activeGroup={group}
          channelId="general"
          expandedCategories={new Set(['product'])}
          toggleCategory={toggleCategory}
          mobileVisible
          onBackToGroups={onBackToGroups}
          onCloseMobile={onCloseMobile}
        />
      </MemoryRouter>
    );

    const channelList = within(screen.getByTestId('groups-channel-list'));
    const mobileHeader = within(screen.getByTestId('groups-channel-list-mobile-header'));
    const backButton = mobileHeader.getByRole('button', { name: 'Back to groups' });
    const closeButton = mobileHeader.getByRole('button', { name: 'Close channel list' });
    const settingsLink = mobileHeader.getByRole('link', { name: 'Open Alpha Team settings' });
    const categoryButton = channelList.getByRole('button', { name: 'Product' });
    const activeChannel = channelList.getByRole('link', { name: 'General' });
    const unreadChannel = channelList.getByRole('link', { name: /News/ });

    expect(settingsLink).toHaveAttribute('href', '/groups/group-1/settings');
    for (const control of [backButton, closeButton, settingsLink, categoryButton, activeChannel]) {
      expect(control).toHaveAttribute('data-cgraph-surface', 'control');
    }
    expect(activeChannel).toHaveAttribute('aria-current', 'page');
    expect(activeChannel).toHaveAttribute('data-cgraph-state', 'selected');
    expect(categoryButton).toHaveAttribute('aria-expanded', 'true');
    expect(unreadChannel).toHaveTextContent('7');
    expect(channelList.queryByText('You')).not.toBeInTheDocument();

    fireEvent.click(backButton);
    expect(onBackToGroups).toHaveBeenCalledTimes(1);

    fireEvent.click(closeButton);
    expect(onCloseMobile).toHaveBeenCalledTimes(1);

    fireEvent.click(activeChannel);
    expect(onCloseMobile).toHaveBeenCalledTimes(2);

    fireEvent.click(categoryButton);
    expect(toggleCategory).toHaveBeenCalledWith('product');
  });
});
