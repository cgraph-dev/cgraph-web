import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { NotificationProfile } from '@cgraph-dev/shared-types';
import { NotificationProfileEditor } from '../notification-profile-editor';

const profileActions = vi.hoisted(() => ({
  profiles: [] as unknown[],
  fetchProfiles: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
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

vi.mock('@/modules/settings/store/notification-profile-store', () => ({
  useNotificationProfileStore: () => profileActions,
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
  profileActions.createProfile.mockResolvedValue(notificationProfile());
  profileActions.updateProfile.mockResolvedValue(notificationProfile());
  profileActions.deleteProfile.mockResolvedValue(undefined);
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
});
