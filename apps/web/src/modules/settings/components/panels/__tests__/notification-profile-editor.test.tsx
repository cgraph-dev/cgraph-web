import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { NotificationProfile } from '@cgraph-dev/shared-types';
import { NotificationProfileEditor } from '../notification-profile-editor';

const profileActions = vi.hoisted(() => ({
  profiles: [] as unknown[],
  isMutating: false,
  fetchProfiles: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
  setAllowedMembers: vi.fn(),
}));

const friendActions = vi.hoisted(() => ({
  friends: [] as Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  }>,
  fetchFriends: vi.fn(),
  error: null as string | null,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
  },
}));

function TestButton({
  children,
  animated: _animated,
  isLoading,
  leftIcon,
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    animated?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
  }
>) {
  return (
    <button {...props} disabled={props.disabled || isLoading}>
      {leftIcon}
      {children}
    </button>
  );
}

function TestDialog({ children, open }: PropsWithChildren<{ open: boolean }>) {
  return open ? <>{children}</> : null;
}

function TestDialogContent({
  children,
  ariaLabel,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { ariaLabel?: string }>) {
  return (
    <div {...props} role="dialog" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

vi.mock('@/shared/components/ui', () => ({
  Button: TestButton,
  Dialog: TestDialog,
  DialogContent: TestDialogContent,
  DialogDescription: ({ children }: PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
  DialogHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
  DialogTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
  GlassCard: ({ children }: PropsWithChildren) => <div>{children}</div>,
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../notification-profile-delete-dialog', () => ({
  NotificationProfileDeleteDialog: ({
    profileName,
    open,
    isDeleting,
    onOpenChange,
    onConfirm,
  }: {
    profileName: string;
    open: boolean;
    isDeleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Delete notification profile">
        <p>Delete {profileName}?</p>
        <button type="button" disabled={isDeleting} onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button type="button" disabled={isDeleting} onClick={onConfirm}>
          Delete profile
        </button>
      </div>
    ) : null,
}));

vi.mock('@/modules/settings/store/notification-profile-store', () => ({
  useNotificationProfileStore: () => profileActions,
}));

vi.mock('@/modules/social/store/friendStore', () => ({
  useFriendStore: () => friendActions,
}));

function notificationProfile(overrides: Partial<NotificationProfile> = {}): NotificationProfile {
  return {
    id: 'profile-1',
    name: 'Focus',
    emoji: '',
    color: '#7c3aed',
    allow_all_calls: true,
    allow_all_mentions: false,
    schedule: {
      id: 'schedule-1',
      enabled: false,
      start_time: 900,
      end_time: 1700,
      days_enabled: [1, 2, 3, 4, 5],
    },
    allowed_members: [],
    inserted_at: '2026-07-24T00:00:00Z',
    updated_at: '2026-07-24T00:00:00Z',
    ...overrides,
  };
}

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname}</output>;
}

function renderEditor(initialEntry: string): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CurrentLocation />
      <Routes>
        <Route
          path="/me/settings/:section/:detail"
          element={<NotificationProfileEditor />}
        />
        <Route path="/me/settings/notification-profiles" element={<div>Profiles</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  profileActions.profiles = [];
  profileActions.isMutating = false;
  profileActions.createProfile.mockResolvedValue(notificationProfile());
  profileActions.updateProfile.mockResolvedValue(notificationProfile());
  profileActions.deleteProfile.mockResolvedValue(true);
  profileActions.setAllowedMembers.mockResolvedValue(notificationProfile());
  friendActions.friends = [];
  friendActions.fetchFriends.mockResolvedValue(undefined);
  friendActions.error = null;
});

describe('NotificationProfileEditor', () => {
  it('uses the nested settings route detail param for the create screen', () => {
    renderEditor('/me/settings/notification-profiles/new');

    expect(screen.getByRole('heading', { name: 'Create Profile' })).toBeInTheDocument();
  });

  it('creates a complete profile and schedule in one save before navigating', async () => {
    const user = userEvent.setup();
    renderEditor('/me/settings/notification-profiles/new');

    await user.type(screen.getByPlaceholderText('e.g. Work, Sleep, Focus'), 'Focus');
    await user.click(screen.getByRole('button', { name: 'Create Profile' }));

    expect(profileActions.createProfile).toHaveBeenCalledTimes(1);
    expect(profileActions.createProfile).toHaveBeenCalledWith({
      name: 'Focus',
      emoji: '',
      color: '#7c3aed',
      allow_all_calls: true,
      allow_all_mentions: false,
      schedule: {
        enabled: false,
        start_time: 900,
        end_time: 1700,
        days_enabled: [1, 2, 3, 4, 5],
      },
    });
    expect(profileActions.updateProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/me/settings/notification-profiles'
    );
  });

  it('does not navigate after a rejected create', async () => {
    const user = userEvent.setup();
    profileActions.createProfile.mockResolvedValueOnce(null);
    renderEditor('/me/settings/notification-profiles/new');

    await user.type(screen.getByPlaceholderText('e.g. Work, Sleep, Focus'), 'Focus');
    await user.click(screen.getByRole('button', { name: 'Create Profile' }));

    expect(profileActions.createProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/me/settings/notification-profiles/new'
    );
  });

  it('updates the full persisted profile state in one save', async () => {
    const user = userEvent.setup();
    const existing = notificationProfile({
      name: 'Evening',
      allow_all_calls: false,
      allow_all_mentions: true,
      schedule: {
        id: 'schedule-1',
        enabled: true,
        start_time: 2200,
        end_time: 700,
        days_enabled: [1, 3, 5],
      },
    });
    profileActions.profiles = [existing];
    profileActions.updateProfile.mockResolvedValueOnce({ ...existing, name: 'Night' });
    renderEditor('/me/settings/notification-profiles/profile-1');

    const nameInput = await screen.findByDisplayValue('Evening');
    await screen.findByDisplayValue('22:00');
    await user.clear(nameInput);
    await user.type(nameInput, 'Night');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(profileActions.updateProfile).toHaveBeenCalledTimes(1);
    expect(profileActions.updateProfile).toHaveBeenCalledWith('profile-1', {
      name: 'Night',
      emoji: '',
      color: '#7c3aed',
      allow_all_calls: false,
      allow_all_mentions: true,
      schedule: {
        enabled: true,
        start_time: 2200,
        end_time: 700,
        days_enabled: [1, 3, 5],
      },
    });
    expect(profileActions.createProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/me/settings/notification-profiles'
    );
  });

  it('replaces the selected allowed-contact set through the profile store', async () => {
    const user = userEvent.setup();
    const existing = notificationProfile({
      allowed_members: [{ id: 'friend-1', username: 'ada', avatar_url: null }],
    });
    const saved = notificationProfile({
      allowed_members: [{ id: 'friend-2', username: 'grace', avatar_url: null }],
    });

    profileActions.profiles = [existing];
    profileActions.setAllowedMembers.mockResolvedValueOnce(saved);
    friendActions.friends = [
      { id: 'friend-1', username: 'ada', displayName: 'Ada Lovelace', avatarUrl: null },
      { id: 'friend-2', username: 'grace', displayName: 'Grace Hopper', avatarUrl: null },
    ];
    renderEditor('/me/settings/notification-profiles/profile-1');

    await user.click(await screen.findByRole('button', { name: 'Manage' }));
    expect(friendActions.fetchFriends).toHaveBeenCalledTimes(1);
    await screen.findByRole('dialog', { name: 'Allowed contacts' });

    await user.click(screen.getByRole('checkbox', { name: 'Allow Ada Lovelace' }));
    await user.click(screen.getByRole('checkbox', { name: 'Allow Grace Hopper' }));
    await user.click(screen.getByRole('button', { name: 'Save allowed contacts' }));

    expect(profileActions.setAllowedMembers).toHaveBeenCalledWith('profile-1', ['friend-2']);
  });

  it('requires confirmation and navigates only after deletion succeeds', async () => {
    const user = userEvent.setup();
    profileActions.profiles = [notificationProfile()];
    renderEditor('/me/settings/notification-profiles/profile-1');

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(profileActions.deleteProfile).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Delete notification profile' })
    ).toHaveTextContent('Delete Focus?');

    await user.click(screen.getByRole('button', { name: 'Delete profile' }));

    expect(profileActions.deleteProfile).toHaveBeenCalledWith('profile-1');
    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/me/settings/notification-profiles'
    );
  });

  it('keeps the editor and confirmation open when deletion is rejected', async () => {
    const user = userEvent.setup();
    profileActions.profiles = [notificationProfile()];
    profileActions.deleteProfile.mockResolvedValueOnce(false);
    renderEditor('/me/settings/notification-profiles/profile-1');

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete profile' }));

    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/me/settings/notification-profiles/profile-1'
    );
    expect(
      screen.getByRole('dialog', { name: 'Delete notification profile' })
    ).toBeInTheDocument();
  });
});
