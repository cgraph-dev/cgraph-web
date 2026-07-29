import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CategoryBar from '../category-bar';
import { ExploreFilterBar } from '../explore-filter-bar';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
] as const;

describe('ExploreFilterBar', () => {
  it('forwards search and sort changes through the shared field controls', () => {
    const onSearchChange = vi.fn();
    const onSortChange = vi.fn();

    render(
      <ExploreFilterBar
        search=""
        searchLabel="Search communities"
        searchPlaceholder="Search communities..."
        sort="popular"
        sortLabel="Sort communities"
        sortOptions={SORT_OPTIONS}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Search communities' }), {
      target: { value: 'design' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort communities' }), {
      target: { value: 'newest' },
    });

    expect(onSearchChange).toHaveBeenCalledWith('design');
    expect(onSortChange).toHaveBeenCalledWith('newest');
  });
});

describe('CategoryBar', () => {
  it('exposes selected state and toggles a selected category off', () => {
    const onSelect = vi.fn();

    render(
      <CategoryBar
        categories={['design', 'science']}
        selected="design"
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('button', { name: 'design' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    fireEvent.click(screen.getByRole('button', { name: 'design' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
