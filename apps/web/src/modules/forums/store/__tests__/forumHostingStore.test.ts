import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useForumHostingStore } from '../forumHostingStore.impl';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const { api } = await import('@/lib/api');
const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
  patch: api.patch as MockedFunction<typeof api.patch>,
};

const makeBoardApi = (overrides = {}) => ({
  id: 'b1',
  forum_id: 'f1',
  name: 'General',
  slug: 'general',
  description: 'desc',
  icon: null,
  position: 0,
  parent_board_id: null,
  is_locked: false,
  is_hidden: false,
  thread_count: 5,
  post_count: 10,
  last_post_at: null,
  last_post_title: null,
  last_post_author: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const makeThreadApi = (overrides = {}) => ({
  id: 't1',
  board_id: 'b1',
  author_id: 'u1',
  title: 'Thread 1',
  slug: 'thread-1',
  content: 'hello',
  content_html: '<p>hello</p>',
  thread_type: 'normal',
  is_locked: false,
  is_pinned: false,
  is_hidden: false,
  prefix: null,
  prefix_color: null,
  view_count: 0,
  reply_count: 0,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  last_post_at: null,
  last_reply_at: null,
  last_reply_by: null,
  author: null,
  last_poster: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const makePostApi = (overrides = {}) => ({
  id: 'p1',
  thread_id: 't1',
  author_id: 'u1',
  content: 'Post',
  content_html: '<p>Post</p>',
  is_edited: false,
  edit_count: 0,
  edit_reason: null,
  edited_at: null,
  is_hidden: false,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  position: 1,
  reply_to_id: null,
  author: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const getInitialState = () => ({
  boards: [],
  currentBoard: null,
  isLoadingBoards: false,
  threads: [],
  currentThread: null,
  threadsMeta: null,
  isLoadingThreads: false,
  posts: [],
  postsMeta: null,
  isLoadingPosts: false,
  members: [],
  membersMeta: null,
  isLoadingMembers: false,
});

beforeEach(() => {
  useForumHostingStore.setState(getInitialState());
  vi.clearAllMocks();
});

// Initial State

describe('forumHostingStore initial state', () => {
  it('has empty boards', () => {
    expect(useForumHostingStore.getState().boards).toEqual([]);
  });
  it('has no current board', () => {
    expect(useForumHostingStore.getState().currentBoard).toBeNull();
  });
  it('has empty threads', () => {
    expect(useForumHostingStore.getState().threads).toEqual([]);
  });
  it('is not loading', () => {
    const s = useForumHostingStore.getState();
    expect(s.isLoadingBoards).toBe(false);
    expect(s.isLoadingThreads).toBe(false);
    expect(s.isLoadingPosts).toBe(false);
  });
});

// Board Actions

describe('fetchBoards', () => {
  it('fetches and maps boards', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [makeBoardApi()] });
    await useForumHostingStore.getState().fetchBoards('f1');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
    expect(useForumHostingStore.getState().boards[0]!.name).toBe('General');
    expect(useForumHostingStore.getState().isLoadingBoards).toBe(false);
  });

  it('sets loading false on error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(useForumHostingStore.getState().fetchBoards('f1')).rejects.toThrow('fail');
    expect(useForumHostingStore.getState().isLoadingBoards).toBe(false);
  });
});

describe('fetchBoard', () => {
  it('fetches a single board', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: makeBoardApi({ id: 'b2' }) } });
    const board = await useForumHostingStore.getState().fetchBoard('b2');
    expect(board.id).toBe('b2');
    expect(useForumHostingStore.getState().currentBoard?.id).toBe('b2');
  });
});

describe('createBoard', () => {
  it('creates and appends a board', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: makeBoardApi({ id: 'b3' }) });
    const board = await useForumHostingStore.getState().createBoard('f1', { name: 'New' });
    expect(board.id).toBe('b3');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
  });
});

