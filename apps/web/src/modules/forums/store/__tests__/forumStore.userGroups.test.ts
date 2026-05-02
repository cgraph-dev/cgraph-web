/**
 * Forum Store — User Groups Slice Tests
 *
 * Tests for the dedicated user groups Zustand store:
 * group CRUD, secondary group management, auto-rules, and reset.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

// Mock axios (dynamically imported inside the store)
vi.mock('axios', () => ({
  default: vi.fn(),
}));

import axios from 'axios';
import { useUserGroupsStore } from '../forumStore.userGroups';

const mockedAxios = axios as unknown as ReturnType<typeof vi.fn>;
function resetStore() {
  useUserGroupsStore.getState().reset();
}

function mockResponse(data: unknown) {
  mockedAxios.mockResolvedValueOnce({ data });
}
const rawGroup = {
  id: 'ug-1',
  forum_id: 'forum-1',
  name: 'Moderators',
  description: 'Forum moderators',
  color: '#00ff00',
  type: 'custom',
  position: 1,
  is_default: false,
  is_hidden: false,
  is_staff: true,
  is_super_mod: false,
  can_moderate: true,
  can_admin: false,
  permissions: { can_edit: true },
  member_count: 5,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const rawGroup2 = {
  ...rawGroup,
  id: 'ug-2',
  name: 'Members',
  position: 0,
  is_staff: false,
  can_moderate: false,
  member_count: 100,
};

const rawSecondaryMember = {
  id: 'sm-1',
  user_id: 'user-1',
  group_id: 'ug-1',
  group_name: 'Moderators',
  group_color: '#00ff00',
  assigned_by: 'admin-1',
  assigned_at: '2026-01-01T00:00:00Z',
  expires_at: null,
  is_active: true,
  reason: 'Promoted',
  username: 'testuser',
  display_name: 'Test User',
};

const rawAutoRule = {
  id: 'ar-1',
  forum_id: 'forum-1',
  name: 'Veteran Badge',
  description: 'Auto-assign after 100 posts',
  rule_type: 'milestone',
  threshold: 100,
  target_group_id: 'ug-1',
  target_group_name: 'Veterans',
  is_active: true,
  last_evaluated_at: null,
  users_assigned: 10,
  criteria: { metric: 'post_count' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

afterEach(() => {
  resetStore();
  vi.clearAllMocks();
});
describe('useUserGroupsStore', () => {
  describe('initial state', () => {
    it('should have empty arrays and false loading states', () => {
      const s = useUserGroupsStore.getState();
      expect(s.groups).toEqual([]);
      expect(s.secondaryMembers).toEqual([]);
      expect(s.autoRules).toEqual([]);
      expect(s.isLoadingGroups).toBe(false);
      expect(s.isLoadingMembers).toBe(false);
      expect(s.isLoadingRules).toBe(false);
      expect(s.selectedGroupId).toBeNull();
    });
  });
  describe('fetchGroups', () => {
    it('should fetch, map, and sort groups by position', async () => {
      mockResponse({ user_groups: [rawGroup, rawGroup2] });

      await useUserGroupsStore.getState().fetchGroups('forum-1');

      const groups = useUserGroupsStore.getState().groups;
      expect(groups).toHaveLength(2);
      // rawGroup2 has position 0, rawGroup has position 1
      expect(groups[0]!.id).toBe('ug-2');
      expect(groups[1]!.id).toBe('ug-1');
      expect(useUserGroupsStore.getState().isLoadingGroups).toBe(false);
    });

    it('should handle errors and reset loading', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await useUserGroupsStore.getState().fetchGroups('forum-1');

      expect(useUserGroupsStore.getState().isLoadingGroups).toBe(false);
      expect(useUserGroupsStore.getState().groups).toEqual([]);
    });
  });

  describe('createGroup', () => {
    it('should create a group and add it sorted by position', async () => {
      mockResponse({ user_group: rawGroup });

      const result = await useUserGroupsStore.getState().createGroup('forum-1', {
        name: 'Moderators',
        type: 'custom',
      });

      expect(result.id).toBe('ug-1');
      expect(result.name).toBe('Moderators');
      expect(result.isStaff).toBe(true);
      expect(useUserGroupsStore.getState().groups).toHaveLength(1);
    });

    it('should correctly map all fields', async () => {
      mockResponse({ user_group: rawGroup });

      const result = await useUserGroupsStore.getState().createGroup('forum-1', {
        name: 'Moderators',
        type: 'custom',
      });

      expect(result.forumId).toBe('forum-1');
      expect(result.color).toBe('#00ff00');
      expect(result.canModerate).toBe(true);
      expect(result.canAdmin).toBe(false);
      expect(result.memberCount).toBe(5);
    });
  });

  describe('updateGroup', () => {
    it('should update an existing group in the list', async () => {
      // Seed store with existing group
      mockResponse({ user_groups: [rawGroup] });
      await useUserGroupsStore.getState().fetchGroups('forum-1');

      const updated = { ...rawGroup, name: 'Super Mods' };
      mockResponse({ user_group: updated });

      const result = await useUserGroupsStore.getState().updateGroup('forum-1', 'ug-1', {
        name: 'Super Mods',
      });

      expect(result.name).toBe('Super Mods');
      expect(useUserGroupsStore.getState().groups).toHaveLength(1);
    });
  });

  describe('deleteGroup', () => {
    it('should remove the group from state', async () => {
      mockResponse({ user_groups: [rawGroup, rawGroup2] });
      await useUserGroupsStore.getState().fetchGroups('forum-1');
      expect(useUserGroupsStore.getState().groups).toHaveLength(2);

      mockResponse({});
      await useUserGroupsStore.getState().deleteGroup('forum-1', 'ug-1');

      const groups = useUserGroupsStore.getState().groups;
      expect(groups).toHaveLength(1);
      expect(groups[0]!.id).toBe('ug-2');
    });
  });

  describe('reorderGroups', () => {
    it('should reorder groups and update positions', async () => {
      mockResponse({ user_groups: [rawGroup, rawGroup2] });
      await useUserGroupsStore.getState().fetchGroups('forum-1');

      mockResponse({});
      await useUserGroupsStore.getState().reorderGroups('forum-1', ['ug-1', 'ug-2']);

      const groups = useUserGroupsStore.getState().groups;
      expect(groups[0]!.id).toBe('ug-1');
      expect(groups[0]!.position).toBe(0);
      expect(groups[1]!.id).toBe('ug-2');
      expect(groups[1]!.position).toBe(1);
    });
  });

  describe('setSelectedGroup', () => {
    it('should set and clear selectedGroupId', () => {
      useUserGroupsStore.getState().setSelectedGroup('ug-1');
      expect(useUserGroupsStore.getState().selectedGroupId).toBe('ug-1');

      useUserGroupsStore.getState().setSelectedGroup(null);
      expect(useUserGroupsStore.getState().selectedGroupId).toBeNull();
    });
  });
  describe('fetchMembers', () => {
    it('should fetch and store secondary group members', async () => {
      mockResponse({ members: [rawSecondaryMember] });

      await useUserGroupsStore.getState().fetchMembers('forum-1', 'ug-1');

      const members = useUserGroupsStore.getState().secondaryMembers;
      expect(members).toHaveLength(1);
      expect(members[0]!.userId).toBe('user-1');
      expect(members[0]!.groupName).toBe('Moderators');
      expect(members[0]!.reason).toBe('Promoted');
      expect(members[0]!.username).toBe('testuser');
      expect(useUserGroupsStore.getState().isLoadingMembers).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await useUserGroupsStore.getState().fetchMembers('forum-1', 'ug-1');

      expect(useUserGroupsStore.getState().isLoadingMembers).toBe(false);
    });
  });

  describe('assignSecondaryGroup', () => {
    it('should add the new member to secondaryMembers', async () => {
      mockResponse({ membership: rawSecondaryMember });

      await useUserGroupsStore.getState().assignSecondaryGroup('forum-1', {
        userId: 'user-1',
        groupId: 'ug-1',
        reason: 'Promoted',
      });

      expect(useUserGroupsStore.getState().secondaryMembers).toHaveLength(1);
    });
  });

  describe('removeSecondaryGroup', () => {
    it('should remove the membership from state', async () => {
      // Seed with a member
      mockResponse({ membership: rawSecondaryMember });
      await useUserGroupsStore.getState().assignSecondaryGroup('forum-1', {
        userId: 'user-1',
        groupId: 'ug-1',
      });

      mockResponse({});
      await useUserGroupsStore.getState().removeSecondaryGroup('forum-1', 'sm-1');

      expect(useUserGroupsStore.getState().secondaryMembers).toHaveLength(0);
    });
  });
  describe('fetchAutoRules', () => {
    it('should fetch and store auto rules', async () => {
      mockResponse({ auto_rules: [rawAutoRule] });

      await useUserGroupsStore.getState().fetchAutoRules('forum-1');

      const rules = useUserGroupsStore.getState().autoRules;
      expect(rules).toHaveLength(1);
      expect(rules[0]!.name).toBe('Veteran Badge');
      expect(rules[0]!.ruleType).toBe('milestone');
      expect(rules[0]!.threshold).toBe(100);
      expect(rules[0]!.usersAssigned).toBe(10);
      expect(useUserGroupsStore.getState().isLoadingRules).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await useUserGroupsStore.getState().fetchAutoRules('forum-1');

      expect(useUserGroupsStore.getState().isLoadingRules).toBe(false);
    });
  });

  describe('createAutoRule', () => {
    it('should create a rule and add to state', async () => {
      mockResponse({ auto_rule: rawAutoRule });

      const result = await useUserGroupsStore.getState().createAutoRule('forum-1', {
        name: 'Veteran Badge',
        ruleType: 'milestone',
        threshold: 100,
        targetGroupId: 'ug-1',
      });

      expect(result.id).toBe('ar-1');
      expect(useUserGroupsStore.getState().autoRules).toHaveLength(1);
    });
  });

  describe('updateAutoRule', () => {
    it('should update an existing rule', async () => {
      // Seed
      mockResponse({ auto_rules: [rawAutoRule] });
      await useUserGroupsStore.getState().fetchAutoRules('forum-1');

      const updated = { ...rawAutoRule, name: 'Updated Rule', threshold: 200 };
      mockResponse({ auto_rule: updated });

      const result = await useUserGroupsStore.getState().updateAutoRule('forum-1', 'ar-1', {
        name: 'Updated Rule',
        threshold: 200,
      });

      expect(result.name).toBe('Updated Rule');
      expect(useUserGroupsStore.getState().autoRules[0]!.threshold).toBe(200);
    });
  });

  describe('deleteAutoRule', () => {
    it('should remove the rule from state', async () => {
      mockResponse({ auto_rules: [rawAutoRule] });
      await useUserGroupsStore.getState().fetchAutoRules('forum-1');

      mockResponse({});
      await useUserGroupsStore.getState().deleteAutoRule('forum-1', 'ar-1');

      expect(useUserGroupsStore.getState().autoRules).toHaveLength(0);
    });
  });

  describe('evaluateRules', () => {
    it('should evaluate rules, re-fetch, and return count', async () => {
      // First call: evaluate
      mockResponse({ users_assigned: 5 });
      // Second call: re-fetch rules
      mockResponse({ auto_rules: [{ ...rawAutoRule, users_assigned: 15 }] });

      const result = await useUserGroupsStore.getState().evaluateRules('forum-1');

      expect(result.usersAssigned).toBe(5);
      expect(useUserGroupsStore.getState().autoRules[0]!.usersAssigned).toBe(15);
    });
  });
  describe('reset', () => {
    it('should restore initial state', () => {
      useUserGroupsStore.setState({
        groups: [{ id: 'x' }] as never[],
        selectedGroupId: 'x',
        isLoadingGroups: true,
      });

      useUserGroupsStore.getState().reset();

      const s = useUserGroupsStore.getState();
      expect(s.groups).toEqual([]);
      expect(s.selectedGroupId).toBeNull();
      expect(s.isLoadingGroups).toBe(false);
    });
  });
});
