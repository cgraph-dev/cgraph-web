/** @module notification-settings-panel tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/push', () => ({
  isPushSupported: () => false,
  getPushPermission: () => 'unsupported',
  requestPushPermission: vi.fn().mockResolvedValue('denied'),
  subscribeToPush: vi.fn().mockResolvedValue(null),
  unsubscribeFromPush: vi.fn().mockResolvedValue(true),
}));

const mockUpdateNotificationSettings = vi.fn().mockResolvedValue(undefined);
const mockFetchSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      notifications: {
        notifyMessages: true,
        notifyMentions: true,
        notifyForumReplies: false,
        notifyFriendRequests: true,
        notifyGroupInvites: false,
        emailNotifications: true,
        pushNotifications: false,
        notificationSound: true,
      },
    },
    updateNotificationSettings: mockUpdateNotificationSettings,
    fetchSettings: mockFetchSettings,
    isSaving: false,
  })),
}));

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    animated: _animated,
    children,
    size: _size,
    variant: _variant,
    ...props
  }: React.PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      animated?: boolean;
      size?: string;
      variant?: string;
    }
  >) => <button {...props}>{children}</button>,
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  Skeleton: ({ className }: { className?: string }) => <div className={className} />,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { NotificationSettingsPanel } from '../notification-settings-panel';

function renderPanel() {
  return render(
    <MemoryRouter>
      <NotificationSettingsPanel />
    </MemoryRouter>
  );
}

describe('NotificationSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSettings.mockResolvedValue(undefined);
  });

  it('renders after loading', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });
  });

  it('renders key notification setting labels', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Forum Replies/i)).toBeInTheDocument();
    expect(screen.getByText(/Friend Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
  });

  it('calls fetchSettings on mount', async () => {
    renderPanel();
    await waitFor(() => {
      expect(mockFetchSettings).toHaveBeenCalled();
    });
  });

  it('renders toggle switches', async () => {
    renderPanel();
    await waitFor(() => {
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(8);
    });
  });

  it('calls updateNotificationSettings when a toggle is clicked', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });

    const toggle = screen.getAllByRole('switch')[0]!;
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({ notifyMessages: false });
    });
  });
});
