import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  useForumDetailSliceStore,
  useForumListSliceStore,
  useForumModerationSliceStore,
  useForumStore,
  type Forum,
  type ModerationQueueItem,
  type Report,
} from '../forumStore';
import {
  resyncForumDetailSliceStoreForTest,
} from '../use-forum-detail-store';
import { resyncForumListSliceStoreForTest } from '../use-forum-list-store';
import {
  resyncForumModerationSliceStoreForTest,
} from '../use-forum-moderation-store';

const storeDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const makeForum = (overrides: Partial<Forum> = {}): Forum => ({
  id: 'forum-1',
  name: 'Forum One',
  slug: 'forum-one',
  description: 'A forum',
  iconUrl: null,
  bannerUrl: null,
  customCss: null,
  isNsfw: false,
  isPrivate: false,
  isPublic: true,
  memberCount: 10,
  threadCount: 2,
  postCount: 8,
  score: 12,
  upvotes: 15,
  downvotes: 3,
  hotScore: 20,
  weeklyScore: 7,
  featured: false,
  userVote: 0,
  categories: [],
  moderators: [],
  isSubscribed: false,
  isMember: true,
  ownerId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeQueueItem = (): ModerationQueueItem => ({
  id: 'queue-1',
  itemType: 'post',
  itemId: 'post-1',
  authorId: 'user-1',
  authorUsername: 'tricker',
  forumId: 'forum-1',
  forumName: 'Forum One',
  title: 'Needs review',
  content: 'Queued content',
  reason: 'manual',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
});

const makeReport = (): Report => ({
  id: 'report-1',
  reportType: 'post',
  itemId: 'post-1',
  reportedBy: 'user-2',
  reportedByUsername: 'reporter',
  reason: 'spam',
  status: 'open',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

function resyncSlices() {
  resyncForumListSliceStoreForTest();
  resyncForumDetailSliceStoreForTest();
  resyncForumModerationSliceStoreForTest();
}

afterEach(() => {
  useForumStore.getState().reset();
  resyncSlices();
});

describe('forum slice stores', () => {
  it('keeps list state in its own synchronized store', () => {
    const forum = makeForum();

    useForumStore.setState({
      forums: [forum],
      subscribedForums: [forum],
      isLoadingForums: true,
      sortBy: 'new',
    });
    resyncForumListSliceStoreForTest();

    const listState = useForumListSliceStore.getState();
    expect(listState.forums).toEqual([forum]);
    expect(listState.subscribedForums).toEqual([forum]);
    expect(listState.isLoadingForums).toBe(true);
    expect(listState.sortBy).toBe('new');
    expect(listState.fetchForums).toBe(useForumStore.getState().fetchForums);
    expect('posts' in listState).toBe(false);
    expect(useForumListSliceStore).not.toBe(useForumStore);
  });

  it('keeps detail state in its own synchronized store', () => {
    const forum = makeForum({ id: 'forum-2', slug: 'forum-two' });

    useForumStore.setState({
      currentForum: forum,
      isLoadingPosts: true,
      hasMorePosts: false,
    });
    resyncForumDetailSliceStoreForTest();

    const detailState = useForumDetailSliceStore.getState();
    expect(detailState.currentForum).toEqual(forum);
    expect(detailState.isLoadingPosts).toBe(true);
    expect(detailState.hasMorePosts).toBe(false);
    expect(detailState.fetchForum).toBe(useForumStore.getState().fetchForum);
    expect('forums' in detailState).toBe(false);
    expect(useForumDetailSliceStore).not.toBe(useForumStore);
  });

  it('keeps moderation state in its own synchronized store', () => {
    const queueItem = makeQueueItem();
    const report = makeReport();

    useForumStore.setState({
      moderationQueue: [queueItem],
      reports: [report],
    });
    resyncForumModerationSliceStoreForTest();

    const moderationState = useForumModerationSliceStore.getState();
    expect(moderationState.moderationQueue).toEqual([queueItem]);
    expect(moderationState.reports).toEqual([report]);
    expect(moderationState.resolveReport).toBe(useForumStore.getState().resolveReport);
    expect('currentForum' in moderationState).toBe(false);
    expect(useForumModerationSliceStore).not.toBe(useForumStore);
  });

  it('prevents slice hooks from regressing back to direct monolith selectors', () => {
    for (const file of [
      'use-forum-list-store.ts',
      'use-forum-detail-store.ts',
      'use-forum-moderation-store.ts',
    ]) {
      const source = readFileSync(resolve(storeDir, file), 'utf8');
      expect(source).not.toMatch(/return\s+useForumStore\s*\(\s*select/i);
      expect(source).toMatch(/forum(?:List|Detail|Moderation)SliceBinding/);
      expect(source).toMatch(/useForum(?:List|Detail|Moderation)SliceStore/);
    }

    const implSource = readFileSync(resolve(storeDir, 'forumStore.impl.ts'), 'utf8');
    expect(implSource).toContain('selectForumListSlice');
    expect(implSource).toContain('selectForumDetailSlice');
    expect(implSource).toContain('selectForumModerationSlice');
  });
});
