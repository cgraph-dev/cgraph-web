/**
 * Forum Store — Feature Actions Tests
 *
 * Tests for thread prefixes, ratings, attachments, edit history,
 * polls, thread subscriptions, and category CRUD.
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
import { createFeatureActions } from '../forumStore.features';
import type { ForumState, Forum, Post, Subscription } from '../forumStore.types';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};
function createTestStore(overrides: Partial<ForumState> = {}) {
  const state: Partial<ForumState> = {
    threadPrefixes: [],
    subscriptions: [],
    posts: [],
    currentPost: null,
    currentForum: null,
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

  const actions = createFeatureActions(set, get);
  return { state, actions };
}

afterEach(() => {
  vi.clearAllMocks();
});
describe('createFeatureActions', () => {
  describe('fetchThreadPrefixes', () => {
    it('should fetch prefixes for a specific forum', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: { prefixes: [{ id: 'p-1', name: 'Discussion', color: '#3B82F6' }] },
      });

      await actions.fetchThreadPrefixes('forum-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums/forum-1/thread-prefixes');
      expect(state.threadPrefixes).toHaveLength(1);
      expect(state.threadPrefixes![0]!.name).toBe('Discussion');
    });

    it('should fetch admin prefixes when no forumId', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: { prefixes: [] },
      });

      await actions.fetchThreadPrefixes();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/thread-prefixes');
    });

    it('should fall back to defaults on error', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Not Found'));

      await actions.fetchThreadPrefixes('forum-1');

      expect(state.threadPrefixes!.length).toBe(4);
      expect(state.threadPrefixes![0]!.name).toBe('Discussion');
      expect(state.threadPrefixes![3]!.name).toBe('Solved');
    });
  });

  describe('createThreadPrefix', () => {
    it('should create a prefix and add to state', async () => {
      const { state, actions } = createTestStore();
      mockedApi.post.mockResolvedValue({
        data: { prefix: { id: 'p-1', name: 'Bug', color: '#EF4444' } },
      });

      const result = await actions.createThreadPrefix({
        name: 'Bug',
        color: '#EF4444',
        forums: ['forum-1'],
      });

      expect(result.name).toBe('Bug');
      expect(state.threadPrefixes).toHaveLength(1);
    });

    it('should propagate errors', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockRejectedValue(new Error('Forbidden'));

      await expect(
        actions.createThreadPrefix({ name: 'X', color: '#000', forums: [] })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('deleteThreadPrefix', () => {
    it('should remove prefix from state', async () => {
      const { state, actions } = createTestStore({
        threadPrefixes: [
          { id: 'p-1', name: 'Bug', color: '#EF4444' },
          { id: 'p-2', name: 'Help', color: '#000' },
        ],
      });
      mockedApi.delete.mockResolvedValue({});

      await actions.deleteThreadPrefix('p-1');

      expect(state.threadPrefixes).toHaveLength(1);
      expect(state.threadPrefixes![0]!.id).toBe('p-2');
    });
  });
  describe('rateThread', () => {
    it('should update post rating in posts list and currentPost', async () => {
      const post = {
        id: 'post-1',
        rating: 3.0,
        ratingCount: 5,
        myRating: null,
      } as unknown as Post;

      const { state, actions } = createTestStore({
        posts: [post],
        currentPost: post,
      });

      mockedApi.post.mockResolvedValue({
        data: { average_rating: 3.5, rating_count: 6 },
      });

      await actions.rateThread('post-1', 4);

      expect(state.posts![0]!.rating).toBe(3.5);
      expect(state.posts![0]!.ratingCount).toBe(6);
      expect(state.posts![0]!.myRating).toBe(4);
      expect(state.currentPost!.rating).toBe(3.5);
    });

    it('should propagate errors', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockRejectedValue(new Error('Fail'));

      await expect(actions.rateThread('post-1', 5)).rejects.toThrow('Fail');
    });
  });

  describe('fetchThreadRatings', () => {
    it('should return ratings array', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: { ratings: [{ id: 'r-1', rating: 5 }] },
      });

      const result = await actions.fetchThreadRatings('post-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      const result = await actions.fetchThreadRatings('post-1');

      expect(result).toEqual([]);
    });
  });
  describe('uploadAttachment', () => {
    it('should upload a file and return the attachment', async () => {
      const { actions } = createTestStore();
      const mockAttachment = {
        id: 'att-1',
        filename: 'test.pdf',
        downloadUrl: '/files/test.pdf',
      };
      mockedApi.post.mockResolvedValue({
        data: { attachment: mockAttachment },
      });

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await actions.uploadAttachment(file, 'post-1');

      expect(result).toEqual(mockAttachment);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/attachments', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should throw when no attachment returned', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      const file = new File([''], 'x.txt');
      await expect(actions.uploadAttachment(file)).rejects.toThrow('Failed to upload attachment');
    });
  });

  describe('deleteAttachment', () => {
    it('should call DELETE endpoint', async () => {
      const { actions } = createTestStore();
      mockedApi.delete.mockResolvedValue({});

      await actions.deleteAttachment('att-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/attachments/att-1');
    });
  });
  describe('fetchEditHistory', () => {
    it('should return history array', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: { history: [{ id: 'h-1', editedAt: '2026-01-01' }] },
      });

      const result = await actions.fetchEditHistory('post-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const { actions } = createTestStore();
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      const result = await actions.fetchEditHistory('post-1');

      expect(result).toEqual([]);
    });
  });
  describe('createPoll', () => {
    it('should create a poll and return it', async () => {
      const { actions } = createTestStore();
      const mockPoll = { id: 'poll-1', question: 'Favorite?', options: [] };
      mockedApi.post.mockResolvedValue({ data: { poll: mockPoll } });

      const result = await actions.createPoll('post-1', {
        question: 'Favorite?',
        options: ['A', 'B'],
        allowMultiple: false,
        public: true,
      });

      expect(result).toEqual(mockPoll);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/poll', {
        question: 'Favorite?',
        options: ['A', 'B'],
        allow_multiple: false,
        max_selections: undefined,
        timeout: undefined,
        public: true,
      });
    });

    it('should throw when no poll returned', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(
        actions.createPoll('p-1', {
          question: 'X',
          options: [],
          allowMultiple: false,
          public: false,
        })
      ).rejects.toThrow('Failed to create poll');
    });
  });

  describe('votePoll', () => {
    it('should call vote endpoint with option IDs', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({});

      await actions.votePoll('poll-1', ['opt-1', 'opt-2']);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forum-polls/poll-1/vote', {
        option_ids: ['opt-1', 'opt-2'],
      });
    });
  });

  describe('closePoll', () => {
    it('should call close endpoint', async () => {
      const { actions } = createTestStore();
      mockedApi.post.mockResolvedValue({});

      await actions.closePoll('poll-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forum-polls/poll-1/close');
    });
  });
  describe('subscribeThread', () => {
    it('should subscribe and add to subscriptions list', async () => {
      const { state, actions } = createTestStore();
      mockedApi.post.mockResolvedValue({});

      await actions.subscribeThread('post-1', 'email');

      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions![0]!.entityId).toBe('post-1');
      expect(state.subscriptions![0]!.notificationMode).toBe('email');
      expect(state.subscriptions![0]!.entityType).toBe('thread');
    });
  });

  describe('unsubscribeThread', () => {
    it('should remove subscription from state', async () => {
      const sub: Subscription = {
        id: 'sub-post-1',
        userId: '',
        entityType: 'thread',
        entityId: 'post-1',
        notificationMode: 'email',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const { state, actions } = createTestStore({ subscriptions: [sub] });
      mockedApi.delete.mockResolvedValue({});

      await actions.unsubscribeThread('post-1');

      expect(state.subscriptions).toHaveLength(0);
    });
  });

  describe('updateSubscription', () => {
    it('should update the notification mode', async () => {
      const sub: Subscription = {
        id: 'sub-1',
        userId: 'u',
        entityType: 'thread',
        entityId: 'post-1',
        notificationMode: 'email',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const { state, actions } = createTestStore({ subscriptions: [sub] });
      mockedApi.put.mockResolvedValue({});

      await actions.updateSubscription('sub-1', 'instant');

      expect(state.subscriptions![0]!.notificationMode).toBe('instant');
    });
  });

  describe('fetchSubscriptions', () => {
    it('should fetch and store subscriptions', async () => {
      const { state, actions } = createTestStore();
      mockedApi.get.mockResolvedValue({
        data: {
          subscriptions: [
            {
              id: 's-1',
              userId: 'u-1',
              entityType: 'thread',
              entityId: 'post-1',
              notificationMode: 'instant',
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        },
      });

      await actions.fetchSubscriptions();

      expect(state.subscriptions).toHaveLength(1);
    });
  });
  describe('fetchCategories', () => {
    it('should fetch categories and set on currentForum', async () => {
      const forum: Forum = {
        id: 'forum-1',
        name: 'F',
        slug: 'f',
        description: null,
        iconUrl: null,
        bannerUrl: null,
        customCss: null,
        isNsfw: false,
        isPrivate: false,
        isPublic: true,
        memberCount: 0,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        hotScore: 0,
        weeklyScore: 0,
        featured: false,
        userVote: 0,
        categories: [],
        moderators: [],
        isSubscribed: false,
        isMember: false,
        ownerId: null,
        createdAt: '',
      };
      const { state, actions } = createTestStore({ currentForum: forum });
      mockedApi.get.mockResolvedValue({
        data: { categories: [{ id: 'cat-1', name: 'General' }] },
      });

      await actions.fetchCategories('forum-1');

      expect(state.currentForum!.categories).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    it('should add category to currentForum', async () => {
      const forum: Forum = {
        id: 'forum-1',
        name: 'F',
        slug: 'f',
        description: null,
        iconUrl: null,
        bannerUrl: null,
        customCss: null,
        isNsfw: false,
        isPrivate: false,
        isPublic: true,
        memberCount: 0,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        hotScore: 0,
        weeklyScore: 0,
        featured: false,
        userVote: 0,
        categories: [],
        moderators: [],
        isSubscribed: false,
        isMember: false,
        ownerId: null,
        createdAt: '',
      };
      const { state, actions } = createTestStore({ currentForum: forum });
      const newCat = { id: 'cat-new', name: 'News', slug: 'news', order: 1, postCount: 0 };
      mockedApi.post.mockResolvedValue({ data: { category: newCat } });

      await actions.createCategory('forum-1', { name: 'News', color: '#ff0' });

      expect(state.currentForum!.categories).toHaveLength(1);
    });
  });

  describe('deleteCategory', () => {
    it('should remove category from currentForum', async () => {
      const forum: Forum = {
        id: 'forum-1',
        name: 'F',
        slug: 'f',
        description: null,
        iconUrl: null,
        bannerUrl: null,
        customCss: null,
        isNsfw: false,
        isPrivate: false,
        isPublic: true,
        memberCount: 0,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        hotScore: 0,
        weeklyScore: 0,
        featured: false,
        userVote: 0,
        categories: [
          { id: 'cat-1', name: 'General', slug: 'gen', order: 0, postCount: 5 },
          { id: 'cat-2', name: 'News', slug: 'news', order: 1, postCount: 3 },
        ],
        moderators: [],
        isSubscribed: false,
        isMember: false,
        ownerId: null,
        createdAt: '',
      };
      const { state, actions } = createTestStore({ currentForum: forum });
      mockedApi.delete.mockResolvedValue({});

      await actions.deleteCategory('forum-1', 'cat-1');

      expect(state.currentForum!.categories).toHaveLength(1);
      expect(state.currentForum!.categories[0]!.id).toBe('cat-2');
    });
  });
});
