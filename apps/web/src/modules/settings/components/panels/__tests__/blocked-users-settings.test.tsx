import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const profileStore = vi.hoisted(() => ({
  blockedUsers: [
    {
      id: 'user-1',
      username: 'blocked-user',
      displayName: 'Blocked User',
      avatarUrl: null,
      blockedAt: '2026-07-13T12:00:00Z',
    },
  ],
  isLoadingBlocked: false,
  fetchBlockedUsers: vi.fn(),
  unblockUser: vi.fn(),
}));

vi.mock('@/modules/social/store', () => ({
  useProfileStore: vi.fn(() => profileStore),
}));

vi.mock('@/shared/components/ui', () => ({
  Avatar: ({ name }: { name: string }) => <div>{name}</div>,
  Button: ({
    children,
    isLoading,
    ...props
  }: Record<string, unknown> & { children?: React.ReactNode; isLoading?: boolean }) => (
    <button {...props} disabled={Boolean(props.disabled) || isLoading}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
  Dialog: ({
    open,
    children,
  }: Record<string, unknown> & { open?: boolean; children?: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({
    children,
    ariaLabel,
  }: Record<string, unknown> & { children?: React.ReactNode; ariaLabel?: string }) => (
    <div aria-label={ariaLabel}>{children}</div>
  ),
  DialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  GlassCard: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { BlockedUsersSettings } from '../blocked-users-settings';

const firstPage = {
  endCursor: 'next-cursor',
  hasNextPage: true,
  totalCount: 51,
};

function renderPanel() {
  return render(<BlockedUsersSettings />);
}

describe('BlockedUsersSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileStore.blockedUsers = [
      {
        id: 'user-1',
        username: 'blocked-user',
        displayName: 'Blocked User',
        avatarUrl: null,
        blockedAt: '2026-07-13T12:00:00Z',
      },
    ];
    profileStore.isLoadingBlocked = false;
    profileStore.fetchBlockedUsers.mockResolvedValue(firstPage);
    profileStore.unblockUser.mockResolvedValue(undefined);
  });

  it('loads the initial page and presents its total count', async () => {
    renderPanel();

    await waitFor(() => {
      expect(profileStore.fetchBlockedUsers).toHaveBeenCalledWith({ limit: 50, includeTotal: true });
    });
    expect(screen.getByText('51 blocked')).toBeInTheDocument();
  });

  it('announces the initial dialog loading state', () => {
    profileStore.blockedUsers = [];
    profileStore.isLoadingBlocked = true;
    profileStore.fetchBlockedUsers.mockImplementation(() => new Promise(() => undefined));

    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    expect(screen.getByRole('status', { name: 'Loading blocked users' })).toBeInTheDocument();
  });

  it('loads the next cursor page from the explicit dialog action', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
    });
    profileStore.fetchBlockedUsers.mockResolvedValueOnce({
      endCursor: null,
      hasNextPage: false,
      totalCount: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => {
      expect(profileStore.fetchBlockedUsers).toHaveBeenLastCalledWith({
        cursor: 'next-cursor',
        limit: 50,
        append: true,
      });
    });
  });

  it('requires confirmation and only reports removal after unblock succeeds', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Unblock' }));
    expect(profileStore.unblockUser).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Unblock Blocked User?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unblock user' }));

    await waitFor(() => {
      expect(profileStore.unblockUser).toHaveBeenCalledWith('user-1');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Blocked User is no longer blocked.');
  });

  it('shows a retry action when the blocked-user reload fails', async () => {
    profileStore.fetchBlockedUsers
      .mockRejectedValueOnce(new Error('Could not load blocked users'))
      .mockResolvedValueOnce(firstPage);

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load blocked users');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(profileStore.fetchBlockedUsers).toHaveBeenCalledTimes(2);
    });
  });
});
