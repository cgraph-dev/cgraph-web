/**
 * Forum Store — Permissions Slice
 *
 * Dedicated store for board permissions, permission templates, and forum permissions.
 * Wires to PermissionsController endpoints.
 *
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStore:Permissions');

export type PermLevel = 'inherit' | 'allow' | 'deny';

export interface BoardPermissionLocal {
  id: string;
  boardId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPermissionLocal {
  id: string;
  forumId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionTemplateLocal {
  id: string;
  forumId: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface EffectivePermResult {
  permission: string;
  level: PermLevel;
  source: 'board' | 'forum' | 'group' | 'default';
  inheritedFrom?: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  permissions: Record<string, PermLevel>;
}

export interface PermissionsState {
  // State
  boardPermissions: BoardPermissionLocal[];
  forumPermissions: ForumPermissionLocal[];
  templates: PermissionTemplateLocal[];
  effectivePermissions: EffectivePermResult[];
  isLoadingBoardPerms: boolean;
  isLoadingTemplates: boolean;
  isLoadingForumPerms: boolean;

  // Board permissions
  fetchBoardPermissions: (boardId: string) => Promise<void>;
  updateBoardPermission: (
    boardId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => Promise<void>;
  resetBoardPermissions: (boardId: string) => Promise<void>;

  // Forum permissions
  fetchForumPermissions: (forumId: string) => Promise<void>;
  updateForumPermission: (
    forumId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => Promise<void>;

  // Templates
  fetchTemplates: (forumId: string) => Promise<void>;
  createTemplate: (forumId: string, data: CreateTemplateData) => Promise<PermissionTemplateLocal>;
  deleteTemplate: (forumId: string, templateId: string) => Promise<void>;
  applyTemplate: (boardId: string, templateId: string) => Promise<void>;
  duplicateTemplate: (
    forumId: string,
    templateId: string,
    newName: string
  ) => Promise<PermissionTemplateLocal>;

  // Check
  checkPermission: (
    boardId: string,
    groupId: string,
    permission: string
  ) => Promise<EffectivePermResult>;
  fetchEffectivePermissions: (boardId: string, groupId: string) => Promise<void>;

  reset: () => void;
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

function getBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const val = raw[key];
  return typeof val === 'boolean' ? val : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getPermRecord(raw: Record<string, unknown>, key: string): Record<string, PermLevel> {
  const val = raw[key];
  if (!isRecord(val)) {
    return {};
  }

  const permissions: Record<string, PermLevel> = {};
  for (const [permissionName, permissionLevel] of Object.entries(val)) {
    permissions[permissionName] = isPermLevel(permissionLevel) ? permissionLevel : 'inherit';
  }

  return permissions;
}

function isPermLevel(value: unknown): value is PermLevel {
  return value === 'inherit' || value === 'allow' || value === 'deny';
}

function getPermLevel(raw: Record<string, unknown>, key: string): PermLevel {
  const val = raw[key];
  return isPermLevel(val) ? val : 'inherit';
}

function isPermSource(value: unknown): value is EffectivePermResult['source'] {
  return value === 'board' || value === 'forum' || value === 'group' || value === 'default';
}

function getPermSource(raw: Record<string, unknown>, key: string): EffectivePermResult['source'] {
  const val = raw[key];
  return isPermSource(val) ? val : 'default';
}

async function apiCall<T>(method: string, url: string, data?: unknown): Promise<T> {
  const { default: axios } = await import('axios');
  const response = await axios({ method, url, data });
  return response.data;
}

function mapBoardPermission(raw: Record<string, unknown>): BoardPermissionLocal {
  return {
    id: getString(raw, 'id', ''),
    boardId: getString(raw, 'board_id', ''),
    groupId: getString(raw, 'group_id', ''),
    groupName: getString(raw, 'group_name', ''),
    groupColor: getStringOrNull(raw, 'group_color'),
    permissions: getPermRecord(raw, 'permissions'),
    createdAt: getString(raw, 'created_at', ''),
    updatedAt: getString(raw, 'updated_at', ''),
  };
}

function mapForumPermission(raw: Record<string, unknown>): ForumPermissionLocal {
  return {
    id: getString(raw, 'id', ''),
    forumId: getString(raw, 'forum_id', ''),
    groupId: getString(raw, 'group_id', ''),
    groupName: getString(raw, 'group_name', ''),
    groupColor: getStringOrNull(raw, 'group_color'),
    permissions: getPermRecord(raw, 'permissions'),
    createdAt: getString(raw, 'created_at', ''),
    updatedAt: getString(raw, 'updated_at', ''),
  };
}

function mapTemplate(raw: Record<string, unknown>): PermissionTemplateLocal {
  return {
    id: getString(raw, 'id', ''),
    forumId: getStringOrNull(raw, 'forum_id'),
    name: getString(raw, 'name', ''),
    description: getStringOrNull(raw, 'description'),
    isSystem: getBoolean(raw, 'is_system', false),
    permissions: getPermRecord(raw, 'permissions'),
    createdAt: getString(raw, 'created_at', ''),
    updatedAt: getString(raw, 'updated_at', ''),
  };
}

function mapEffectivePermission(raw: Record<string, unknown>): EffectivePermResult {
  return {
    permission: getString(raw, 'permission', ''),
    level: getPermLevel(raw, 'level'),
    source: getPermSource(raw, 'source'),
    inheritedFrom: getStringOrUndefined(raw, 'inherited_from'),
  };
}

const initialState = {
  boardPermissions: [],
  forumPermissions: [],
  templates: [],
  effectivePermissions: [],
  isLoadingBoardPerms: false,
  isLoadingTemplates: false,
  isLoadingForumPerms: false,
} satisfies Omit<
  PermissionsState,
  | 'fetchBoardPermissions' | 'updateBoardPermission' | 'resetBoardPermissions'
  | 'fetchForumPermissions' | 'updateForumPermission'
  | 'fetchTemplates' | 'createTemplate' | 'deleteTemplate' | 'applyTemplate' | 'duplicateTemplate'
  | 'checkPermission' | 'fetchEffectivePermissions' | 'reset'
>;

export const usePermissionsStore = create<PermissionsState>((set) => ({
  ...initialState,

  fetchBoardPermissions: async (boardId: string) => {
    set({ isLoadingBoardPerms: true });
    try {
      const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/boards/${boardId}/permissions`
      );
      set({
        boardPermissions: (res.permissions || []).map(mapBoardPermission),
        isLoadingBoardPerms: false,
      });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchBoardPermissions'
      );
      set({ isLoadingBoardPerms: false });
    }
  },

  updateBoardPermission: async (
    boardId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => {
    const res = await apiCall<{ permission: Record<string, unknown> }>(
      'put',
      `/api/v1/boards/${boardId}/permissions`,
      { group_id: groupId, permissions }
    );
    const perm = mapBoardPermission(res.permission);
    set((s) => ({
      boardPermissions: s.boardPermissions.some((p) => p.groupId === groupId)
        ? s.boardPermissions.map((p) => (p.groupId === groupId ? perm : p))
        : [...s.boardPermissions, perm],
    }));
  },

  resetBoardPermissions: async (boardId: string) => {
    await apiCall('delete', `/api/v1/boards/${boardId}/permissions/reset`);
    set({ boardPermissions: [] });
  },

  fetchForumPermissions: async (forumId: string) => {
    set({ isLoadingForumPerms: true });
    try {
      const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/permissions`
      );
      set({
        forumPermissions: (res.permissions || []).map(mapForumPermission),
        isLoadingForumPerms: false,
      });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchForumPermissions'
      );
      set({ isLoadingForumPerms: false });
    }
  },

  updateForumPermission: async (
    forumId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => {
    const res = await apiCall<{ permission: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/permissions`,
      { group_id: groupId, permissions }
    );
    const perm = mapForumPermission(res.permission);
    set((s) => ({
      forumPermissions: s.forumPermissions.some((p) => p.groupId === groupId)
        ? s.forumPermissions.map((p) => (p.groupId === groupId ? perm : p))
        : [...s.forumPermissions, perm],
    }));
  },

  fetchTemplates: async (forumId: string) => {
    set({ isLoadingTemplates: true });
    try {
      const res = await apiCall<{ templates: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/permission-templates`
      );
      set({
        templates: (res.templates || []).map(mapTemplate),
        isLoadingTemplates: false,
      });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchTemplates');
      set({ isLoadingTemplates: false });
    }
  },

  createTemplate: async (forumId: string, data: CreateTemplateData) => {
    const res = await apiCall<{ template: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/permission-templates`,
      { template: data }
    );
    const tmpl = mapTemplate(res.template);
    set((s) => ({ templates: [...s.templates, tmpl] }));
    return tmpl;
  },

  deleteTemplate: async (forumId: string, templateId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/permission-templates/${templateId}`);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) }));
  },

  applyTemplate: async (boardId: string, templateId: string) => {
    await apiCall('post', `/api/v1/boards/${boardId}/permissions/apply-template`, {
      template_id: templateId,
    });
    // Re-fetch board permissions after applying
    const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
      'get',
      `/api/v1/boards/${boardId}/permissions`
    );
    set({ boardPermissions: (res.permissions || []).map(mapBoardPermission) });
  },

  duplicateTemplate: async (forumId: string, templateId: string, newName: string) => {
    const res = await apiCall<{ template: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/permission-templates/${templateId}/duplicate`,
      { name: newName }
    );
    const tmpl = mapTemplate(res.template);
    set((s) => ({ templates: [...s.templates, tmpl] }));
    return tmpl;
  },

  checkPermission: async (boardId: string, groupId: string, permission: string) => {
    const res = await apiCall<{ effective: Record<string, unknown> }>(
      'get',
      `/api/v1/boards/${boardId}/permissions/check?group_id=${groupId}&permission=${permission}`
    );
    const effective = (res.effective != null && typeof res.effective === 'object')
      ? res.effective
      : {};
    // Use the caller's permission name as fallback if the API doesn't echo it
    const permName = typeof effective.permission === 'string' ? effective.permission : permission;
    return mapEffectivePermission({ ...effective, permission: permName });
  },

  fetchEffectivePermissions: async (boardId: string, groupId: string) => {
    try {
      const res = await apiCall<{ effective_permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/boards/${boardId}/permissions/effective?group_id=${groupId}`
      );
      const perms = (res.effective_permissions || []).map(mapEffectivePermission);
      set({ effectivePermissions: perms });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchEffectivePermissions'
      );
    }
  },

  reset: () => set({ ...initialState }),
}));
