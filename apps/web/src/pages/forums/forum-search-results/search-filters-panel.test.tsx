import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchFiltersPanel } from './search-filters-panel';

describe('SearchFiltersPanel', () => {
  it('exposes result types as a pressed-state mode group', () => {
    render(
      <SearchFiltersPanel
        filters={{ type: 'post' }}
        onFiltersChange={vi.fn()}
      />
    );

    expect(screen.getByRole('group', { name: 'Result type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Posts' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Threads' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('updates one type without dropping existing filters', () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchFiltersPanel
        filters={{ type: 'post', sort: 'newest' }}
        onFiltersChange={onFiltersChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Threads' }));
    expect(onFiltersChange).toHaveBeenCalledWith({ type: 'thread', sort: 'newest' });
  });

  it('labels and updates sort and date controls', () => {
    const onFiltersChange = vi.fn();
    render(
      <SearchFiltersPanel
        filters={{ sort: 'relevance', dateFrom: '2026-07-01' }}
        onFiltersChange={onFiltersChange}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort results' }), {
      target: { value: 'most_votes' },
    });
    expect(onFiltersChange).toHaveBeenCalledWith({
      sort: 'most_votes',
      dateFrom: '2026-07-01',
    });

    fireEvent.change(screen.getByLabelText('Results to date'), {
      target: { value: '2026-07-29' },
    });
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      sort: 'relevance',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-29',
    });
  });
});