describe('updateBoard', () => {
  it('updates a board in the list', async () => {
    useForumHostingStore.setState({ boards: [{ id: 'b1', name: 'Old' }] as never });
    mockedApi.patch.mockResolvedValueOnce({ data: makeBoardApi({ name: 'Updated' }) });
    const board = await useForumHostingStore
      .getState()
      .updateBoard('f1', 'b1', { name: 'Updated' });
    expect(board.name).toBe('Updated');
    expect(useForumHostingStore.getState().boards[0]!.name).toBe('Updated');
  });
});

describe('deleteBoard', () => {
  it('removes a board from the list', async () => {
    useForumHostingStore.setState({ boards: [{ id: 'b1' }, { id: 'b2' }] as never });
    mockedApi.delete.mockResolvedValueOnce({ data: {} });
    await useForumHostingStore.getState().deleteBoard('f1', 'b1');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
    expect(useForumHostingStore.getState().boards[0]!.id).toBe('b2');
  });
});

// Thread Actions

describe('fetchThreads', () => {
  it('fetches threads for a board', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [makeThreadApi()] });
    await useForumHostingStore.getState().fetchThreads('b1');
    expect(useForumHostingStore.getState().threads).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingThreads).toBe(false);
  });
});

describe('fetchRecentThreads', () => {
  it('replaces the first page, appends the next page, and removes cursor duplicates', async () => {
    useForumHostingStore.setState({ threads: [{ id: 'stale-thread' }] as never });
    mockedApi.get.mockResolvedValueOnce({
      status: 200,
      data: {
        data: [makeThreadApi({ id: 't1' }), makeThreadApi({ id: 't2' })],
        page_info: {
          has_next_page: true,
          has_previous_page: false,
          start_cursor: 'start',
          end_cursor: 'next-page',
        },
      },
    });

    await useForumHostingStore.getState().fetchRecentThreads('f1');

    expect(mockedApi.get).toHaveBeenLastCalledWith('/api/v1/forums/f1/threads', {
      params: { cursor: undefined, limit: 20, sort: 'latest' },
    });
    expect(useForumHostingStore.getState().threads.map(({ id }) => id)).toEqual(['t1', 't2']);
    expect(useForumHostingStore.getState().threadsMeta).toMatchObject({
      cursor: 'next-page',
      hasNextPage: true,
    });

    mockedApi.get.mockResolvedValueOnce({
      status: 200,
      data: {
        data: [makeThreadApi({ id: 't2' }), makeThreadApi({ id: 't3' })],
        page_info: {
          has_next_page: false,
          has_previous_page: true,
          start_cursor: 'next-page',
          end_cursor: 'last-page',
        },
      },
    });

    await useForumHostingStore
      .getState()
      .fetchRecentThreads('f1', { cursor: 'next-page' });

    expect(useForumHostingStore.getState().threads.map(({ id }) => id)).toEqual([
      't1',
      't2',
      't3',
    ]);
    expect(useForumHostingStore.getState().threadsMeta).toMatchObject({
      cursor: 'last-page',
      hasNextPage: false,
      total: 3,
    });
  });
});

describe('createThread', () => {
  it('creates and prepends a thread', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: makeThreadApi({ id: 't2' }) });
    const thread = await useForumHostingStore
      .getState()
      .createThread('b1', { title: 'New', content: 'body' });
    expect(thread.id).toBe('t2');
    expect(useForumHostingStore.getState().threads[0]!.id).toBe('t2');
  });
});

describe('deleteThread', () => {
  it('removes a thread from the list', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1' }] as never });
    mockedApi.delete.mockResolvedValueOnce({ data: {} });
    await useForumHostingStore.getState().deleteThread('t1');
    expect(useForumHostingStore.getState().threads).toHaveLength(0);
  });
});

describe('pinThread', () => {
  it('pins a thread', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1', isPinned: false }] as never });
    mockedApi.post.mockResolvedValueOnce({ data: makeThreadApi({ id: 't1', is_pinned: true }) });
    await useForumHostingStore.getState().pinThread('t1', true);
    expect(useForumHostingStore.getState().threads[0]!.isPinned).toBe(true);
  });
});

