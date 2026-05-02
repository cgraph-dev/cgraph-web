/**
 * Forum Store — Admin Actions Tests
 *
 * Tests for user groups, warnings, bans, moderation queue,
 * and reports admin functionality.
 */

import { describe, it, expect, afterEach, vi, type MockedFunction } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Note: @/lib/api-utils is NOT mocked — real ensureArray/ensureObject are used

import { api } from '@/lib/api-client';
import { createAdminActions } from '../forumStore.admin';
import type { ForumState, UserGroup, Ban, ModerationQueueItem, Report } from '../forumStore.types';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};
function createTestStore(overrides: Partial<ForumState> = {}) {
  const state: Partial<ForumState> = {
    userGroups: [],
    moderationQueue: [],
    reports: [],
    ...overrides,
  };

  const set = (partial: Partial<ForumState> | ((s: ForumState) => Partial<ForumState>)) => {
    if (typeof partial === 'function') {
      Object.assign(state, partial(state as ForumState));
    } else {
      Object.assign(state, partial);
    }
  };
  const get = () => state as ForumState;

  const actions = createAdminActions(set, get);
  return { state, actions };
}
const mockUserGroup: UserGroup = {
  id: 'ug-1',
  name: 'Moderators',
  description: 'Forum mods',
  color: '#00ff00',
  type: 'custom',
  isHidden: false,
  isSuperMod: false,
  canModerate: true,
  canAdmin: false,
  permissions: {
    canViewForum: true,
    canPostThreads: true,
    canPostReplies: true,
    canPostPolls: false,
    canAttachFiles: true,
    canEditOwnPosts: true,
    canDeleteOwnPosts: true,
    canRateThreads: true,
    canUseReputation: true,
    canSendPM: true,
    maxPMRecipients: 10,
    pmQuota: 100,
    attachmentQuota: 50,
    canEditPosts: true,
    canDeletePosts: true,
    canLockThreads: true,
    canMoveThreads: true,
    canSplitThreads: false,
    canMergeThreads: false,
    canWarnUsers: true,
    canBanUsers: false,
  },
  members: 5,
};

const mockBan: Ban = {
  id: 'ban-1',
  userId: 'user-bad',
  username: 'baduser',
  reason: 'Spam',
  bannedBy: 'admin-1',
  bannedByUsername: 'admin',
  bannedAt: '2026-01-01T00:00:00Z',
  isActive: true,
};

