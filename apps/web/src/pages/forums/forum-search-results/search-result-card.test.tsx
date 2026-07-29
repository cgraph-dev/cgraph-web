import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ForumSearchResult } from '@/modules/forums/store/forumStore.types';
import { SearchResultCard } from './search-result-card';

const result: ForumSearchResult = {
  type: 'post',
  id: 'post-42',
  title: 'Private groups',
  contentPreview: 'Private groups keep conversations focused.',
  author: { id: 'user-1', username: 'trick' },
  forum: { id: 'forum-1', name: 'CGraph', slug: 'cgraph' },
  board: { id: 'board-1', name: 'Privacy', slug: 'privacy' },
  score: 12,
  rank: 1,
  createdAt: '2026-07-29T10:00:00.000Z',
  highlights: ['private', 'groups'],
};

function renderCard(searchResult: ForumSearchResult = result) {
  return render(
    <MemoryRouter>
      <SearchResultCard result={searchResult} />
    </MemoryRouter>
  );
}

describe('SearchResultCard', () => {
  it('links the result to its forum post destination', () => {
    renderCard();

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/forums/cgraph/post/post-42'
    );
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('highlights all supplied terms without changing the source copy', () => {
    const { container } = renderCard();

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Private groups'
    );
    expect(container.querySelectorAll('mark')).toHaveLength(4);
    expect(
      screen.getByText((_, element) => {
        return (
          element?.tagName === 'P' &&
          element.textContent === 'Private groups keep conversations focused.'
        );
      })
    ).toBeVisible();
  });

  it('uses semantic time metadata and a decorative avatar fallback', () => {
    const { container } = renderCard();

    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-07-29T10:00:00.000Z'
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
