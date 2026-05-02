/**
 * Forum Store — Forum CRUD Actions Tests
 *
 * Tests for subscribe/unsubscribe
 * and full CRUD operations (create, update, delete).
 */

import { describe, it, expect, afterEach, vi, type MockedFunction } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
import { createForumCrudActions } from '../forumStore.forumCrud';
import type { Forum, ForumState } from '../forumStore.types';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};
const makeForum = (overrides: Partial<Forum> = {}): Forum => ({
  id: 'forum-1',
  name: 'Test Forum',
  slug: 'test-forum',
  description: 'A test forum',
  iconUrl: null,
  bannerUrl: null,
  customCss: null,
  isNsfw: false,
  isPrivate: false,
  isPublic: true,
  memberCount: 100,
  score: 50,
  upvotes: 60,
  downvotes: 10,
  hotScore: 40,
  weeklyScore: 75,
  featured: false,
  userVote: 0,
  categories: [],
  moderators: [],
  isSubscribed: false,
  isMember: false,
  ownerId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function createTestStore() {
  const state: Partial<ForumState> = {
    forums: [],
  };

  const set = (partial: Partial<ForumState> | ((s: ForumState) => Partial<ForumState>)) => {
    if (typeof partial === 'function') {
      Object.assign(state, partial(state as ForumState));
    } else {
      Object.assign(state, partial);
    }
  };
  const get = () => state as ForumState;

  const actions = createForumCrudActions(set, get);
  return { state, actions, set, get };
}

afterEach(() => {
  vi.clearAllMocks();
});
describe('createForumCrudActions', () => {
  describe('subscribe', () => {
    it('should call POST and set isSubscribed=true, increment memberCount', async () => {
      const forum = makeForum({ id: 'f-1', isSubscribed: false, memberCount: 10 });
      const { state, actions } = createTestStore();
      state.forums = [forum];
      mockedApi.post.mockResolvedValue({});

      await actions.subscribe('f-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums/f-1/subscribe');
      expect(state.forums![0]!.isSubscribed).toBe(true);
      expect(state.forums![0]!.memberCount).toBe(11);
    });

    it('should not affect other forums', async () => {
      const forum1 = makeForum({ id: 'f-1', isSubscribed: false, memberCount: 5 });
      const forum2 = makeForum({ id: 'f-2', isSubscribed: false, memberCount: 20 });
      const { state, actions } = createTestStore();
      state.forums = [forum1, forum2];
      mockedApi.post.mockResolvedValue({});

      await actions.subscribe('f-1');

      expect(state.forums![1]!.isSubscribed).toBe(false);
      expect(state.forums![1]!.memberCount).toBe(20);
    });
  });

  describe('unsubscribe', () => {
    it('should call DELETE and set isSubscribed=false, decrement memberCount', async () => {
      const forum = makeForum({ id: 'f-1', isSubscribed: true, memberCount: 10 });
      const { state, actions } = createTestStore();
      state.forums = [forum];
      mockedApi.delete.mockResolvedValue({});

      await actions.unsubscribe('f-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/forums/f-1/subscribe');
      expect(state.forums![0]!.isSubscribed).toBe(false);
      expect(state.forums![0]!.memberCount).toBe(9);
    });
  });

  describe('createForum', () => {
    it('should create a forum and prepend it to the forums list', async () => {
      const { state, actions } = createTestStore();
      state.forums = [makeForum({ id: 'existing' })];
      const newForum = makeForum({ id: 'new-forum' });
      mockedApi.post.mockResolvedValue({ data: { forum: newForum } });

      const result = await actions.createForum({ name: 'New Forum' });

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/forums',
        expect.objectContaining({ name: 'New Forum' })
      );
      expect(result.id).toBe('new-forum');
      expect(state.forums![0]!.id).toBe('new-forum');
      expect(state.forums).toHaveLength(2);
    });

    it('should pass all create options to the API', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: { forum: makeForum() } });

      await actions.createForum({
        name: 'Test',
        description: 'desc',
        isNsfw: true,
        isPrivate: true,
        categoryId: 'cat-1',
        tags: ['a', 'b'],
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        allowPolls: true,
        allowAttachments: false,
        requireApproval: true,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums', {
        name: 'Test',
        description: 'desc',
        is_nsfw: true,
        is_private: true,
        category_id: 'cat-1',
        tags: ['a', 'b'],
        primary_color: '#ff0000',
        secondary_color: '#00ff00',
        allow_polls: true,
        allow_attachments: false,
        require_approval: true,
      });
    });

    it('should throw when API returns no forum object', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(actions.createForum({ name: 'X' })).rejects.toThrow('Failed to create forum');
    });

    it('should propagate API errors', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockRejectedValue(new Error('Forbidden'));

      await expect(actions.createForum({ name: 'X' })).rejects.toThrow('Forbidden');
    });
  });

  describe('updateForum', () => {
    it('should update a forum and replace it in the list', async () => {
      const existing = makeForum({ id: 'f-1', name: 'Old Name' });
      const { state, actions } = createTestStore();
      state.forums = [existing];
      mockedApi.put.mockResolvedValue({
        data: { forum: { id: 'f-1', name: 'New Name', slug: 'new' } },
      });

      const result = await actions.updateForum('f-1', { name: 'New Name' });

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/api/v1/forums/f-1',
        expect.objectContaining({ name: 'New Name' })
      );
      expect(result.name).toBe('New Name');
      expect(state.forums).toHaveLength(1);
    });

    it('should throw when API returns no forum', async () => {
      const { actions } = createTestStore();
      mockedApi.put.mockResolvedValue({ data: {} });

      await expect(actions.updateForum('f-1', { name: 'X' })).rejects.toThrow(
        'Failed to update forum'
      );
    });

    it('should propagate API errors', async () => {
      const { actions } = createTestStore();
      mockedApi.put.mockRejectedValue(new Error('Not Found'));

      await expect(actions.updateForum('f-1', { name: 'X' })).rejects.toThrow('Not Found');
    });
  });

  describe('deleteForum', () => {
    it('should remove the forum from the list', async () => {
      const { state, actions } = createTestStore();
      state.forums = [makeForum({ id: 'f-1' }), makeForum({ id: 'f-2' })];
      mockedApi.delete.mockResolvedValue({});

      await actions.deleteForum('f-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/forums/f-1');
      expect(state.forums).toHaveLength(1);
      expect(state.forums![0]!.id).toBe('f-2');
    });

    it('should propagate API errors', async () => {
      const { actions } = createTestStore();
      mockedApi.delete.mockRejectedValue(new Error('Unauthorized'));

      await expect(actions.deleteForum('f-1')).rejects.toThrow('Unauthorized');
    });
  });
});
