import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CreateNotificationProfileRequest,
  NotificationProfile,
  UpdateNotificationProfileRequest,
} from '@cgraph-dev/shared-types';

const notificationProfilesApi = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  setMembers: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    notificationProfiles: notificationProfilesApi,
  },
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useNotificationProfileStore } from '../notification-profile-store';

function ok<T>(data: T) {
  return { ok: true as const, data };
}

function failure(message: string) {
  return {
    ok: false as const,
    error: { code: 'validation_failed', message },
    status: 422,
  };
}

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

const createParams: CreateNotificationProfileRequest = {
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
};

const updateParams: UpdateNotificationProfileRequest = {
  name: 'Night',
  emoji: '',
  color: '#d97706',
  allow_all_calls: false,
  allow_all_mentions: true,
  schedule: {
    enabled: true,
    start_time: 2200,
    end_time: 700,
    days_enabled: [1, 3, 5],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  useNotificationProfileStore.setState({
    profiles: [],
    activeProfile: null,
    isLoading: false,
    error: null,
  });
});

describe('NotificationProfileStore', () => {
  it('forwards a complete create command to the typed API client and projects its result', async () => {
    const saved = notificationProfile();
    notificationProfilesApi.create.mockResolvedValueOnce(ok(saved));

    await expect(useNotificationProfileStore.getState().createProfile(createParams)).resolves.toEqual(
      saved
    );

    expect(notificationProfilesApi.create).toHaveBeenCalledWith(createParams);
    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [saved],
      isLoading: false,
      error: null,
    });
  });

  it('forwards a complete update command and replaces the profile only after the server succeeds', async () => {
    const existing = notificationProfile();
    const saved = notificationProfile({
      name: 'Night',
      color: '#d97706',
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
    useNotificationProfileStore.setState({ profiles: [existing] });
    notificationProfilesApi.update.mockResolvedValueOnce(ok(saved));

    await expect(
      useNotificationProfileStore.getState().updateProfile(existing.id, updateParams)
    ).resolves.toEqual(saved);

    expect(notificationProfilesApi.update).toHaveBeenCalledWith(existing.id, updateParams);
    expect(useNotificationProfileStore.getState().profiles).toEqual([saved]);
  });

  it('keeps the prior profile projection when an atomic update is rejected', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({ profiles: [existing] });
    notificationProfilesApi.update.mockResolvedValueOnce(failure('Schedule is invalid'));

    await expect(
      useNotificationProfileStore.getState().updateProfile(existing.id, updateParams)
    ).resolves.toBeNull();

    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      isLoading: false,
      error: 'Schedule is invalid',
    });
  });

  it('uses the typed member-set command and only projects it after success', async () => {
    const existing = notificationProfile();
    const saved = notificationProfile({
      allowed_members: [{ id: 'friend-1', username: 'ada', avatar_url: null }],
    });
    useNotificationProfileStore.setState({ profiles: [existing] });
    notificationProfilesApi.setMembers.mockResolvedValueOnce(ok(saved));

    await expect(
      useNotificationProfileStore.getState().setAllowedMembers(existing.id, ['friend-1'])
    ).resolves.toEqual(saved);

    expect(notificationProfilesApi.setMembers).toHaveBeenCalledWith(existing.id, ['friend-1']);
    expect(useNotificationProfileStore.getState().profiles).toEqual([saved]);
  });

  it('keeps the prior allowed-contact projection when the typed member-set command is rejected', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({ profiles: [existing] });
    notificationProfilesApi.setMembers.mockResolvedValueOnce(failure('Allowed contacts must be friends'));

    await expect(
      useNotificationProfileStore.getState().setAllowedMembers(existing.id, ['stranger-1'])
    ).resolves.toBeNull();

    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      isLoading: false,
      error: 'Allowed contacts must be friends',
    });
  });
});
