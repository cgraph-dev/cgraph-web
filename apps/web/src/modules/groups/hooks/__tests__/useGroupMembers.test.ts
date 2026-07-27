/**
 * useGroupMembers Hook Tests
 *
 * Tests for memoized member filtering, role grouping, and online/offline separation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupMembers } from '../useGroupMembers';
import type { Member, Role } from '../../store';

// --- Factories ---

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'r-1',
    name: 'Member',
    color: '#ccc',
    position: 0,
    permissions: 0,
    isDefault: true,
    isHoisted: false,
    isMentionable: false,
    ...overrides,
  };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm-1',
    userId: 'u-1',
    nickname: null,
    user: {
      id: 'u-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      status: 'online',
    },
    roles: [],
    joinedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Mock store ---

const mockGroupState: Record<string, unknown> = {
  members: {},
  fetchMembers: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../store', () => ({
  useGroupStore: vi.fn((selector?: (s: typeof mockGroupState) => unknown) =>
    selector ? selector(mockGroupState) : mockGroupState
  ),
}));

function resetState() {
  mockGroupState.members = {};
  vi.clearAllMocks();
}

// --- Tests ---

describe('useGroupMembers', () => {
  beforeEach(resetState);

  it('returns empty arrays when no groupId is provided', () => {
    const { result } = renderHook(() => useGroupMembers(undefined));
    expect(result.current.members).toEqual([]);
    expect(result.current.onlineMembers).toEqual([]);
    expect(result.current.offlineMembers).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.onlineCount).toBe(0);
  });

  it('returns empty arrays when groupId has no cached members', () => {
    const { result } = renderHook(() => useGroupMembers('g-unknown'));
    expect(result.current.members).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('fetches members on mount when not already loaded', () => {
    renderHook(() => useGroupMembers('g-1'));
    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });

  it('does not fetch members if they are already loaded', () => {
    mockGroupState.members = { 'g-1': [makeMember()] };
    renderHook(() => useGroupMembers('g-1'));
    expect(mockGroupState.fetchMembers).not.toHaveBeenCalled();
  });

  it('does not fetch members when groupId is undefined', () => {
    renderHook(() => useGroupMembers(undefined));
    expect(mockGroupState.fetchMembers).not.toHaveBeenCalled();
  });

  it('separates online from offline members', () => {
    mockGroupState.members = {
      'g-1': [
        makeMember({
          id: 'm-1',
          user: { id: 'u-1', username: 'a', displayName: null, avatarUrl: null, status: 'online' },
        }),
        makeMember({
          id: 'm-2',
          user: { id: 'u-2', username: 'b', displayName: null, avatarUrl: null, status: 'offline' },
        }),
        makeMember({
          id: 'm-3',
          user: { id: 'u-3', username: 'c', displayName: null, avatarUrl: null, status: 'idle' },
        }),
        makeMember({
          id: 'm-4',
          user: { id: 'u-4', username: 'd', displayName: null, avatarUrl: null, status: 'dnd' },
        }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.onlineMembers).toHaveLength(3);
    expect(result.current.offlineMembers).toHaveLength(1);
    expect(result.current.onlineCount).toBe(3);
    expect(result.current.count).toBe(4);
  });

  it('groups members by their top role id', () => {
    const adminRole = makeRole({ id: 'r-admin', name: 'Admin' });
    const modRole = makeRole({ id: 'r-mod', name: 'Moderator' });

    mockGroupState.members = {
      'g-1': [
        makeMember({ id: 'm-1', roles: [adminRole] }),
        makeMember({ id: 'm-2', roles: [modRole] }),
        makeMember({ id: 'm-3', roles: [adminRole, modRole] }),
        makeMember({ id: 'm-4', roles: [] }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.membersByRole['r-admin']).toHaveLength(2);
    expect(result.current.membersByRole['r-mod']).toHaveLength(1);
    expect(result.current.membersByRole['default']).toHaveLength(1);
  });

  it('places members with no roles under the "default" key', () => {
    mockGroupState.members = {
      'g-1': [makeMember({ id: 'm-1', roles: [] })],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(Object.keys(result.current.membersByRole)).toEqual(['default']);
    expect(result.current.membersByRole['default']).toHaveLength(1);
  });

  it('refresh calls fetchMembers with the groupId', async () => {
    mockGroupState.members = { 'g-1': [makeMember()] };
    const { result } = renderHook(() => useGroupMembers('g-1'));
    vi.clearAllMocks();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });

  it('refresh is a no-op when groupId is undefined', async () => {
    const { result } = renderHook(() => useGroupMembers(undefined));
    vi.clearAllMocks();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGroupState.fetchMembers).not.toHaveBeenCalled();
  });

  it('handles all members offline', () => {
    mockGroupState.members = {
      'g-1': [
        makeMember({
          id: 'm-1',
          user: { id: 'u-1', username: 'a', displayName: null, avatarUrl: null, status: 'offline' },
        }),
        makeMember({
          id: 'm-2',
          user: { id: 'u-2', username: 'b', displayName: null, avatarUrl: null, status: 'offline' },
        }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.onlineMembers).toHaveLength(0);
    expect(result.current.offlineMembers).toHaveLength(2);
    expect(result.current.onlineCount).toBe(0);
  });

  it('handles all members online', () => {
    mockGroupState.members = {
      'g-1': [
        makeMember({
          id: 'm-1',
          user: { id: 'u-1', username: 'a', displayName: null, avatarUrl: null, status: 'online' },
        }),
        makeMember({
          id: 'm-2',
          user: { id: 'u-2', username: 'b', displayName: null, avatarUrl: null, status: 'online' },
        }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.onlineMembers).toHaveLength(2);
    expect(result.current.offlineMembers).toHaveLength(0);
  });
});
