import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Group } from '@/modules/groups/store';
import { useGroupStore } from '@/modules/groups/store';
import { http } from '@/lib/api-client';
import { NotificationsTab } from '../notifications-tab';

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    patch: vi.fn(),
  },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: (name: string) => ({
      ...actual.createLogger(name),
      error: vi.fn(),
    }),
  };
});

const group = {
  id: 'group-1',
  name: 'Builders',
  slug: 'builders',
  description: null,
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 1,
  onlineMemberCount: 1,
  ownerId: 'user-1',
  categories: [],
  channels: [],
  roles: [],
  myMember: {
    id: 'member-1',
    userId: 'user-1',
    nickname: null,
    notifications: 'mentions',
    suppressEveryone: true,
    user: {
      id: 'user-1',
      username: 'trick',
      displayName: 'Trick',
      avatarUrl: null,
      status: 'online',
    },
    roles: [],
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
} satisfies Group;

describe('NotificationsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGroupStore).mockReturnValue({ groups: [group] } as ReturnType<
      typeof useGroupStore
    >);
    vi.mocked(http.patch).mockResolvedValue({ data: {} });
  });

  it('persists only the supported notification fields', async () => {
    render(<NotificationsTab groupId="group-1" />);

    expect(screen.getByRole('radio', { name: /Only @Mentions/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Suppress @everyone' })).toBeChecked();
    expect(screen.queryByText('Suppress Role Mentions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /All Messages/ }));
    fireEvent.click(screen.getByRole('switch', { name: 'Suppress @everyone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    await waitFor(() => {
      expect(http.patch).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/members/me/notifications',
        {
          notifications: 'all',
          suppress_everyone: false,
        }
      );
    });
    expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
  });

  it('keeps the supported state visible and reports a failed save', async () => {
    vi.mocked(http.patch).mockRejectedValueOnce(new Error('offline'));

    render(<NotificationsTab groupId="group-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(
      await screen.findByText('Failed to save notification preferences. Please try again.')
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('radio', { name: /Only @Mentions/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Suppress @everyone' })).toBeChecked();
  });
});
