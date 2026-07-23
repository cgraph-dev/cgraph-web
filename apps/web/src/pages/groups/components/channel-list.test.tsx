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
  categories: [],
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

    render(
      <MemoryRouter>
        <ChannelList
          activeGroup={group}
          channelId="general"
          expandedCategories={new Set()}
          toggleCategory={vi.fn()}
          mobileVisible
          onBackToGroups={onBackToGroups}
          onCloseMobile={onCloseMobile}
        />
      </MemoryRouter>
    );

    const channelList = within(screen.getByTestId('groups-channel-list'));
    const mobileHeader = within(screen.getByTestId('groups-channel-list-mobile-header'));

    expect(mobileHeader.getByRole('link', { name: 'Open Alpha Team settings' })).toHaveAttribute(
      'href',
      '/groups/group-1/settings'
    );

    fireEvent.click(mobileHeader.getByRole('button', { name: 'Back to groups' }));
    expect(onBackToGroups).toHaveBeenCalledTimes(1);

    fireEvent.click(mobileHeader.getByRole('button', { name: 'Close channel list' }));
    expect(onCloseMobile).toHaveBeenCalledTimes(1);

    fireEvent.click(channelList.getByRole('link', { name: 'General' }));
    expect(onCloseMobile).toHaveBeenCalledTimes(2);
  });
});
