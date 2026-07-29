import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsTab } from '../notifications-tab';
import type { Notification } from '../types';

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notification-1',
    type: 'friend_request',
    title: 'New friend request',
    message: 'Alice sent you a friend request',
    timestamp: new Date('2026-07-09T00:00:00.000Z'),
    read: false,
    actionUrl: '/social/friends',
    avatarUrl: null,
    ...overrides,
  };
}

function renderNotifications(overrides: Partial<React.ComponentProps<typeof NotificationsTab>> = {}) {
  const onMarkAsRead = vi.fn();
  const onMarkAllAsRead = vi.fn();
  const view = render(
    <NotificationsTab
      notifications={[makeNotification()]}
      onMarkAsRead={onMarkAsRead}
      onMarkAllAsRead={onMarkAllAsRead}
      {...overrides}
    />
  );

  return { ...view, onMarkAsRead, onMarkAllAsRead };
}

describe('NotificationsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unread notifications as keyboard-addressable list actions', () => {
    const { onMarkAsRead, container } = renderNotifications({
      notifications: [
        makeNotification({
          avatarUrl: 'https://cdn.example.com/alice.png',
        }),
      ],
    });

    expect(screen.getByRole('list', { name: 'Notifications list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
    expect(container.querySelector('img[src="https://cdn.example.com/alice.png"]')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Open unread notification: New friend request' })
    );

    expect(onMarkAsRead).toHaveBeenCalledWith('notification-1');
    expect(navigate).toHaveBeenCalledWith('/social/friends');
  });

  it('marks every unread notification from the shared action', () => {
    const { onMarkAllAsRead } = renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('does not re-mark already-read notifications before navigating', () => {
    const { onMarkAsRead } = renderNotifications({
      notifications: [
        makeNotification({
          read: true,
          title: 'Friend accepted',
          type: 'friend_accepted',
          actionUrl: '/user/alice',
        }),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open notification: Friend accepted' }));

    expect(onMarkAsRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/user/alice');
  });

  it('marks unread notifications without action routes as read in place', () => {
    const { onMarkAsRead } = renderNotifications({
      notifications: [
        makeNotification({
          type: 'system',
          title: 'System notice',
          actionUrl: undefined,
        }),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark notification as read: System notice' }));

    expect(onMarkAsRead).toHaveBeenCalledWith('notification-1');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the empty state non-actionable', () => {
    renderNotifications({ notifications: [] });

    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Notifications list' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark All as Read' })).not.toBeInTheDocument();
  });
});