describe('lockThread', () => {
  it('locks a thread', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1', isLocked: false }] as never });
    mockedApi.post.mockResolvedValueOnce({ data: makeThreadApi({ id: 't1', is_locked: true }) });
    await useForumHostingStore.getState().lockThread('t1', true);
    expect(useForumHostingStore.getState().threads[0]!.isLocked).toBe(true);
  });
});

// Post Actions

describe('fetchPosts', () => {
  it('fetches posts for a thread', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [makePostApi()] });
    await useForumHostingStore.getState().fetchPosts('t1');
    expect(useForumHostingStore.getState().posts).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingPosts).toBe(false);
  });
});

describe('createPost', () => {
  it('creates and appends a post', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: makePostApi({ id: 'p2' }) });
    const post = await useForumHostingStore.getState().createPost('t1', { content: 'reply' });
    expect(post.id).toBe('p2');
    expect(useForumHostingStore.getState().posts).toHaveLength(1);
  });
});

describe('deletePost', () => {
  it('removes a post', async () => {
    useForumHostingStore.setState({ posts: [{ id: 'p1' }] as never });
    mockedApi.delete.mockResolvedValueOnce({ data: {} });
    await useForumHostingStore.getState().deletePost('t1', 'p1');
    expect(useForumHostingStore.getState().posts).toHaveLength(0);
  });
});

// Member Actions

describe('fetchMembers', () => {
  it('fetches members for a forum', async () => {
    const member = {
      id: 'm1',
      forum_id: 'f1',
      user_id: 'u1',
      display_name: 'User',
      title: null,
      signature: null,
      avatar_url: null,
      post_count: 0,
      thread_count: 0,
      reputation: 0,
      role: 'member',
      is_banned: false,
      joined_at: '2025-01-01T00:00:00Z',
      last_visit_at: null,
    };
    mockedApi.get.mockResolvedValueOnce({ data: [member] });
    await useForumHostingStore.getState().fetchMembers('f1');
    expect(useForumHostingStore.getState().members).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingMembers).toBe(false);
  });

  it('sets loading false on error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(useForumHostingStore.getState().fetchMembers('f1')).rejects.toThrow();
    expect(useForumHostingStore.getState().isLoadingMembers).toBe(false);
  });

  it('appends a cursor page without duplicating an existing membership', async () => {
    const first = {
      id: 'm1',
      forum_id: 'f1',
      user_id: 'u1',
      display_name: 'First',
      role: 'member',
    };
    const second = {
      ...first,
      id: 'm2',
      user_id: 'u2',
      display_name: 'Second',
    };
    useForumHostingStore.setState({
      members: [
        {
          id: 'm1',
          forumId: 'f1',
          userId: 'u1',
          displayName: 'First',
          title: null,
          signature: null,
          avatarUrl: null,
          postCount: 0,
          threadCount: 0,
          reputation: 0,
          role: 'member',
          isBanned: false,
          joinedAt: null,
          lastVisitAt: null,
        },
      ],
    });
    mockedApi.get.mockResolvedValueOnce({
      status: 200,
      data: {
        data: [first, second],
        page_info: {
          has_next_page: false,
          has_previous_page: true,
          start_cursor: 'next-page',
          end_cursor: 'last-page',
        },
      },
    });

    await useForumHostingStore
      .getState()
      .fetchMembers('f1', { cursor: 'next-page', limit: 25 });

    expect(mockedApi.get).toHaveBeenLastCalledWith('/api/v1/forums/f1/members', {
      params: { cursor: 'next-page', limit: 25 },
    });
    expect(useForumHostingStore.getState().members.map(({ id }) => id)).toEqual(['m1', 'm2']);
    expect(useForumHostingStore.getState().membersMeta).toMatchObject({
      cursor: 'last-page',
      hasNextPage: false,
      total: 2,
    });
  });
});