const mockQueueItem: ModerationQueueItem = {
  id: 'q-1',
  itemType: 'post',
  itemId: 'post-1',
  authorId: 'user-1',
  authorUsername: 'newuser',
  forumId: 'forum-1',
  forumName: 'General',
  title: 'My First Post',
  content: 'Hello world',
  reason: 'new_user',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockReport: Report = {
  id: 'r-1',
  reportType: 'post',
  itemId: 'post-1',
  reportedBy: 'user-1',
  reportedByUsername: 'reporter',
  reason: 'spam',
  details: 'This is spam content',
  status: 'open',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

afterEach(() => {
  vi.clearAllMocks();
});
describe('createAdminActions', () => {
  describe('fetchUserGroups', () => {
    it('should fetch and store user groups', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockResolvedValue({ data: { user_groups: [mockUserGroup] } });

      await actions.fetchUserGroups();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/user-groups');
      expect(state.userGroups).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      await actions.fetchUserGroups();

      expect(state.userGroups).toEqual([]);
    });
  });

  describe('createUserGroup', () => {
    it('should create a group and add to state', async () => {
      const { state, actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { user_group: mockUserGroup } });

      const result = await actions.createUserGroup({
        name: 'Moderators',
        type: 'custom',
        permissions: { canViewForum: true },
      });

      expect(result.id).toBe('ug-1');
      expect(state.userGroups).toHaveLength(1);
    });

    it('should throw when API returns no group', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(
        actions.createUserGroup({ name: 'X', type: 'custom', permissions: {} })
      ).rejects.toThrow('Failed to create user group');
    });

    it('should send correct payload', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { user_group: mockUserGroup } });

      await actions.createUserGroup({
        name: 'Admins',
        description: 'Admin group',
        color: '#ff0000',
        type: 'system',
        permissions: { canBanUsers: true },
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/user-groups', {
        name: 'Admins',
        description: 'Admin group',
        color: '#ff0000',
        type: 'system',
        permissions: { canBanUsers: true },
      });
    });
  });

  describe('updateUserGroup', () => {
    it('should update a group in state', async () => {
      const updated = { ...mockUserGroup, name: 'Super Mods' };
      const { state, actions } = createTestStore({ userGroups: [mockUserGroup] });
      mockedApi.put.mockResolvedValue({ data: { user_group: updated } });

      const result = await actions.updateUserGroup('ug-1', { name: 'Super Mods' });

      expect(result.name).toBe('Super Mods');
      expect(state.userGroups![0]!.name).toBe('Super Mods');
    });

    it('should throw when API returns no group', async () => {
      const { actions } = createTestStore();
      mockedApi.put.mockResolvedValue({ data: {} });

      await expect(actions.updateUserGroup('ug-1', { name: 'X' })).rejects.toThrow(
        'Failed to update user group'
      );
    });
  });

  describe('deleteUserGroup', () => {
    it('should remove the group from state', async () => {
      const { state, actions } = createTestStore({ userGroups: [mockUserGroup] });
      mockedApi.delete.mockResolvedValue({});

      await actions.deleteUserGroup('ug-1');

      expect(state.userGroups).toHaveLength(0);
    });

    it('should propagate errors', async () => {
      const { actions } = createTestStore();
      mockedApi.delete.mockRejectedValue(new Error('Forbidden'));

      await expect(actions.deleteUserGroup('ug-1')).rejects.toThrow('Forbidden');
    });
  });
  describe('warnUser', () => {
    it('should issue a warning and return it', async () => {
      const { actions } = createTestStore();
      const mockWarning = {
        id: 'w-1',
        userId: 'user-1',
        reason: 'Spam',
        points: 3,
        isActive: true,
      };
      mockedApi.post.mockResolvedValue({ data: { warning: mockWarning } });

      const result = await actions.warnUser('user-1', 'wt-1', 'Spam');

      expect(result.id).toBe('w-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/users/user-1/warnings', {
        warning_type_id: 'wt-1',
        reason: 'Spam',
      });
    });

    it('should throw when no warning returned', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(actions.warnUser('u-1', 'wt-1', 'X')).rejects.toThrow('Failed to issue warning');
    });
  });

  describe('fetchUserWarnings', () => {
    it('should return warnings array', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: { warnings: [{ id: 'w-1', reason: 'Spam' }] },
      });

      const result = await actions.fetchUserWarnings('user-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      const result = await actions.fetchUserWarnings('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('banUser', () => {
    it('should create a ban and return it', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { ban: mockBan } });

      const result = await actions.banUser({
        userId: 'user-bad',
        reason: 'Spam',
        expiresAt: null,
      });

      expect(result.id).toBe('ban-1');
    });

    it('should throw when no ban returned', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(actions.banUser({ reason: 'X' })).rejects.toThrow('Failed to create ban');
    });
  });

  describe('unbanUser', () => {
    it('should call DELETE endpoint', async () => {
      const { actions } = createTestStore();
      mockedApi.delete.mockResolvedValue({});

      await actions.unbanUser('ban-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/admin/bans/ban-1');
    });
  });

  describe('fetchBans', () => {
    it('should return bans array', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({ data: { bans: [mockBan] } });

      const result = await actions.fetchBans();

      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      const result = await actions.fetchBans();

      expect(result).toEqual([]);
    });
  });
  describe('fetchModerationQueue', () => {
    it('should fetch and store queue items', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockResolvedValue({ data: { items: [mockQueueItem] } });

      await actions.fetchModerationQueue();

      expect(state.moderationQueue).toHaveLength(1);
      expect(state.moderationQueue![0]!.status).toBe('pending');
    });
  });

  describe('approveQueueItem', () => {
    it('should remove item from queue after approval', async () => {
      const { state, actions } = createTestStore({ moderationQueue: [mockQueueItem] });
      mockedApi.post.mockResolvedValue({});

      await actions.approveQueueItem('q-1');

      expect(state.moderationQueue).toHaveLength(0);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-1/approve');
    });

    it('should propagate errors', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockRejectedValue(new Error('Fail'));

      await expect(actions.approveQueueItem('q-1')).rejects.toThrow('Fail');
    });
  });

  describe('rejectQueueItem', () => {
    it('should remove item from queue after rejection', async () => {
      const { state, actions } = createTestStore({ moderationQueue: [mockQueueItem] });
      mockedApi.post.mockResolvedValue({});

      await actions.rejectQueueItem('q-1', 'Not acceptable');

      expect(state.moderationQueue).toHaveLength(0);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-1/reject', {
        reason: 'Not acceptable',
      });
    });

    it('should work without a reason', async () => {
      const { state, actions } = createTestStore({ moderationQueue: [mockQueueItem] });
      mockedApi.post.mockResolvedValue({});

      await actions.rejectQueueItem('q-1');

      expect(state.moderationQueue).toHaveLength(0);
    });
  });
  describe('reportItem', () => {
    it('should submit a report and add to state', async () => {
      const { state, actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { report: mockReport } });

      const result = await actions.reportItem({
        reportType: 'post',
        itemId: 'post-1',
        reason: 'spam',
        details: 'Spam content',
      });

      expect(result.id).toBe('r-1');
      expect(state.reports).toHaveLength(1);
    });

    it('should throw when no report returned', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(
        actions.reportItem({ reportType: 'post', itemId: 'x', reason: 'x' })
      ).rejects.toThrow('Failed to submit report');
    });

    it('should send correct payload format', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { report: mockReport } });

      await actions.reportItem({
        reportType: 'comment',
        itemId: 'c-1',
        reason: 'harassment',
        details: 'Offensive language',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/reports', {
        report: {
          reason: 'harassment',
          details: 'Offensive language',
          report_type: 'comment',
          item_id: 'c-1',
        },
      });
    });
  });

  describe('fetchReports', () => {
    it('should return reports', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({ data: { reports: [mockReport] } });

      const result = await actions.fetchReports();

      expect(result).toHaveLength(1);
    });

    it('should pass status filter', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({ data: { reports: [] } });

      await actions.fetchReports('open');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/reports', {
        params: { status: 'open' },
      });
    });

    it('should return empty array on error', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      const result = await actions.fetchReports();

      expect(result).toEqual([]);
    });
  });

  describe('assignReport', () => {
    it('should call assign endpoint', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({});

      await actions.assignReport('r-1', 'mod-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/reports/r-1/assign', {
        moderator_id: 'mod-1',
      });
    });
  });

  describe('resolveReport', () => {
    it('should call resolve endpoint', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({});

      await actions.resolveReport('r-1', 'Warning issued');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/reports/r-1/resolve', {
        resolution: 'Warning issued',
      });
    });
  });
});
