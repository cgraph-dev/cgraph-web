/**
 * Forum Store — Permissions Slice Tests
 *
 * Tests for the dedicated permissions Zustand store:
 * board permissions, forum permissions, templates,
 * effective permission checks, and reset.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

// Mock axios (dynamically imported inside the store)
vi.mock('axios', () => ({
  default: vi.fn(),
}));

import axios from 'axios';
import { usePermissionsStore } from '../forumStore.permissions';
// PermissionsState type imported implicitly via usePermissionsStore

const mockedAxios = axios as unknown as ReturnType<typeof vi.fn>;
function resetStore() {
  usePermissionsStore.getState().reset();
}

function mockAxiosResponse(data: unknown) {
  mockedAxios.mockResolvedValueOnce({ data });
}
const rawBoardPerm = {
  id: 'bp-1',
  board_id: 'board-1',
  group_id: 'grp-1',
  group_name: 'Admins',
  group_color: '#ff0000',
  permissions: { can_post: 'allow', can_delete: 'deny' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const rawForumPerm = {
  id: 'fp-1',
  forum_id: 'forum-1',
  group_id: 'grp-1',
  group_name: 'Mods',
  group_color: null,
  permissions: { can_edit: 'allow' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const rawTemplate = {
  id: 'tmpl-1',
  forum_id: 'forum-1',
  name: 'Read Only',
  description: 'No posting',
  is_system: false,
  permissions: { can_post: 'deny', can_view: 'allow' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const rawEffective = {
  permission: 'can_post',
  level: 'allow',
  source: 'board',
  inherited_from: 'parent-board',
};

afterEach(() => {
  resetStore();
  vi.clearAllMocks();
});
describe('usePermissionsStore', () => {
  describe('initial state', () => {
    it('should have empty arrays and false loading states', () => {
      const s = usePermissionsStore.getState();
      expect(s.boardPermissions).toEqual([]);
      expect(s.forumPermissions).toEqual([]);
      expect(s.templates).toEqual([]);
      expect(s.effectivePermissions).toEqual([]);
      expect(s.isLoadingBoardPerms).toBe(false);
      expect(s.isLoadingTemplates).toBe(false);
      expect(s.isLoadingForumPerms).toBe(false);
    });
  });
  describe('fetchBoardPermissions', () => {
    it('should fetch and map board permissions', async () => {
      mockAxiosResponse({ permissions: [rawBoardPerm] });

      await usePermissionsStore.getState().fetchBoardPermissions('board-1');

      const s = usePermissionsStore.getState();
      expect(s.boardPermissions).toHaveLength(1);
      expect(s.boardPermissions[0]!.boardId).toBe('board-1');
      expect(s.boardPermissions[0]!.groupName).toBe('Admins');
      expect(s.boardPermissions[0]!.groupColor).toBe('#ff0000');
      expect(s.isLoadingBoardPerms).toBe(false);
    });

    it('should set loading state and reset on error', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Network'));

      await usePermissionsStore.getState().fetchBoardPermissions('board-1');

      expect(usePermissionsStore.getState().isLoadingBoardPerms).toBe(false);
      expect(usePermissionsStore.getState().boardPermissions).toEqual([]);
    });
  });

  describe('updateBoardPermission', () => {
    it('should update an existing permission for the group', async () => {
      usePermissionsStore.setState({
        boardPermissions: [{
          id: 'bp-1',
          boardId: 'board-1',
          groupId: 'grp-1',
          groupName: 'Admins',
          groupColor: '#ff0000',
          permissions: { can_post: 'allow' },
          createdAt: '',
          updatedAt: '',
        }],
      });
      mockAxiosResponse({
        permission: { ...rawBoardPerm, permissions: { can_post: 'deny' } },
      });

      await usePermissionsStore.getState().updateBoardPermission('board-1', 'grp-1', { can_post: 'deny' });

      const perms = usePermissionsStore.getState().boardPermissions;
      expect(perms).toHaveLength(1);
      expect(perms[0]!.permissions.can_post).toBe('deny');
    });

    it('should add a new permission if group is not present', async () => {
      usePermissionsStore.setState({ boardPermissions: [] });
      mockAxiosResponse({ permission: rawBoardPerm });

      await usePermissionsStore.getState().updateBoardPermission('board-1', 'grp-1', { can_post: 'allow' });

      expect(usePermissionsStore.getState().boardPermissions).toHaveLength(1);
    });
  });

  describe('resetBoardPermissions', () => {
    it('should clear board permissions after API call', async () => {
      usePermissionsStore.setState({
        boardPermissions: [{
          id: 'bp-1', boardId: 'b', groupId: 'g', groupName: 'G',
          groupColor: null, permissions: {}, createdAt: '', updatedAt: '',
        }],
      });
      mockAxiosResponse({});

      await usePermissionsStore.getState().resetBoardPermissions('board-1');

      expect(usePermissionsStore.getState().boardPermissions).toEqual([]);
    });
  });
  describe('fetchForumPermissions', () => {
    it('should fetch and map forum permissions', async () => {
      mockAxiosResponse({ permissions: [rawForumPerm] });

      await usePermissionsStore.getState().fetchForumPermissions('forum-1');

      const s = usePermissionsStore.getState();
      expect(s.forumPermissions).toHaveLength(1);
      expect(s.forumPermissions[0]!.forumId).toBe('forum-1');
      expect(s.forumPermissions[0]!.groupName).toBe('Mods');
      expect(s.isLoadingForumPerms).toBe(false);
    });

    it('should reset loading on error', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await usePermissionsStore.getState().fetchForumPermissions('forum-1');

      expect(usePermissionsStore.getState().isLoadingForumPerms).toBe(false);
    });
  });

  describe('updateForumPermission', () => {
    it('should update existing forum permission by group', async () => {
      usePermissionsStore.setState({
        forumPermissions: [{
          id: 'fp-1', forumId: 'forum-1', groupId: 'grp-1', groupName: 'Mods',
          groupColor: null, permissions: { can_edit: 'allow' }, createdAt: '', updatedAt: '',
        }],
      });
      mockAxiosResponse({
        permission: { ...rawForumPerm, permissions: { can_edit: 'deny' } },
      });

      await usePermissionsStore.getState().updateForumPermission('forum-1', 'grp-1', { can_edit: 'deny' });

      expect(usePermissionsStore.getState().forumPermissions[0]!.permissions.can_edit).toBe('deny');
    });

    it('should add permission if group not found', async () => {
      usePermissionsStore.setState({ forumPermissions: [] });
      mockAxiosResponse({ permission: rawForumPerm });

      await usePermissionsStore.getState().updateForumPermission('forum-1', 'grp-1', { can_edit: 'allow' });

      expect(usePermissionsStore.getState().forumPermissions).toHaveLength(1);
    });
  });
  describe('fetchTemplates', () => {
    it('should fetch and map templates', async () => {
      mockAxiosResponse({ templates: [rawTemplate] });

      await usePermissionsStore.getState().fetchTemplates('forum-1');

      const s = usePermissionsStore.getState();
      expect(s.templates).toHaveLength(1);
      expect(s.templates[0]!.name).toBe('Read Only');
      expect(s.templates[0]!.isSystem).toBe(false);
      expect(s.isLoadingTemplates).toBe(false);
    });

    it('should reset loading on error', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await usePermissionsStore.getState().fetchTemplates('forum-1');

      expect(usePermissionsStore.getState().isLoadingTemplates).toBe(false);
    });
  });

  describe('createTemplate', () => {
    it('should create a template and add it to state', async () => {
      mockAxiosResponse({ template: rawTemplate });

      const result = await usePermissionsStore.getState().createTemplate('forum-1', {
        name: 'Read Only',
        permissions: { can_post: 'deny' },
      });

      expect(result.id).toBe('tmpl-1');
      expect(usePermissionsStore.getState().templates).toHaveLength(1);
    });
  });

  describe('deleteTemplate', () => {
    it('should remove the template from state', async () => {
      usePermissionsStore.setState({
        templates: [{
          id: 'tmpl-1', forumId: 'forum-1', name: 'X', description: null,
          isSystem: false, permissions: {}, createdAt: '', updatedAt: '',
        }],
      });
      mockAxiosResponse({});

      await usePermissionsStore.getState().deleteTemplate('forum-1', 'tmpl-1');

      expect(usePermissionsStore.getState().templates).toHaveLength(0);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template and re-fetch board permissions', async () => {
      // First call: apply template
      mockAxiosResponse({});
      // Second call: re-fetch permissions
      mockAxiosResponse({ permissions: [rawBoardPerm] });

      await usePermissionsStore.getState().applyTemplate('board-1', 'tmpl-1');

      expect(usePermissionsStore.getState().boardPermissions).toHaveLength(1);
      expect(mockedAxios).toHaveBeenCalledTimes(2);
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate and add the new template to state', async () => {
      const duplicated = { ...rawTemplate, id: 'tmpl-2', name: 'Copy of Read Only' };
      mockAxiosResponse({ template: duplicated });

      const result = await usePermissionsStore.getState().duplicateTemplate('forum-1', 'tmpl-1', 'Copy of Read Only');

      expect(result.id).toBe('tmpl-2');
      expect(result.name).toBe('Copy of Read Only');
      expect(usePermissionsStore.getState().templates).toHaveLength(1);
    });
  });
  describe('checkPermission', () => {
    it('should return mapped effective permission result', async () => {
      mockAxiosResponse({ effective: rawEffective });

      const result = await usePermissionsStore.getState().checkPermission('board-1', 'grp-1', 'can_post');

      expect(result.permission).toBe('can_post');
      expect(result.level).toBe('allow');
      expect(result.source).toBe('board');
      expect(result.inheritedFrom).toBe('parent-board');
    });

    it('should default permission name from argument if API omits it', async () => {
      mockAxiosResponse({ effective: { level: 'deny', source: 'default' } });

      const result = await usePermissionsStore.getState().checkPermission('b-1', 'g-1', 'can_edit');

      expect(result.permission).toBe('can_edit');
      expect(result.level).toBe('deny');
    });

    it('should default to inherit level for invalid values', async () => {
      mockAxiosResponse({ effective: { level: 'invalid', source: 'default' } });

      const result = await usePermissionsStore.getState().checkPermission('b-1', 'g-1', 'x');

      expect(result.level).toBe('inherit');
    });
  });

  describe('fetchEffectivePermissions', () => {
    it('should fetch and store effective permissions', async () => {
      mockAxiosResponse({ effective_permissions: [rawEffective] });

      await usePermissionsStore.getState().fetchEffectivePermissions('board-1', 'grp-1');

      const perms = usePermissionsStore.getState().effectivePermissions;
      expect(perms).toHaveLength(1);
      expect(perms[0]!.permission).toBe('can_post');
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Fail'));

      await usePermissionsStore.getState().fetchEffectivePermissions('b-1', 'g-1');

      expect(usePermissionsStore.getState().effectivePermissions).toEqual([]);
    });
  });
  describe('reset', () => {
    it('should restore initial state', () => {
      usePermissionsStore.setState({
        boardPermissions: [{
          id: 'x', boardId: 'b', groupId: 'g', groupName: 'G',
          groupColor: null, permissions: {}, createdAt: '', updatedAt: '',
        }],
        templates: [{
          id: 't', forumId: null, name: 'T', description: null,
          isSystem: true, permissions: {}, createdAt: '', updatedAt: '',
        }],
        isLoadingBoardPerms: true,
      });

      usePermissionsStore.getState().reset();

      const s = usePermissionsStore.getState();
      expect(s.boardPermissions).toEqual([]);
      expect(s.templates).toEqual([]);
      expect(s.isLoadingBoardPerms).toBe(false);
    });
  });
});
