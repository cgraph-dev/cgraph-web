import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForumSearchResults from './index';

const forumState = vi.hoisted(() => ({
  searchResults: [],
  searchLoading: false,
  searchHasMore: false,
  searchQuery: '',
  searchFilters: {},
  searchForums: vi.fn(),
  searchMore: vi.fn(),
  clearSearch: vi.fn(),
}));

vi.mock('@/modules/forums/store', () => ({
  useForumStore: () => forumState,
}));

vi.mock('./search-filters-panel', () => ({
  SearchFiltersPanel: () => <div>Search filters</div>,
}));

vi.mock('./search-result-card', () => ({
  SearchResultCard: () => <div>Search result</div>,
}));

function renderSearchPage(entry = '/forums/search') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/forums/search" element={<ForumSearchResults />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForumSearchResults', () => {
  beforeEach(() => {
    forumState.searchResults = [];
    forumState.searchLoading = false;
    forumState.searchHasMore = false;
    forumState.searchQuery = '';
    forumState.searchFilters = {};
    vi.clearAllMocks();
  });

  it('renders an accessible initial search form and empty state', () => {
    renderSearchPage();

    expect(screen.getByRole('textbox', { name: 'Search forums' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('type', 'submit');
    expect(screen.getByText('Search the forums')).toBeInTheDocument();
  });

  it('exposes inline search progress without showing an empty state', () => {
    forumState.searchLoading = true;
    forumState.searchQuery = 'privacy';
    renderSearchPage('/forums/search?q=privacy');

    expect(screen.getByRole('status', { name: 'Searching forums' })).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('starts a URL-driven search with the existing filters', async () => {
    forumState.searchFilters = { type: 'post', sort: 'newest' };
    renderSearchPage();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search forums' }), {
      target: { value: 'nodes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(forumState.searchForums).toHaveBeenCalledWith('nodes', {
        type: 'post',
        sort: 'newest',
      });
    });
  });
});
