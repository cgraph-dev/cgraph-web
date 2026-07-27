import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { NotificationProfile } from '@cgraph-dev/shared-types';

const profileStore = vi.hoisted(() => ({
  profiles: [] as NotificationProfile[],
  activeProfile: null as NotificationProfile | null,
  isLoading: false,
  isMutating: false,
  error: null as string | null,
  fetchProfiles: vi.fn(),
  deleteProfile: vi.fn(),
  activateProfile: vi.fn(),
  deactivateProfile: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store/notification-profile-store', () => ({
  useNotificationProfileStore: () => profileStore,
}));

import { NotificationProfilesPanel } from '../notification-profiles-panel';

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

function renderPanel(): void {
  render(
    <MemoryRouter>
      <NotificationProfilesPanel />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  profileStore.profiles = [notificationProfile()];
  profileStore.activeProfile = null;
  profileStore.isLoading = false;
  profileStore.isMutating = false;
  profileStore.error = null;
  profileStore.fetchProfiles.mockResolvedValue(undefined);
  profileStore.activateProfile.mockResolvedValue(true);
  profileStore.deactivateProfile.mockResolvedValue(true);
});

describe('NotificationProfilesPanel', () => {
  it('loads the authoritative profile snapshot on mount', () => {
    renderPanel();

    expect(profileStore.fetchProfiles).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Edit Focus' })).toBeInTheDocument();
  });

  it('exposes profile activation through a labelled action menu', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Actions for Focus' }));
    const enableButton = screen.getByRole('menuitem', { name: 'Enable for 1 hour' });
    expect(enableButton).toHaveFocus();

    await user.click(enableButton);

    expect(profileStore.activateProfile).toHaveBeenCalledWith('profile-1', 60);
    expect(screen.queryByRole('menu', { name: 'Actions for Focus' })).not.toBeInTheDocument();
  });

  it('locks profile commands while a mutation is in progress', async () => {
    const user = userEvent.setup();
    profileStore.isMutating = true;
    renderPanel();

    expect(screen.getByRole('button', { name: 'Actions for Focus' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Actions for Focus' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps the menu open when activation is rejected', async () => {
    const user = userEvent.setup();
    profileStore.activateProfile.mockResolvedValueOnce(false);
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Actions for Focus' }));
    await user.click(screen.getByRole('menuitem', { name: 'Enable indefinitely' }));

    expect(screen.getByRole('menu', { name: 'Actions for Focus' })).toBeInTheDocument();
  });

  it('shows a load error and retries the authoritative snapshot', async () => {
    const user = userEvent.setup();
    profileStore.error = 'Profiles unavailable';
    renderPanel();

    expect(screen.getByRole('alert')).toHaveTextContent('Profiles unavailable');
    expect(profileStore.fetchProfiles).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(profileStore.fetchProfiles).toHaveBeenCalledTimes(2);
  });
});
