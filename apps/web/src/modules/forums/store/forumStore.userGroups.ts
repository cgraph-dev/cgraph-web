/**
 * Forum Store — User Groups Slice
 *
 * Dedicated store slice for user groups, secondary groups, and auto-rules.
 * Wires to SecondaryGroupsController and group endpoints.
 *
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStore:UserGroups');

export interface ForumUserGroupLocal {
  id: string;
  forumId: string;
  name: string;
  description: string | null;
  color: string | null;
  type: 'system' | 'custom' | 'joinable';
  position: number;
  isDefault: boolean;
  isHidden: boolean;
  isStaff: boolean;
  isSuperMod: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  permissions: Record<string, boolean | number>;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecondaryGroupMember {
  id: string;
  userId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  assignedBy: string | null;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  reason: string | null;
  username?: string;
  displayName?: string;
}

export interface AutoRule {
  id: string;
  forumId: string;
  name: string;
  description: string | null;
  ruleType: 'milestone' | 'time_based' | 'subscription' | 'custom';
  threshold: number;
  targetGroupId: string;
  targetGroupName: string;
  isActive: boolean;
  lastEvaluatedAt: string | null;
  usersAssigned: number;
  criteria: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroupsState {
  // State
  groups: ForumUserGroupLocal[];
  secondaryMembers: SecondaryGroupMember[];
  autoRules: AutoRule[];
  isLoadingGroups: boolean;
  isLoadingMembers: boolean;
  isLoadingRules: boolean;
  selectedGroupId: string | null;

  // Group CRUD
  fetchGroups: (forumId: string) => Promise<void>;
  createGroup: (forumId: string, data: CreateGroupData) => Promise<ForumUserGroupLocal>;
  updateGroup: (
    forumId: string,
    groupId: string,
    data: Partial<CreateGroupData>
  ) => Promise<ForumUserGroupLocal>;
  deleteGroup: (forumId: string, groupId: string) => Promise<void>;
  reorderGroups: (forumId: string, groupIds: string[]) => Promise<void>;
  setSelectedGroup: (groupId: string | null) => void;

  // Secondary groups
  fetchMembers: (forumId: string, groupId: string) => Promise<void>;
  assignSecondaryGroup: (forumId: string, data: AssignSecondaryData) => Promise<void>;
  removeSecondaryGroup: (forumId: string, membershipId: string) => Promise<void>;

  // Auto-rules
  fetchAutoRules: (forumId: string) => Promise<void>;
  createAutoRule: (forumId: string, data: CreateAutoRuleData) => Promise<AutoRule>;
  updateAutoRule: (
    forumId: string,
    ruleId: string,
    data: Partial<CreateAutoRuleData>
  ) => Promise<AutoRule>;
  deleteAutoRule: (forumId: string, ruleId: string) => Promise<void>;
  evaluateRules: (forumId: string) => Promise<{ usersAssigned: number }>;

  reset: () => void;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
  type: 'system' | 'custom' | 'joinable';
  isStaff?: boolean;
  permissions?: Record<string, boolean | number>;
}

export interface AssignSecondaryData {
  userId: string;
  groupId: string;
  expiresAt?: string | null;
  reason?: string;
}

export interface CreateAutoRuleData {
  name: string;
  description?: string;
  ruleType: 'milestone' | 'time_based' | 'subscription' | 'custom';
  threshold: number;
  targetGroupId: string;
  isActive?: boolean;
  criteria?: Record<string, unknown>;
}

function getString(raw: Record<string, unknown>, key: string, fallback: string): string {
  const val = raw[key];
  return typeof val === 'string' ? val : fallback;
}

function getStringOrNull(raw: Record<string, unknown>, key: string): string | null {
  const val = raw[key];
  return typeof val === 'string' ? val : null;
}

function getStringOrUndefined(raw: Record<string, unknown>, key: string): string | undefined {
  const val = raw[key];
  return typeof val === 'string' ? val : undefined;
}

function getNumber(raw: Record<string, unknown>, key: string, fallback: number): number {
  const val = raw[key];
  return typeof val === 'number' ? val : fallback;
}

function getBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const val = raw[key];
  return typeof val === 'boolean' ? val : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getPermissionsRecord(
  raw: Record<string, unknown>,
  key: string
): Record<string, boolean | number> {
  const val = raw[key];
  if (!isRecord(val)) {
    return {};
  }

  const permissions: Record<string, boolean | number> = {};
  for (const [permissionName, permissionValue] of Object.entries(val)) {
    if (typeof permissionValue === 'boolean' || typeof permissionValue === 'number') {
      permissions[permissionName] = permissionValue;
    }
  }

  return permissions;
}

function getUnknownRecord(raw: Record<string, unknown>, key: string): Record<string, unknown> {
  const val = raw[key];
  return isRecord(val) ? { ...val } : {};
}

function isGroupType(value: unknown): value is ForumUserGroupLocal['type'] {
  return value === 'system' || value === 'custom' || value === 'joinable';
}

function getGroupType(raw: Record<string, unknown>, key: string): ForumUserGroupLocal['type'] {
  const val = raw[key];
  return isGroupType(val) ? val : 'custom';
}

function isRuleType(value: unknown): value is AutoRule['ruleType'] {
  return value === 'milestone'
    || value === 'time_based'
    || value === 'subscription'
    || value === 'custom';
}

function getRuleType(raw: Record<string, unknown>, key: string): AutoRule['ruleType'] {
  const val = raw[key];
  return isRuleType(val) ? val : 'milestone';
}

async function apiCall<T>(method: string, url: string, data?: unknown): Promise<T> {
  const { default: axios } = await import('axios');
  const response = await axios({ method, url, data });
  return response.data;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function mapGroup(raw: Record<string, unknown>): ForumUserGroupLocal {
  return {
    id: getString(raw, 'id', ''),
    forumId: getString(raw, 'forum_id', ''),
    name: getString(raw, 'name', ''),
    description: getStringOrNull(raw, 'description'),
    color: getStringOrNull(raw, 'color'),
    type: getGroupType(raw, 'type'),
    position: getNumber(raw, 'position', 0),
    isDefault: getBoolean(raw, 'is_default', false),
    isHidden: getBoolean(raw, 'is_hidden', false),
    isStaff: getBoolean(raw, 'is_staff', false),
    isSuperMod: getBoolean(raw, 'is_super_mod', false),
    canModerate: getBoolean(raw, 'can_moderate', false),
    canAdmin: getBoolean(raw, 'can_admin', false),
    permissions: getPermissionsRecord(raw, 'permissions'),
    memberCount: getNumber(raw, 'member_count', 0),
    createdAt: getString(raw, 'created_at', ''),
    updatedAt: getString(raw, 'updated_at', ''),
  };
}

function mapSecondaryMember(raw: Record<string, unknown>): SecondaryGroupMember {
  return {
    id: getString(raw, 'id', ''),
    userId: getString(raw, 'user_id', ''),
    groupId: getString(raw, 'group_id', ''),
    groupName: getString(raw, 'group_name', ''),
    groupColor: getStringOrNull(raw, 'group_color'),
    assignedBy: getStringOrNull(raw, 'assigned_by'),
    assignedAt: getString(raw, 'assigned_at', ''),
    expiresAt: getStringOrNull(raw, 'expires_at'),
    isActive: getBoolean(raw, 'is_active', true),
    reason: getStringOrNull(raw, 'reason'),
    username: getStringOrUndefined(raw, 'username'),
    displayName: getStringOrUndefined(raw, 'display_name'),
  };
}

function mapAutoRule(raw: Record<string, unknown>): AutoRule {
  return {
    id: getString(raw, 'id', ''),
    forumId: getString(raw, 'forum_id', ''),
    name: getString(raw, 'name', ''),
    description: getStringOrNull(raw, 'description'),
    ruleType: getRuleType(raw, 'rule_type'),
    threshold: getNumber(raw, 'threshold', 0),
    targetGroupId: getString(raw, 'target_group_id', ''),
    targetGroupName: getString(raw, 'target_group_name', ''),
    isActive: getBoolean(raw, 'is_active', true),
    lastEvaluatedAt: getStringOrNull(raw, 'last_evaluated_at'),
    usersAssigned: getNumber(raw, 'users_assigned', 0),
    criteria: getUnknownRecord(raw, 'criteria'),
    createdAt: getString(raw, 'created_at', ''),
    updatedAt: getString(raw, 'updated_at', ''),
  };
}

const initialState = {
  groups: [],
  secondaryMembers: [],
  autoRules: [],
  isLoadingGroups: false,
  isLoadingMembers: false,
  isLoadingRules: false,
  selectedGroupId: null,
} satisfies Omit<
  UserGroupsState,
  | 'fetchGroups' | 'createGroup' | 'updateGroup' | 'deleteGroup'
  | 'reorderGroups' | 'setSelectedGroup'
  | 'fetchMembers' | 'assignSecondaryGroup' | 'removeSecondaryGroup'
  | 'fetchAutoRules' | 'createAutoRule' | 'updateAutoRule' | 'deleteAutoRule'
  | 'evaluateRules' | 'reset'
>;

export const useUserGroupsStore = create<UserGroupsState>((set) => ({
  ...initialState,

  fetchGroups: async (forumId: string) => {
    set({ isLoadingGroups: true });
    try {
      const res = await apiCall<{ user_groups: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/user-groups`
      );
      const groups = (res.user_groups || []).map(mapGroup).sort((a, b) => a.position - b.position);
      set({ groups, isLoadingGroups: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchGroups');
      set({ isLoadingGroups: false });
    }
  },

  createGroup: async (forumId: string, data: CreateGroupData) => {
    const res = await apiCall<{ user_group: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/user-groups`,
      { user_group: data }
    );
    const group = mapGroup(res.user_group);
    set((s) => ({ groups: [...s.groups, group].sort((a, b) => a.position - b.position) }));
    return group;
  },

  updateGroup: async (forumId: string, groupId: string, data: Partial<CreateGroupData>) => {
    const res = await apiCall<{ user_group: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/user-groups/${groupId}`,
      { user_group: data }
    );
    const group = mapGroup(res.user_group);
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? group : g)),
    }));
    return group;
  },

  deleteGroup: async (forumId: string, groupId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/user-groups/${groupId}`);
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
  },

  reorderGroups: async (forumId: string, groupIds: string[]) => {
    await apiCall('put', `/api/v1/forums/${forumId}/user-groups/reorder`, {
      group_ids: groupIds,
    });
    set((s) => {
      const map = new Map(s.groups.map((g) => [g.id, g]));
      const ordered = groupIds
        .map((id, i) => {
          const g = map.get(id);
          return g ? { ...g, position: i } : null;
        })
        .filter(isDefined);
      return { groups: ordered };
    });
  },

  setSelectedGroup: (groupId: string | null) => set({ selectedGroupId: groupId }),

  fetchMembers: async (forumId: string, groupId: string) => {
    set({ isLoadingMembers: true });
    try {
      const res = await apiCall<{ members: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/user-groups/${groupId}/members`
      );
      const members = (res.members || []).map(mapSecondaryMember);
      set({ secondaryMembers: members, isLoadingMembers: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchMembers');
      set({ isLoadingMembers: false });
    }
  },

  assignSecondaryGroup: async (forumId: string, data: AssignSecondaryData) => {
    const res = await apiCall<{ membership: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/secondary-groups`,
      { membership: data }
    );
    const member = mapSecondaryMember(res.membership);
    set((s) => ({ secondaryMembers: [...s.secondaryMembers, member] }));
  },

  removeSecondaryGroup: async (forumId: string, membershipId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/secondary-groups/${membershipId}`);
    set((s) => ({ secondaryMembers: s.secondaryMembers.filter((m) => m.id !== membershipId) }));
  },

  fetchAutoRules: async (forumId: string) => {
    set({ isLoadingRules: true });
    try {
      const res = await apiCall<{ auto_rules: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/auto-rules`
      );
      set({ autoRules: (res.auto_rules || []).map(mapAutoRule), isLoadingRules: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchAutoRules');
      set({ isLoadingRules: false });
    }
  },

  createAutoRule: async (forumId: string, data: CreateAutoRuleData) => {
    const res = await apiCall<{ auto_rule: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/auto-rules`,
      { auto_rule: data }
    );
    const rule = mapAutoRule(res.auto_rule);
    set((s) => ({ autoRules: [...s.autoRules, rule] }));
    return rule;
  },

  updateAutoRule: async (forumId: string, ruleId: string, data: Partial<CreateAutoRuleData>) => {
    const res = await apiCall<{ auto_rule: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/auto-rules/${ruleId}`,
      { auto_rule: data }
    );
    const rule = mapAutoRule(res.auto_rule);
    set((s) => ({
      autoRules: s.autoRules.map((r) => (r.id === ruleId ? rule : r)),
    }));
    return rule;
  },

  deleteAutoRule: async (forumId: string, ruleId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/auto-rules/${ruleId}`);
    set((s) => ({ autoRules: s.autoRules.filter((r) => r.id !== ruleId) }));
  },

  evaluateRules: async (forumId: string) => {
    const res = await apiCall<{ users_assigned: number }>(
      'post',
      `/api/v1/forums/${forumId}/auto-rules/evaluate`
    );
    // Re-fetch rules to update counts
    const rulesRes = await apiCall<{ auto_rules: Record<string, unknown>[] }>(
      'get',
      `/api/v1/forums/${forumId}/auto-rules`
    );
    set({ autoRules: (rulesRes.auto_rules || []).map(mapAutoRule) });
    return { usersAssigned: res.users_assigned || 0 };
  },

  reset: () => set({ ...initialState }),
}));
