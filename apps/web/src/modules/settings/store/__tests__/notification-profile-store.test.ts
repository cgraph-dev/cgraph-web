import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CreateNotificationProfileRequest,
  NotificationProfile,
  UpdateNotificationProfileRequest,
} from '@cgraph-dev/shared-types';

const notificationProfilesApi = vi.hoisted(() => ({
  list: vi.fn(),
  getActive: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  setMembers: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    notificationProfiles: notificationProfilesApi,
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
    isMutating: false,
    error: null,
  });
});

describe('NotificationProfileStore', () => {
  it('loads the profile list and active profile as one authoritative snapshot', async () => {
    const active = notificationProfile();
    notificationProfilesApi.list.mockResolvedValueOnce(ok([active]));
    notificationProfilesApi.getActive.mockResolvedValueOnce(ok(active));

    await useNotificationProfileStore.getState().fetchProfiles();

    expect(notificationProfilesApi.list).toHaveBeenCalledOnce();
    expect(notificationProfilesApi.getActive).toHaveBeenCalledOnce();
    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [active],
      activeProfile: active,
      isLoading: false,
      error: null,
    });
  });

  it('keeps the prior snapshot when either profile read fails', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({
      profiles: [existing],
      activeProfile: existing,
    });
    notificationProfilesApi.list.mockResolvedValueOnce(ok([notificationProfile({ name: 'New' })]));
    notificationProfilesApi.getActive.mockResolvedValueOnce(failure('Active profile unavailable'));

    await useNotificationProfileStore.getState().fetchProfiles();

    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      activeProfile: existing,
      isLoading: false,
      error: 'Active profile unavailable',
    });
  });

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

  it('deletes through the typed client and then projects one authoritative snapshot', async () => {
    const deleted = notificationProfile();
    const remaining = notificationProfile({ id: 'profile-2', name: 'Sleep' });
    useNotificationProfileStore.setState({
      profiles: [deleted, remaining],
      activeProfile: deleted,
    });
    notificationProfilesApi.delete.mockResolvedValueOnce(
      ok({ id: deleted.id, deleted: true })
    );
    notificationProfilesApi.list.mockResolvedValueOnce(ok([remaining]));
    notificationProfilesApi.getActive.mockResolvedValueOnce(ok(null));

    await expect(
      useNotificationProfileStore.getState().deleteProfile(deleted.id)
    ).resolves.toBe(true);

    expect(notificationProfilesApi.delete).toHaveBeenCalledWith(deleted.id);
    expect(notificationProfilesApi.list).toHaveBeenCalledOnce();
    expect(notificationProfilesApi.getActive).toHaveBeenCalledOnce();
    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [remaining],
      activeProfile: null,
      isMutating: false,
      error: null,
    });
  });

  it('preserves the current projection when deletion is rejected', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({
      profiles: [existing],
      activeProfile: existing,
    });
    notificationProfilesApi.delete.mockResolvedValueOnce(failure('Delete rejected'));

    await expect(
      useNotificationProfileStore.getState().deleteProfile(existing.id)
    ).resolves.toBe(false);

    expect(notificationProfilesApi.list).not.toHaveBeenCalled();
    expect(notificationProfilesApi.getActive).not.toHaveBeenCalled();
    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      activeProfile: existing,
      isMutating: false,
      error: 'Delete rejected',
    });
  });

  it('treats a negative delete acknowledgement as a rejected deletion', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({ profiles: [existing] });
    notificationProfilesApi.delete.mockResolvedValueOnce(
      ok({ id: existing.id, deleted: false })
    );

    await expect(
      useNotificationProfileStore.getState().deleteProfile(existing.id)
    ).resolves.toBe(false);

    expect(notificationProfilesApi.list).not.toHaveBeenCalled();
    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      isMutating: false,
      error: 'Profile was not deleted',
    });
  });

  it('preserves the current projection when post-delete reconciliation fails', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({
      profiles: [existing],
      activeProfile: existing,
    });
    notificationProfilesApi.delete.mockResolvedValueOnce(
      ok({ id: existing.id, deleted: true })
    );
    notificationProfilesApi.list.mockResolvedValueOnce(ok([]));
    notificationProfilesApi.getActive.mockResolvedValueOnce(failure('Active profile unavailable'));

    await expect(
      useNotificationProfileStore.getState().deleteProfile(existing.id)
    ).resolves.toBe(false);

    expect(useNotificationProfileStore.getState()).toMatchObject({
      profiles: [existing],
      activeProfile: existing,
      isMutating: false,
      error: 'Active profile unavailable',
    });
  });

  it('prevents overlapping deletion commands', async () => {
    let resolveDelete:
      | ((value: {
          readonly ok: true;
          readonly data: { readonly id: string; readonly deleted: boolean };
        }) => void)
      | undefined;
    const existing = notificationProfile();
    notificationProfilesApi.delete.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    );
    notificationProfilesApi.list.mockResolvedValueOnce(ok([]));
    notificationProfilesApi.getActive.mockResolvedValueOnce(ok(null));

    const first = useNotificationProfileStore.getState().deleteProfile(existing.id);
    await expect(
      useNotificationProfileStore.getState().deleteProfile(existing.id)
    ).resolves.toBe(false);
    resolveDelete?.(ok({ id: existing.id, deleted: true }));
    await expect(first).resolves.toBe(true);

    expect(notificationProfilesApi.delete).toHaveBeenCalledOnce();
  });

  it('activates a profile only after the typed command succeeds', async () => {
    const existing = notificationProfile();
    notificationProfilesApi.activate.mockResolvedValueOnce(ok(existing));

    await expect(
      useNotificationProfileStore.getState().activateProfile(existing.id, 60)
    ).resolves.toBe(true);

    expect(notificationProfilesApi.activate).toHaveBeenCalledWith({
      profile_id: existing.id,
      duration_minutes: 60,
    });
    expect(useNotificationProfileStore.getState()).toMatchObject({
      activeProfile: existing,
      isMutating: false,
      error: null,
    });
  });

  it('keeps the prior active profile when activation is rejected', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({ activeProfile: existing });
    notificationProfilesApi.activate.mockResolvedValueOnce(failure('Activation rejected'));

    await expect(
      useNotificationProfileStore.getState().activateProfile('profile-2', null)
    ).resolves.toBe(false);

    expect(useNotificationProfileStore.getState()).toMatchObject({
      activeProfile: existing,
      isMutating: false,
      error: 'Activation rejected',
    });
  });

  it('prevents overlapping activation commands', async () => {
    let resolveActivation:
      | ((value: { readonly ok: true; readonly data: NotificationProfile }) => void)
      | undefined;
    notificationProfilesApi.activate.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveActivation = resolve;
      })
    );
    const profile = notificationProfile();

    const first = useNotificationProfileStore.getState().activateProfile(profile.id, 60);
    await expect(
      useNotificationProfileStore.getState().activateProfile(profile.id, 480)
    ).resolves.toBe(false);
    resolveActivation?.(ok(profile));
    await expect(first).resolves.toBe(true);

    expect(notificationProfilesApi.activate).toHaveBeenCalledOnce();
  });

  it('deactivates only after the typed command succeeds', async () => {
    const existing = notificationProfile();
    useNotificationProfileStore.setState({ activeProfile: existing });
    notificationProfilesApi.deactivate.mockResolvedValueOnce(ok(null));

    await expect(useNotificationProfileStore.getState().deactivateProfile()).resolves.toBe(true);

    expect(notificationProfilesApi.deactivate).toHaveBeenCalledOnce();
    expect(useNotificationProfileStore.getState()).toMatchObject({
      activeProfile: null,
      isMutating: false,
      error: null,
    });
  });
});
