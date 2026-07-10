import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { FeedPostCard } from './feed-post-card';

vi.mock('@/modules/pulse/components/pulse-reactions', () => ({
  PulseReactions: ({ contentId, contentType, authorId, forumId }: Record<string, string>) => (
    <div
      data-author-id={authorId}
      data-content-id={contentId}
      data-content-type={contentType}
      data-forum-id={forumId}
      data-testid="pulse-reactions"
    />
  ),
}));

describe('FeedPostCard', () => {
  it('passes the thread board parent forum id to Pulse reactions', () => {
    render(
      <MemoryRouter>
        <FeedPostCard
          thread={{
            id: 'thread-1',
            title: 'Thread title',
            slug: 'thread-title',
            content_preview: null,
            thread_type: 'normal',
            is_locked: false,
            is_pinned: false,
            is_content_gated: false,
            gate_price_nodes: null,
            view_count: 0,
            reply_count: 0,
            score: 0,
            hot_score: 0,
            weighted_resonates: 0,
            author: { id: 'author-1', username: 'author' },
            board: { id: 'board-1', forum_id: 'forum-1', name: 'General' },
            created_at: '2026-07-10T00:00:00.000Z',
            updated_at: '2026-07-10T00:00:00.000Z',
          }}
        />
      </MemoryRouter>
    );

    const reactions = screen.getByTestId('pulse-reactions');
    expect(reactions).toHaveAttribute('data-content-id', 'thread-1');
    expect(reactions).toHaveAttribute('data-content-type', 'thread');
    expect(reactions).toHaveAttribute('data-author-id', 'author-1');
    expect(reactions).toHaveAttribute('data-forum-id', 'forum-1');
  });
});
