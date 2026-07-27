/**
 * useGroupSettings Hook Tests
 *
 * Tests for settings form state management, save/reset,
 * leave/delete group actions, and owner detection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupSettings } from '../useGroupSettings';
import { PERMISSIONS } from '../../role-manager/constants';
import type { Group } from '@/modules/groups/store';

// --- Mock dependencies ---

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockHapticFeedback = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};
vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    success: () => mockHapticFeedback.success(),
    error: () => mockHapticFeedback.error(),
    warning: () => mockHapticFeedback.warning(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

// --- Mock stores ---

const mockLeaveGroup = vi.fn().mockResolvedValue(undefined);
const mockUpdateGroup = vi.fn().mockResolvedValue(undefined);
const mockDeleteGroup = vi.fn().mockResolvedValue(undefined);
const mockGroups: Group[] = [];

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      groups: mockGroups,
      leaveGroup: mockLeaveGroup,
      updateGroup: mockUpdateGroup,
      deleteGroup: mockDeleteGroup,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { user: { id: 'u-current' } };
    return selector ? selector(state) : state;
  }),
}));

// --- Factory ---

function makeGroup(overrides: Partial<Group> = {}): Group {
  const base: Group = {
    id: 'g-1',
    name: 'Test Group',
    slug: 'test-group',
    description: 'A group for testing',
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 10,
    onlineMemberCount: 3,
    ownerId: 'u-current',
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

function resetState() {
  mockGroups.length = 0;
  vi.clearAllMocks();
}

// --- Tests ---

describe('useGroupSettings', () => {
  beforeEach(resetState);

  it('returns null activeGroup when group is not found', () => {
    const { result } = renderHook(() => useGroupSettings('g-missing'));
    expect(result.current.activeGroup).toBeUndefined();
  });

  it('returns the active group from the store', () => {
    mockGroups.push(makeGroup({ id: 'g-1' }));
    const { result } = renderHook(() => useGroupSettings('g-1'));
    expect(result.current.activeGroup?.id).toBe('g-1');
  });

  it('detects owner status correctly', () => {
    mockGroups.push(makeGroup({ id: 'g-1', ownerId: 'u-current' }));
    const { result } = renderHook(() => useGroupSettings('g-1'));
    expect(result.current.isOwner).toBe(true);
  });

  it('detects non-owner status', () => {
    mockGroups.push(makeGroup({ id: 'g-1', ownerId: 'u-other' }));
    const { result } = renderHook(() => useGroupSettings('g-1'));
    expect(result.current.isOwner).toBe(false);
  });

  it('exposes exact member moderation permissions instead of one broad manager flag', () => {
    mockGroups.push(
      makeGroup({
        ownerId: 'u-other',
        myMember: {
          id: 'member-current',
          userId: 'u-current',
          nickname: null,
          user: {
            id: 'u-current',
            username: 'current',
            displayName: 'Current User',
            avatarUrl: null,
            status: 'online',
          },
          roles: [
            {
              id: 'mute-role',
              name: 'Timeout moderator',
              color: '#3b82f6',
              position: 1,
              permissions: PERMISSIONS.MUTE_MEMBERS.value,
              isDefault: false,
              isHoisted: true,
              isMentionable: false,
            },
          ],
          joinedAt: '2026-01-01T00:00:00Z',
        },
      })
    );

    const { result } = renderHook(() => useGroupSettings('g-1'));

    expect(result.current.permissions).toMatchObject({
      canManageMembers: true,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canMuteMembers: true,
    });
  });

  it('uses the create-invites bit and reserves invite deletion for the owner', () => {
    mockGroups.push(
      makeGroup({
        ownerId: 'u-other',
        myMember: {
          id: 'member-current',
          userId: 'u-current',
          nickname: null,
          user: {
            id: 'u-current',
            username: 'current',
            displayName: 'Current User',
            avatarUrl: null,
            status: 'online',
          },
          roles: [
            {
              id: 'invite-role',
              name: 'Inviter',
              color: '#3b82f6',
              position: 1,
              permissions: PERMISSIONS.CREATE_INVITES.value,
              isDefault: false,
              isHoisted: false,
              isMentionable: false,
            },
          ],
          joinedAt: '2026-01-01T00:00:00Z',
        },
      })
    );

    const { result } = renderHook(() => useGroupSettings('g-1'));

    expect(result.current.permissions).toMatchObject({
      canCreateInvites: true,
      canDeleteInvites: false,
      canManageGroup: false,
    });
  });

  it('does not infer invite creation from manage-group permission', () => {
    mockGroups.push(
      makeGroup({
        ownerId: 'u-other',
        myMember: {
          id: 'member-current',
          userId: 'u-current',
          nickname: null,
          user: {
            id: 'u-current',
            username: 'current',
            displayName: 'Current User',
            avatarUrl: null,
            status: 'online',
          },
          roles: [
            {
              id: 'manager-role',
              name: 'Group manager',
              color: '#3b82f6',
              position: 1,
              permissions: PERMISSIONS.MANAGE_GROUP.value,
              isDefault: false,
              isHoisted: false,
              isMentionable: false,
            },
          ],
          joinedAt: '2026-01-01T00:00:00Z',
        },
      })
    );

    const { result } = renderHook(() => useGroupSettings('g-1'));

    expect(result.current.permissions.canManageGroup).toBe(true);
    expect(result.current.permissions.canCreateInvites).toBe(false);
    expect(result.current.permissions.canDeleteInvites).toBe(false);
  });

  it('initializes form data from group', () => {
    mockGroups.push(makeGroup({ name: 'Cool Group', description: 'Desc', isPublic: false }));
    const { result } = renderHook(() => useGroupSettings('g-1'));
    expect(result.current.formData.name).toBe('Cool Group');
    expect(result.current.formData.description).toBe('Desc');
    expect(result.current.formData.isPublic).toBe(false);
  });

  it('defaults to overview tab', () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));
    expect(result.current.activeTab).toBe('overview');
  });

  it('handleFormChange sets hasChanges to true', () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({ name: 'Changed', description: '', isPublic: true });
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.formData.name).toBe('Changed');
  });

  it('clears hasChanges when fields return to the persisted values', () => {
    mockGroups.push(makeGroup({ name: 'Original', description: 'Saved', isPublic: true }));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({ name: 'Changed', description: 'Saved', isPublic: true });
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.handleFormChange({
        name: 'Original',
        description: 'Saved',
        isPublic: true,
      });
    });
    expect(result.current.hasChanges).toBe(false);
  });

  it('handleSave calls updateGroup and clears hasChanges', async () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({
        name: 'Updated',
        description: 'New desc',
        isPublic: false,
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUpdateGroup).toHaveBeenCalledWith('g-1', {
      name: 'Updated',
      description: 'New desc',
      isPublic: false,
    });
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(mockHapticFeedback.success).toHaveBeenCalled();
  });

  it('trims overview text before saving', async () => {
    const storedGroup = makeGroup();
    mockGroups.push(storedGroup);
    mockUpdateGroup.mockImplementationOnce(async (_groupId, data) => {
      Object.assign(storedGroup, data);
    });
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({
        name: '  Updated group  ',
        description: '  Description  ',
        isPublic: true,
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUpdateGroup).toHaveBeenCalledWith('g-1', {
      name: 'Updated group',
      description: 'Description',
      isPublic: true,
    });
    expect(result.current.formData).toEqual({
      name: 'Updated group',
      description: 'Description',
      isPublic: true,
    });
  });

  it('keeps invalid names local and does not call updateGroup', async () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({ name: ' ', description: '', isPublic: true });
    });
    expect(result.current.canSave).toBe(false);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUpdateGroup).not.toHaveBeenCalled();
    expect(result.current.saveError).toContain('Group name must be 2-100 characters');
    expect(result.current.isSaving).toBe(false);
  });

  it('handleSave triggers error haptic on failure', async () => {
    mockGroups.push(makeGroup());
    mockUpdateGroup.mockRejectedValueOnce(new Error('Save failed'));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockHapticFeedback.error).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('handleReset restores form data to original group values', () => {
    mockGroups.push(makeGroup({ name: 'Original', description: 'Original desc', isPublic: true }));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.handleFormChange({ name: 'Changed', description: 'x', isPublic: false });
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.formData.name).toBe('Original');
    expect(result.current.formData.description).toBe('Original desc');
    expect(result.current.hasChanges).toBe(false);
  });

  it('handleLeave calls leaveGroup and navigates to /groups', async () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleLeave();
    });

    expect(mockLeaveGroup).toHaveBeenCalledWith('g-1');
    expect(mockNavigate).toHaveBeenCalledWith('/groups');
    expect(mockHapticFeedback.warning).toHaveBeenCalled();
  });

  it('handleDelete calls deleteGroup and navigates to /groups', async () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockDeleteGroup).toHaveBeenCalledWith('g-1');
    expect(mockNavigate).toHaveBeenCalledWith('/groups');
  });

  it('handleLeave triggers error haptic on failure', async () => {
    mockGroups.push(makeGroup());
    mockLeaveGroup.mockRejectedValueOnce(new Error('Leave failed'));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleLeave();
    });

    expect(mockHapticFeedback.error).toHaveBeenCalled();
    expect(result.current.dangerError).toBe('Leave failed');
  });

  it('maps forbidden leave failures to danger-zone copy', async () => {
    mockGroups.push(makeGroup());
    mockLeaveGroup.mockRejectedValueOnce(new Error('Forbidden'));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleLeave();
    });

    expect(result.current.dangerError).toBe('You do not have permission to leave this group.');
  });

  it('maps forbidden delete failures to danger-zone copy', async () => {
    mockGroups.push(makeGroup());
    mockDeleteGroup.mockRejectedValueOnce(new Error('Forbidden'));
    const { result } = renderHook(() => useGroupSettings('g-1'));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(result.current.dangerError).toBe('You do not have permission to delete this group.');
  });

  it('setActiveTab changes the active tab', () => {
    mockGroups.push(makeGroup());
    const { result } = renderHook(() => useGroupSettings('g-1'));

    act(() => {
      result.current.setActiveTab('danger');
    });

    expect(result.current.activeTab).toBe('danger');
  });
});
