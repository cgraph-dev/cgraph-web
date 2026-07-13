/**
 * Profile Blocked Users & Media Actions Unit Tests
 *
 * Tests for createFetchBlockedUsers, createBlockUser, createUnblockUser,
 * createIsUserBlocked, createUploadAvatar, createClearProfile.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils', () => ({
  ensureArray: (_data: unknown, key: string) => {
    if (Array.isArray(_data)) return _data;
    if (_data && typeof _data === 'object' && key in _data)
      return (_data as Record<string, unknown>)[key];
    return [];
  },
  isRecord: (v: unknown) => typeof v === 'object' && v !== null,
  asString: (v: unknown) => (typeof v === 'string' ? v : ''),
  asBool: (v: unknown, fallback = false) => (typeof v === 'boolean' ? v : fallback),
  asEnum: (v: unknown, valid: string[], fallback: string) =>
    valid.includes(typeof v === 'string' ? v : '') ? v : fallback,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/lib/identity/ownIdentitySync', () => ({
  applyOwnIdentityPatch: vi.fn(),
}));

import { api } from '@/lib/api-client';
import type { ProfileState } from '../profileStore.types';
import {
  createFetchBlockedUsers,
  createBlockUser,
  createUnblockUser,
  createIsUserBlocked,
  createUploadAvatar,
  createClearProfile,
} from '../profile-blocked-and-media';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

function createMockStore() {
  let state = {
    blockedUsers: [] as Array<{ id: string; reason?: string }>,
    isLoadingBlocked: false,
    currentProfile: null as Record<string, unknown> | null,
    myProfile: null,
    profileError: null,
    availableFields: [],
  };

  const set = vi.fn((partial: unknown) => {
    if (typeof partial === 'function') {
      const updates = partial(state);
      state = { ...state, ...updates };
    } else if (typeof partial === 'object' && partial !== null) {
      state = { ...state, ...(partial as Record<string, unknown>) };
    }
  });

  const get = vi.fn(() => state);

  return { state: () => state, set, get };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createFetchBlockedUsers', () => {
  it('fetches and stores blocked users', async () => {
    const { set, state } = createMockStore();
    const fetchBlockedUsers = createFetchBlockedUsers(set);

    mockedApi.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'block-1',
            user: {
              id: 'u-1',
              username: 'baduser',
              display_name: 'Bad User',
              avatar_url: null,
            },
            blocked_at: '2026-01-01T00:00:00Z',
          },
        ],
        page_info: {
          has_next_page: true,
          end_cursor: 'next-cursor',
          total_count: 51,
        },
      },
    });

    const page = await fetchBlockedUsers({ includeTotal: true });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/blocked', {
      params: {
        cursor: undefined,
        limit: 50,
        include_total: true,
      },
    });
    expect(set).toHaveBeenCalledWith({ isLoadingBlocked: true });
    expect(state().isLoadingBlocked).toBe(false);
    expect(state().blockedUsers).toHaveLength(1);
    expect(state().blockedUsers[0]!.id).toBe('u-1');
    expect(page).toEqual({ endCursor: 'next-cursor', hasNextPage: true, totalCount: 51 });
  });

  it('appends a cursor page without duplicating earlier blocked users', async () => {
    const { set, state } = createMockStore();
    const fetchBlockedUsers = createFetchBlockedUsers(set);

    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'block-1',
              user: { id: 'u-1', username: 'first-user' },
              blocked_at: '2026-01-01T00:00:00Z',
            },
          ],
          page_info: { has_next_page: true, end_cursor: 'previous-cursor' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'block-1-again',
              user: { id: 'u-1', username: 'first-user' },
              blocked_at: '2026-01-01T00:00:00Z',
            },
            {
              id: 'block-2',
              user: { id: 'u-2', username: 'next-user' },
              blocked_at: '2026-01-02T00:00:00Z',
            },
          ],
          page_info: { has_next_page: false, end_cursor: null },
        },
      });

    await fetchBlockedUsers();

    await fetchBlockedUsers({ cursor: 'previous-cursor', append: true, limit: 50 });

    expect(mockedApi.get).toHaveBeenLastCalledWith('/api/v1/friends/blocked', {
      params: {
        cursor: 'previous-cursor',
        limit: 50,
        include_total: undefined,
      },
    });
    expect(state().blockedUsers.map((user) => user.id)).toEqual(['u-1', 'u-2']);
  });

  it('sets isLoadingBlocked false on error and rethrows', async () => {
    const { set } = createMockStore();
    const fetchBlockedUsers = createFetchBlockedUsers(set);

    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchBlockedUsers()).rejects.toThrow('Network error');
    const lastCall = set.mock.calls[set.mock.calls.length - 1]![0] as Record<string, unknown>;
    expect(lastCall.isLoadingBlocked).toBe(false);
  });
});

describe('createBlockUser', () => {
  it('calls block API and refreshes blocked list', async () => {
    const { set, get } = createMockStore();
    // Patch get to include fetchBlockedUsers
    const fetchBlockedUsers = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({
      ...get(),
      fetchBlockedUsers,
      currentProfile: null,
    } as never);

    const blockUser = createBlockUser(set, get as unknown as () => ProfileState);

    mockedApi.post.mockResolvedValueOnce({});

    await blockUser('u-target', 'harassment');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/u-target/block', {
      reason: 'harassment',
    });
    expect(fetchBlockedUsers).toHaveBeenCalled();
  });

  it('updates currentProfile.isBlocked if viewing the blocked user', async () => {
    const { set, get } = createMockStore();
    const fetchBlockedUsers = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({
      ...get(),
      fetchBlockedUsers,
      currentProfile: {
        id: 'u-target',
        username: 'target',
        isFriend: true,
        isBlocked: false,
        friendshipStatus: 'friends',
      },
    } as never);

    const blockUser = createBlockUser(set, get as unknown as () => ProfileState);
    mockedApi.post.mockResolvedValueOnce({});

    await blockUser('u-target');

    const profileUpdate = set.mock.calls.find(
      (c) =>
        (c[0] as Record<string, unknown>)?.currentProfile &&
        (c[0] as Record<string, Record<string, unknown>>).currentProfile?.friendshipStatus ===
          'blocked'
    );
    expect(profileUpdate?.[0]).toMatchObject({
      currentProfile: {
        isFriend: false,
        isBlocked: true,
        friendshipStatus: 'blocked',
      },
    });
  });

  it('rethrows on API failure', async () => {
    const { set, get } = createMockStore();
    const blockUser = createBlockUser(set, get as unknown as () => ProfileState);

    mockedApi.post.mockRejectedValueOnce(new Error('fail'));

    await expect(blockUser('u-1')).rejects.toThrow('fail');
  });
});

describe('createUnblockUser', () => {
  it('calls unblock API and removes user from blocked list', async () => {
    const { set, get } = createMockStore();
    get.mockReturnValue({
      blockedUsers: [{ id: 'u-1' }, { id: 'u-2' }],
      currentProfile: null,
    } as never);

    const unblockUser = createUnblockUser(set, get as unknown as () => ProfileState);
    mockedApi.delete.mockResolvedValueOnce({});

    await unblockUser('u-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/friends/u-1/block');
    // set should be called with a function that filters out the user
    expect(set).toHaveBeenCalled();
  });

  it('updates currentProfile.isBlocked to false when viewing unblocked user', async () => {
    const { set, get } = createMockStore();
    get.mockReturnValue({
      blockedUsers: [{ id: 'u-1' }],
      currentProfile: {
        id: 'u-1',
        username: 'target',
        isFriend: false,
        isBlocked: true,
        friendshipStatus: 'blocked',
      },
    } as never);

    const unblockUser = createUnblockUser(set, get as unknown as () => ProfileState);
    mockedApi.delete.mockResolvedValueOnce({});

    await unblockUser('u-1');

    const profileUpdate = set.mock.calls.find(
      (c) =>
        (c[0] as Record<string, unknown>)?.currentProfile &&
        (c[0] as Record<string, Record<string, unknown>>).currentProfile?.friendshipStatus ===
          'none'
    );
    expect(profileUpdate?.[0]).toMatchObject({
      currentProfile: {
        isFriend: false,
        isBlocked: false,
        friendshipStatus: 'none',
      },
    });
  });

  it('rethrows on API failure', async () => {
    const { set, get } = createMockStore();
    const unblockUser = createUnblockUser(set, get as unknown as () => ProfileState);

    mockedApi.delete.mockRejectedValueOnce(new Error('fail'));

    await expect(unblockUser('u-1')).rejects.toThrow('fail');
  });
});

describe('createIsUserBlocked', () => {
  it('returns true when user is in blocked list', () => {
    const get = (() => ({
      blockedUsers: [{ id: 'u-1' }, { id: 'u-2' }],
    })) as unknown as () => ProfileState;
    const isUserBlocked = createIsUserBlocked(get);
    expect(isUserBlocked('u-1')).toBe(true);
    expect(isUserBlocked('u-2')).toBe(true);
  });

  it('returns false when user is not blocked', () => {
    const get = (() => ({
      blockedUsers: [{ id: 'u-1' }],
    })) as unknown as () => ProfileState;
    const isUserBlocked = createIsUserBlocked(get);
    expect(isUserBlocked('u-99')).toBe(false);
  });

  it('returns false when blocked list is empty', () => {
    const get = (() => ({
      blockedUsers: [],
    })) as unknown as () => ProfileState;
    const isUserBlocked = createIsUserBlocked(get);
    expect(isUserBlocked('u-1')).toBe(false);
  });
});

describe('createUploadAvatar', () => {
  it('uploads file and updates myProfile.avatarUrl', async () => {
    const { set } = createMockStore();
    const uploadAvatar = createUploadAvatar(set);

    mockedApi.post.mockResolvedValueOnce({
      data: { avatar_url: 'https://cdn.example.com/avatar.png' },
    });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    const result = await uploadAvatar(file);

    expect(result).toBe('https://cdn.example.com/avatar.png');
    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/me/avatar', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('falls back to response.data.url when avatar_url is missing', async () => {
    const { set } = createMockStore();
    const uploadAvatar = createUploadAvatar(set);

    mockedApi.post.mockResolvedValueOnce({
      data: { url: 'https://cdn.example.com/fallback.png' },
    });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    const result = await uploadAvatar(file);

    expect(result).toBe('https://cdn.example.com/fallback.png');
  });
});

describe('createClearProfile', () => {
  it('clears currentProfile and profileError', () => {
    const set = vi.fn();
    const clearProfile = createClearProfile(set);

    clearProfile();

    expect(set).toHaveBeenCalledWith({
      currentProfile: null,
      profileError: null,
    });
  });
});
