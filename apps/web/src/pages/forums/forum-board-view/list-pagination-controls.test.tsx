import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { ForumMember, Thread } from '@/modules/forums/store';
import { MembersList } from './members-list';
import { ThreadsList } from './threads-list';

const thread: Thread = {
  id: 'thread-1',
  boardId: 'board-1',
  authorId: 'user-1',
  title: 'Cursor contracts',
  slug: 'cursor-contracts',
  content: null,
  contentHtml: null,
  threadType: 'normal',
  isLocked: false,
  isPinned: false,
  isHidden: false,
  prefix: null,
  prefixColor: null,
  viewCount: 2,
  replyCount: 1,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  lastPostAt: null,
  lastReplyAt: null,
  lastReplyBy: null,
  author: null,
  lastPoster: null,
  createdAt: '2026-07-30T00:00:00Z',
  insertedAt: '2026-07-30T00:00:00Z',
  updatedAt: '2026-07-30T00:00:00Z',
};

const member: ForumMember = {
  id: 'membership-1',
  forumId: 'forum-1',
  userId: 'user-1',
  displayName: 'Forum member',
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
};

describe('forum board cursor controls', () => {
  it('refreshes and loads another thread page', () => {
    const onRefresh = vi.fn();
    const onLoadMore = vi.fn();

    render(
      <MemoryRouter>
        <ThreadsList
          threads={[thread]}
          forumSlug="forum"
          isLoading={false}
          hasNextPage
          onRefresh={onRefresh}
          onLoadMore={onLoadMore}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load more threads' }));

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('keeps thread refresh available after an empty first page', () => {
    const onRefresh = vi.fn();

    render(
      <MemoryRouter>
        <ThreadsList
          threads={[]}
          forumSlug="forum"
          isLoading={false}
          hasNextPage={false}
          onRefresh={onRefresh}
          onLoadMore={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(screen.getByText('No Threads Yet')).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('keeps member filters mounted while another member page is available', () => {
    const onRefresh = vi.fn();
    const onLoadMore = vi.fn();

    render(
      <MemoryRouter>
        <MembersList
          members={[member]}
          isLoading={false}
          search=""
          onSearchChange={vi.fn()}
          sort="recent"
          onSortChange={vi.fn()}
          hasNextPage
          onRefresh={onRefresh}
          onLoadMore={onLoadMore}
        />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load more members' }));

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
