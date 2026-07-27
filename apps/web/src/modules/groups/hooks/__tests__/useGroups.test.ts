/**
 * Groups Hooks Unit Tests
 *
 * Tests for useGroups, useGroupMembers, useGroupChannels,
 * useActiveGroup, useChannelMessages, and useGroupTyping hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroups } from '../useGroupList';
import { useGroupMembers } from '../useGroupMembers';
// NOTE: useGroupChannels removed — useGroupChannels.ts archived in batch 2
import { useActiveGroup } from '../useActiveGroup';
// NOTE: useChannelMessages, useGroupTyping removed — useChannelMessages.ts archived in batch 2
import type { Group, Channel, Member } from '../../store';

// --- Factories -------------------------------------------------------------

function makeGroup(overrides: Partial<Group> = {}): Group {
  const base: Group = {
    id: 'g-1',
    name: 'Test Group',
    slug: 'test-group',
    description: null,
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 5,
    onlineMemberCount: 2,
    ownerId: 'u-owner',
    categories: [],
    channels: [],
    roles: [],
    myMember: null,
    createdAt: '2025-01-01T00:00:00Z',
    is_node_gated: false,
    gate_type: null,
    gate_price_nodes: null,
  };
  return { ...base, ...overrides };
}

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'ch-1',
    name: 'general',
    type: 'text',
    topic: null,
    categoryId: null,
    position: 0,
    isNsfw: false,
    slowModeSeconds: 0,
    unreadCount: 0,
    lastMessageAt: null,
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

// --- Mock store state ------------------------------------------------------

const mockGroupState: Record<string, unknown> = {
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  fetchGroups: vi.fn().mockResolvedValue(undefined),
  fetchGroup: vi.fn().mockResolvedValue(undefined),
  fetchChannelMessages: vi.fn().mockResolvedValue(undefined),
  fetchMembers: vi.fn().mockResolvedValue(undefined),
  sendChannelMessage: vi.fn().mockResolvedValue(undefined),
  setActiveGroup: vi.fn(),
  setActiveChannel: vi.fn(),
  addChannelMessage: vi.fn(),
  updateChannelMessage: vi.fn(),
  removeChannelMessage: vi.fn(),
  setTypingUser: vi.fn(),
  createGroup: vi.fn().mockResolvedValue(makeGroup()),
  joinGroup: vi.fn().mockResolvedValue(undefined),
  leaveGroup: vi.fn().mockResolvedValue(undefined),
  updateGroup: vi.fn().mockResolvedValue(makeGroup()),
  deleteGroup: vi.fn().mockResolvedValue(undefined),
  createInvite: vi.fn().mockResolvedValue({ code: 'ABC123', expiresAt: '2025-12-31' }),
};

vi.mock('../../store', () => ({
  useGroupStore: vi.fn((selector?: (s: typeof mockGroupState) => unknown) =>
    selector ? selector(mockGroupState) : mockGroupState
  ),
}));
function resetState() {
  Object.assign(mockGroupState, {
    groups: [],
    activeGroupId: null,
    activeChannelId: null,
    channelMessages: {},
    members: {},
    isLoadingGroups: false,
    isLoadingMessages: false,
    hasMoreMessages: {},
    typingUsers: {},
  });
  vi.clearAllMocks();
}

// useGroups

describe('useGroups', () => {
  beforeEach(resetState);

  it('returns empty groups list by default', () => {
    const { result } = renderHook(() => useGroups());
    expect(result.current.groups).toEqual([]);
  });

  it('fetches groups on mount when list is empty', () => {
    renderHook(() => useGroups());
    expect(mockGroupState.fetchGroups).toHaveBeenCalled();
  });

  it('does not re-fetch when groups already loaded', () => {
    mockGroupState.groups = [makeGroup()];
    renderHook(() => useGroups());
    expect(mockGroupState.fetchGroups).not.toHaveBeenCalled();
  });

  it('returns filtered myGroups (groups where myMember is set)', () => {
    mockGroupState.groups = [
      makeGroup({ id: 'g-1', myMember: makeMember() }),
      makeGroup({ id: 'g-2', myMember: null }),
    ];
    const { result } = renderHook(() => useGroups());
    expect(result.current.myGroups).toHaveLength(1);
    expect(result.current.myGroups[0]!.id).toBe('g-1');
  });

  it('returns filtered publicGroups', () => {
    mockGroupState.groups = [
      makeGroup({ id: 'g-1', isPublic: true }),
      makeGroup({ id: 'g-2', isPublic: false }),
    ];
    const { result } = renderHook(() => useGroups());
    expect(result.current.publicGroups).toHaveLength(1);
    expect(result.current.publicGroups[0]!.id).toBe('g-1');
  });

  it('delegates join to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.join('invite-code');
    });
    expect(mockGroupState.joinGroup).toHaveBeenCalledWith('invite-code');
  });

  it('delegates leave to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.leave('g-1');
    });
    expect(mockGroupState.leaveGroup).toHaveBeenCalledWith('g-1');
  });

  it('delegates create to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.create('New Group', 'A description', true);
    });
    expect(mockGroupState.createGroup).toHaveBeenCalledWith({
      name: 'New Group',
      description: 'A description',
      isPublic: true,
    });
  });

  it('exposes isLoading from store', () => {
    mockGroupState.isLoadingGroups = true;
    const { result } = renderHook(() => useGroups());
    expect(result.current.isLoading).toBe(true);
  });
});

// useGroupMembers

describe('useGroupMembers', () => {
  beforeEach(resetState);

  it('returns empty members when no groupId', () => {
    const { result } = renderHook(() => useGroupMembers(undefined));
    expect(result.current.members).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('fetches members on mount for a given groupId', () => {
    renderHook(() => useGroupMembers('g-1'));
    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });

  it('splits members into online and offline', () => {
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
          user: { id: 'u-3', username: 'c', displayName: null, avatarUrl: null, status: 'away' },
        }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.onlineMembers).toHaveLength(2); // online + away
    expect(result.current.offlineMembers).toHaveLength(1);
    expect(result.current.onlineCount).toBe(2);
  });

  it('groups members by role', () => {
    const role = {
      id: 'r-admin',
      name: 'Admin',
      color: '#f00',
      position: 0,
      permissions: 0,
      isDefault: false,
      isMentionable: true,
    };
    mockGroupState.members = {
      'g-1': [makeMember({ id: 'm-1', roles: [role] }), makeMember({ id: 'm-2', roles: [] })],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.membersByRole['r-admin']).toHaveLength(1);
    expect(result.current.membersByRole['default']).toHaveLength(1);
  });

  it('refresh calls fetchMembers with groupId', async () => {
    const { result } = renderHook(() => useGroupMembers('g-1'));
    vi.clearAllMocks();
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });
});

// NOTE: useGroupChannels describe block removed — useGroupChannels.ts archived in batch 2

// useActiveGroup

describe('useActiveGroup', () => {
  beforeEach(resetState);

  it('returns null group when no activeGroupId', () => {
    const { result } = renderHook(() => useActiveGroup());
    expect(result.current.group).toBeNull();
    expect(result.current.channel).toBeNull();
  });

  it('returns active group from store', () => {
    const group = makeGroup({ id: 'g-1', channels: [makeChannel({ id: 'ch-1' })] });
    mockGroupState.groups = [group];
    mockGroupState.activeGroupId = 'g-1';
    mockGroupState.activeChannelId = 'ch-1';

    const { result } = renderHook(() => useActiveGroup());
    expect(result.current.group?.id).toBe('g-1');
    expect(result.current.channel?.id).toBe('ch-1');
  });

  it('selectGroup sets active group and auto-selects first text channel', () => {
    const group = makeGroup({
      id: 'g-1',
      channels: [
        makeChannel({ id: 'ch-voice', type: 'voice' }),
        makeChannel({ id: 'ch-text', type: 'text' }),
      ],
    });
    mockGroupState.groups = [group];

    const { result } = renderHook(() => useActiveGroup());
    act(() => {
      result.current.selectGroup('g-1');
    });

    expect(mockGroupState.setActiveGroup).toHaveBeenCalledWith('g-1');
    expect(mockGroupState.setActiveChannel).toHaveBeenCalledWith('ch-text');
  });

  it('remove deletes group and clears selection', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    await act(async () => {
      await result.current.remove();
    });
    expect(mockGroupState.deleteGroup).toHaveBeenCalledWith('g-1');
    expect(mockGroupState.setActiveGroup).toHaveBeenCalledWith(null);
  });

  it('invite creates an invite for the active group', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    let invite: { code: string; expiresAt: string } | null = null;
    await act(async () => {
      invite = await result.current.invite({ maxUses: 10 });
    });
    expect(mockGroupState.createInvite).toHaveBeenCalledWith('g-1', { maxUses: 10 });
    expect(invite).toEqual({ code: 'ABC123', expiresAt: '2025-12-31' });
  });

  it('refresh fetches the active group', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockGroupState.fetchGroup).toHaveBeenCalledWith('g-1');
  });
});

// NOTE: useChannelMessages describe block removed — useChannelMessages.ts archived in batch 2
// NOTE: useGroupTyping describe block removed — useChannelMessages.ts archived in batch 2
